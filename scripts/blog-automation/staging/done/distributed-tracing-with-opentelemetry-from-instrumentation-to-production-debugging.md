<!--EXCERPT-->
A checkout that took eight seconds once in a while took two weeks to find. One trace found it in twenty minutes — after I stopped trusting the dashboards.
<!--BODY-->
# Distributed Tracing with OpenTelemetry: From Instrumentation to Production Debugging

The ticket said "checkout is slow sometimes," which has to be the most useless sentence in all of support. It sat in the queue for three days, because "sometimes" does not get you a pager. Then a customer who had waited eight seconds for a payment screen emailed the CEO, and suddenly the slow checkout was my problem.

I have been doing this for twelve years. I knew the drill: reproduce, isolate, fix. What I did not know yet was that this bug could not be reproduced on a laptop, would not show up in logs, and was mathematically invisible in my dashboards. It only happened in production, only on certain orders, and only when the stars aligned. It took me two weeks and one badly configured tracing stack to find it. The fix took an afternoon. This is the story of the two weeks, and the parts of OpenTelemetry that actually earned their keep.

## The slow checkout

The service I was debugging was a payments platform — not huge, but not small either. A checkout request crossed six services: the web front end, the cart service, the orders service, a risk-check service, the payments service, and a notification worker. The customer's request went through all of them in sequence, with one detour through a message queue in the middle.

My logs were clean. No errors, no stack traces, no timeouts logged anywhere. My dashboards were flat: p99 latency looked perfectly ordinary, because the slow path hit maybe one request in two hundred, and averages are very good at hiding one-in-two-hundred problems. My alerts were silent. I had correlation IDs, which told me which request was slow — and nothing about why. Correlation IDs are a receipt, not an investigation.

That is the trap. When logs and metrics all look fine, the natural conclusion is that the problem is flaky and probably the network. The network is a great scapegoat; it never files a rebuttal.

## Week one: the wrong guesses

My first theory was the database. Lock contention, a bad index, a connection pool that was too small. I added query instrumentation to the orders service, watched for a day, and saw nothing. The database was bored.

Theory two: the cache. Some orders triggered a cold path through Redis — a customer who had not shopped in months, a session that expired, a price lookup that missed. Plausible, and also wrong. I added cache-hit metrics and the misses did not line up with the slow requests.

Theory three: the risk vendor. Every order over a certain amount went to a third-party fraud scoring API, and vendors are slow sometimes. I opened a ticket with them. They said their side looked normal. I believed them, because I had no way to check.

I also tried the staging gambit. Rebuilt the flow on staging, hammered it with load, reproduced nothing. Of course I reproduced nothing — the staging environment did not have real vendor traffic, real queue depth, or real retry behavior. The bug was a production animal, and I was looking for it in a zoo.

Here is the honest part: I had three plausible stories and no way to test any of them, because our tracing was mostly theater. We had OpenTelemetry deployed — agents in every pod, an exporter running, a Jaeger instance somebody had set up and forgotten. But three of the six services actually sent traces. The others dropped them silently, usually because the exporter was down or the agent was misconfigured and nobody had noticed. And the worst part: the orders service handed work to a queue — SQS, in our case — and the trace context died at that hop.

Every trace I opened showed the same shape: request enters the web front end, then a gap, then a response. A gap is not a trace. A gap is a receipt with a nice waterfall chart around it. I had built a dashboard for a story I could not see.

## The day I stopped guessing

The change came when I stopped treating tracing as a dashboard and started treating it as a chain. A trace is only as good as its weakest hop. Two hops were broken: the queue, and the risk service, which had zero manual spans and only whatever the agent auto-instrumented.

First fix: propagate the trace context across the queue. OpenTelemetry handles this with a few lines — inject the context into the message on the way in, extract it on the way out:

```python
# producer side
from opentelemetry import propagate

def publish_order(order_id: str):
    carrier = {}
    propagate.inject(carrier)  # writes traceparent into the message
    queue.send({"order_id": order_id, **carrier})
```

```python
# consumer side
from opentelemetry import propagate, trace

def handle_order(message):
    ctx = propagate.extract(message)
    with trace.start_as_current_span("orders.handle", context=ctx):
        run_order_workflow(message["order_id"])
```

Second fix: real spans in the risk service, with attributes that would actually help me later. This is the part I used to skip, and it is the part that matters:

```python
from opentelemetry import trace

tracer = trace.get_tracer("payments.risk")

def check_order(order_id: str) -> RiskVerdict:
    with tracer.start_as_current_span("risk.check") as span:
        span.set_attribute("order.id", order_id)
        for attempt in range(1, 4):
            with tracer.start_as_current_span("risk.vendor_call") as call:
                call.set_attribute("attempt", attempt)
                try:
                    return vendor.score(order_id)
                except TimeoutError:
                    call.record_exception(sys.exc_info())
                    span.add_event("vendor_timeout", {"attempt": attempt})
        raise RiskUnavailable(order_id)
```

That is not fancy code. It is three attributes and an event. But it turned the risk service from a black box into a witness.

The next incident happened that same week — because of course it did. This time I opened the trace instead of the logs. The whole story was there: 6.9 seconds, and 6.3 of them inside risk.vendor_call. Three attempts, and every single one ended in vendor_timeout at 2.3 seconds.

That was the bug. Not the database, not the cache, not the network. Our risk vendor was slow — 2.3 seconds to respond — and our timeout was two seconds, and our retry count was three, and the retry logic multiplied a 2.3-second problem into a seven-second one. The dashboards had averaged it into the noise. The trace could not average anything. That is the whole argument for tracing in one incident: metrics tell you something is wrong with the fleet, traces tell you which call is wrong.

We fixed it in an afternoon: raised the timeout, cut the retries to one, and added a circuit breaker. The vendor fixed their side within a week. The customer got an apology email.

## Sampling: the honest cost of tracing

Now the part the conference talks skip. Tracing is not free. Every span costs CPU, every export costs network, every stored trace costs disk and money. When we turned on full tracing everywhere, the trace store bill went up embarrassingly fast, and the collector started dropping spans under load — which is exactly how you end up with gaps again.

The fix is sampling, and you should decide your sampling strategy before you need it, not after your first big incident. We run this in production:

```
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1
```

Ten percent of traces, and parent-based, so every span in a sampled trace survives — a child span is never dropped while its parent is kept. That alone cut our trace storage to a tenth and our exporter load with it. For the paths we care about most, we keep a collector rule that always retains checkout traces, so the slowest and most important flow stays fully visible:

```yaml
processors:
  batch:
    timeout: 5s
    send_batch_size: 512
  tail_sampling:
    policies:
      - name: keep-checkout
        type: always_sample
        condition: 'IsMatch(attributes["http.route"], ".*checkout.*")'
exporters:
  otlp:
    endpoint: http://otel-collector:4317
service:
  pipelines:
    traces:
      processors: [tail_sampling, batch]
```

Ten percent sampling is a fine default for most services. You will hear people say you need 100% because "traces are small." Traces are small. A few hundred thousand of them a day are not. Sample early and sample by parent, and keep the hot paths at full fidelity.

The overhead I did not budget for was not CPU or disk. It was maintenance. Span names drift — someone renames a method and the span name changes with it, and your queries break quietly. Attributes stop being set. An exporter gets disabled "temporarily" to save resources and stays disabled for a quarter. The agent handles HTTP automatically, but anything asynchronous — queues, background jobs, streams — needs manual instrumentation, and manual instrumentation needs a review habit, not a one-time effort.

## What I would tell my past self

If I could go back to day one of that ticket, here is what I would tell myself.

First, a trace is only as good as its weakest hop. Instrument the whole path or do not bother. A trace that stops at the queue is a receipt, and receipts do not debug.

Second, span names and attributes are the product. The pretty waterfall is decoration. The three attributes I added to risk.check are what made the incident solvable in twenty minutes. Decide, as a team, what every span must carry — order id, vendor, attempt count — and review it like code.

Third, decide sampling before you need it. Parent-based sampling at ten percent, hot paths at full fidelity, and a collector that can drop load gracefully instead of failing.

Fourth, dashboards average. Traces do not. If a bug is rare and intermittent, metrics will keep lying to you by design. That is not a failure of your metrics; it is what averages are for. You need a tool that keeps the individual request, and OpenTelemetry is that tool when it is actually wired end to end.

The slow checkout is long gone. The vendor fixed their latency, the circuit breaker retired, and the ticket is closed. What I kept is the plumbing: the queue propagation, the span attributes, the sampler. Not because the waterfall charts are prettier now — they are — but because next time, the trace will tell me the truth before I can invent a story.
