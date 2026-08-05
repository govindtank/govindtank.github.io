<!--EXCERPT-->
Twelve years of running sidecars in Kubernetes, distilled into the configs I actually use and the cases where I refuse to run one at all.

<!--BODY-->
# Kubernetes Sidecar Patterns for Service Mesh Observability in 2026

I've run Kubernetes in production for over a decade, and I've watched the sidecar go from a clever trick to the default answer for anything observability-shaped. Add a proxy, add a log shipper, add a metrics exporter — each one a container parked next to your app, doing work your app used to do itself. It works. It also costs real money in CPU, memory, startup time, and debugging hours, and most tutorials pretend that cost doesn't exist.

This one won't. I'm going to show you the sidecar pattern I actually run in front of my services in 2026: the pod spec, the Envoy config that produces telemetry worth looking at, and how I scrape it. Then I'll spend the second half of this post on the cases where I refuse to run a sidecar at all. Knowing when to skip it is half the job.

## Step 1: decide what telemetry you actually need

The fastest way to waste a weekend is to install a service mesh and then realize you don't know what you're looking at. So before any YAML, write down three answers.

Access logs: who called whom, when, and what status came back. The sidecar sees every request that crosses the pod boundary, including ones your app never sees — TLS handshake failures, routing errors, requests rejected before they reach the container. That blind spot is the strongest argument for sidecar telemetry over app-level logging: the proxy records the traffic your application can't.

Metrics: request rate, error rate, and latency percentiles. Tom Wilkie's RED method — rate, errors, duration — maps cleanly onto what a mesh proxy can observe, and it's the dashboard set I recommend to every team. Add connection counts and retry counts once you outgrow the basics.

Traces: how a request flows across services and where the time goes. Traces are the most expensive telemetry to store and the noisiest to operate. My default is metrics first, access logs second, and traces only when a specific investigation demands them.

You don't need all three on day one. Most teams I've worked with never look at traces. Start lean, and you'll avoid the dashboard graveyard that every over-instrumented cluster ends up with.

## Step 2: put the sidecar in the pod

The classic shape is a pod with your app container plus an Envoy sidecar that intercepts traffic and exports telemetry. In 2026 most people get this from Istio's automatic injection — label the namespace, a mutating webhook rewrites every pod — and that's the right call at scale. But I still like writing it out by hand once, because injection is easier to trust when you've seen what it produces:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: payments-api
  labels:
    app: payments-api
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "15090"
spec:
  containers:
    - name: app
      image: registry.example.com/payments-api:1.4.2
      ports:
        - containerPort: 8080
    - name: envoy
      image: envoyproxy/envoy:v1.30.0
      args:
        - -c
        - /etc/envoy/envoy.yaml
      ports:
        - containerPort: 15090
          name: http-metrics
      resources:
        requests:
          cpu: 100m
          memory: 128Mi
        limits:
          cpu: 500m
          memory: 512Mi
      volumeMounts:
        - name: envoy-config
          mountPath: /etc/envoy
  volumes:
    - name: envoy-config
      configMap:
        name: envoy-sidecar-config
```

Two details worth stealing from this. First, the sidecar gets its own explicit resource requests and limits. If you let it float, it eats whatever the node has and capacity planning becomes a guessing game. Second, the metrics port is named and annotated so Prometheus can find it without a ServiceMonitor — one less moving part on a small cluster.

One thing injection handles that hand-written specs often get wrong: startup ordering. Your app must not send traffic until the sidecar is ready to catch it. Istio wires this up automatically and offers holdApplicationUntilProxyStarts for strict ordering. If you write the pod by hand, add a startup probe to the app container and keep the sidecar's readiness in front of it. I've debugged production outages caused by exactly this race, and they're miserable, because the app itself looks perfectly healthy while requests vanish into the void.

## Step 3: configure Envoy to emit telemetry

An Envoy sidecar that logs nothing and exports nothing is just an expensive way to add latency. Here's the config shape I ship for a service that needs access logs plus metrics:

```yaml
static_resources:
  listeners:
    - name: inbound_http
      address:
        socket_address: { address: 0.0.0.0, port_value: 8081 }
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                codec_type: AUTO
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: local_service
                      domains: ["*"]
                      routes:
                        - match: { prefix: "/" }
                          route: { cluster: payments_api }
                access_log:
                  - name: envoy.access_loggers.file
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
                      path: /dev/stdout
                      format: '[%START_TIME%] "%REQ(:METHOD)% %REQ(:PATH)%" %RESPONSE_CODE% %DURATION%ms %BYTES_SENT%'
  clusters:
    - name: payments_api
      connect_timeout: 0.25s
      type: STRICT_DNS
      load_assignment:
        cluster_name: payments_api
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address: { address: 127.0.0.1, port_value: 8080 }
admin:
  access_log_path: /dev/null
  address:
    socket_address: { address: 127.0.0.1, port_value: 9901 }
```

The access log goes to /dev/stdout so kubectl logs and your log aggregator pick it up for free. The format string keeps each line to the fields you'll actually query — start time, method, path, status, duration, bytes sent — instead of Envoy's default verbose blob. If you feed logs into a structured pipeline, switch to the JSON access logger; it costs a little CPU and saves your log-querying team a lot of pain.

Metrics come from Envoy's built-in stats subsystem. The important ones cluster under envoy_cluster_*: upstream_rq_time for latency, upstream_rq_total and upstream_rq_xx for rates and error codes, upstream_cx_active for connection counts. On Istio you'll see the same signals under the istio_ prefix with richer labels. Either way, the stats land on the admin endpoint by default, and you point your scraper at the Prometheus-formatted view on port 15090.

## Step 4: get the metrics out of the pod

Envoy exposes Prometheus-formatted stats at /stats/prometheus. In the pod spec above I told Prometheus to scrape port 15090; on clusters with the Prometheus operator, a ServiceMonitor does the same job with labels and selectors. Verify the sidecar is actually exporting before you build dashboards:

```bash
kubectl exec deploy/payments-api -c envoy -- \
  curl -s localhost:15090/stats/prometheus | \
  grep '^envoy_cluster_upstream_rq_time' | head -5
```

If that returns rows, you have request latency data flowing. Then wire three panels: request rate as rate(envoy_cluster_upstream_rq_total[5m]), error rate from the 5xx buckets, and p99 latency via histogram_quantile(0.99, ...) over the upstream_rq_time histogram. Add an alert for "no data" — that's how you find out a sidecar died before your users do. From there, alerting is a short walk: page when error rate holds above a threshold for five minutes, page when a service's request rate drops to zero, and keep latency alerts wide enough that only real regressions fire.

## When not to use a sidecar

Here's the part tutorials skip. I've stopped recommending sidecars in four situations.

Batch jobs and one-shot pods. A sidecar keeps the pod alive after the main container exits, which means Kubernetes Jobs hang until their timeout kills them. Every team that runs migrations, exports, or cron-style workloads hits this eventually. If your workload finishes and exits, don't attach a sidecar that won't. Use a node-level logger or an SDK that flushes on shutdown instead.

Latency-sensitive, high-throughput services. Every request takes an extra hop through a userspace proxy. For a chatty service doing millions of small calls a day, that overhead shows up in p99 and in the CPU bill. Ambient mesh runs the proxy at the node level instead of per pod, and eBPF-based telemetry from Cilium gets you most of the observability with no proxy in the data path at all. Both are worth a pilot if your traffic is that hot.

Tiny pods on tight budgets. A sidecar roughly doubles memory per replica. If your app runs comfortably in 64Mi, adding a 128Mi proxy means your fleet cost went up substantially for telemetry you might not even use. Run the math before you accept the default injection.

Teams that won't own the mesh. The sidecar is software you now operate. If nobody can read Envoy config or own mesh upgrades, you're shipping a black box into every pod, and every mesh incident becomes a fire drill. That's a support-ticket factory, not an architecture. Small teams are often better off with OpenTelemetry SDKs and a good exporter until they have the appetite for a mesh.

## The bottom line

Sidecars remain the right call for most long-running services. The per-pod isolation is clean, the telemetry is rich, and the mTLS story alone justifies them in many deployments. My rules of thumb: run sidecars for interactive services you operate, skip them for jobs, latency-critical paths, and teams that can't support them, and keep the config boring enough that any engineer on call can read it. The mesh is a tool, not a lifestyle.
