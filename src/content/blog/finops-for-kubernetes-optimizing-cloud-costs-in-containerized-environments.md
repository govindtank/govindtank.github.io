---
title: "FinOps for Kubernetes: Optimizing Cloud Costs in Containerized Environments"
slug: "finops-for-kubernetes-optimizing-cloud-costs-in-containerized-environments"
date: "July 01, 2026"
excerpt: >
coverImage: "https://images.unsplash.com/photo-1564865878688-9a244444042a?auto=format&fit=crop&q=80&w=1200"
category: "DevOps"
readTime: 5
tags:
  - "DevOps"
archetype: "war-story"
---


# FinOps for Kubernetes: Optimizing Cloud Costs in Containerized Environments

The cloud bill came in at $38,400 for the month. Our budget for the year was $240,000, and it was April. Finance forwarded the invoice to the engineering channel with no comment, which is how you know it's bad.

I'd been on the platform team for eight months. The cluster had been running for about a year before I arrived, built by people who were smarter than me and busier, and it had grown the way Kubernetes clusters grow: one thing at a time, nothing ever deleted. I've spent twelve-plus years in backend and infrastructure roles, and I've been burned by over-engineering enough to treat every new moving part with suspicion until it earns its keep. So my first thought looking at that invoice wasn't "we need cost tooling." It was "we need to find what we're paying for that we're not using."

That's this story: the diagnosis, the fix, and the rules I'd implement on day one if I had to start over.

## How we got here

The setup was standard mid-size: EKS, three node groups, forty-something microservices, everything running three replicas with anti-affinity because that's what the template said. We had a service mesh because a consultant recommended one. We had a GPU node group with two nodes "in case someone needs to train something." Nobody had used it in eleven months, but it was in the Terraform, and Terraform is the most effective way I know to preserve a mistake forever.

We had autoscaling everywhere. Cluster autoscaler, HPA on every deployment, a VPA we installed and then ignored. We told ourselves we were optimized. The invoice said otherwise.

## The first twenty minutes of digging

I started with the tools already on the box. No new software, no budget approval, just kubectl:

```bash
kubectl top nodes
kubectl top pods -A --sort-by=cpu | head -30
```

`kubectl top nodes` showed the whole cluster hovering around 22 percent CPU utilization. Twenty-two percent across three node groups, with a mesh running on top. We were paying for four machines and using about one. `kubectl top pods` told the same story at the pod level: a few services actually working, the rest idling in the 1 to 5 percent range.

Here's the part that took me a while to admit: this wasn't a mystery. It was arithmetic. Somebody just had to do the subtraction, and nobody had.

## Why nobody noticed

Three reasons, in order of importance. First, nobody owned cost. Engineering owned uptime, finance owned the budget, and the two numbers never met in the same meeting. Second, the invoice was paid centrally, so no team felt the pain of its own namespace. Third, we'd built our identity around performance — latency dashboards, p99s, autoscaling heroics — and cost felt like the boring number. It is boring. That's exactly why it needs a process, because nobody pays attention to boring things by accident. On-call handled incidents, not invoices; the bill arrived in a mailbox nobody had permissions to care about.

## Requests were the lie

Every deployment in the repo declared requests far above reality. A service that burned 100 millicores in steady state asked for 2 CPU. A Go binary using 180 MiB of RAM requested 4 GiB. Nobody had ever compared the two numbers; the original values came from a launch checklist that said "be generous, it's safer."

The catch is that requests are not advisory. They drive scheduling, they drive the cluster autoscaler when it decides to add nodes, and they drive HPA. Ask for 2 CPU and use 0.1, and your pod gets scheduled as if it needs 2 CPU, the autoscaler buys capacity for 2 CPU, and your HPA target of 70 percent utilization never fires — because 70 percent of 2 CPU is 1.4 CPU, and you're using 0.1. The entire control loop was calibrated against fiction.

A typical offender looked like this:

```yaml
resources:
  requests:
    cpu: "2"
    memory: 4Gi
  limits:
    cpu: "4"
    memory: 8Gi
```

And the pod was using 120 millicores and 300 MiB. That's not a safety margin. That's a lie wearing a raincoat.

I wrote a one-off script that joined every deployment's declared requests against fourteen days of Prometheus usage, and printed the ratio. The median service was requesting about eight times what it used. The worst was requesting forty. When I raised it in the service owners' channel, one engineer pushed back with the classic: "what if we get a traffic spike and it needs all of that?" Fair question, wrong tool. A spike doesn't need 2 CPU reserved forever; it needs headroom at the node level and a limit that caps runaway behavior. The request should describe what you actually use. The limit should describe what you're willing to tolerate. I explained the difference and he agreed to try the p95 numbers for two weeks. He became the easiest convert, which surprised me — most people just had never heard anyone explain it.

## What we actually did

We fixed it in three passes over about three weeks. Nothing clever, which is the point.

**Pass one: right-size the requests.** I pulled fourteen days of Prometheus metrics for every deployment — p50, p95, and p99 of CPU and memory — and wrote requests from the p95s, with limits at a sane ceiling above that. The goal wasn't to squeeze anyone; it was to make requests true. Most services dropped from multi-core requests to 100–300 millicores. A handful that genuinely needed burst kept limits with headroom. We rolled out namespace by namespace, raised limits before lowering requests so nobody got OOM-killed mid-change, and watched the error budgets as we went. The memory side mattered almost as much as CPU: the service requesting 4 GiB for a 300 MiB working set dropped to a 512 MiB request with a 1 GiB limit, and nothing noticed except the bill.

**Pass two: delete things.** The GPU node group went away in a forty-line PR. Nobody noticed for two weeks, which tells you everything. The mesh stayed but got scaled way down — most of its cost was idle sidecars, and we cut the data plane to only the traffic paths that actually needed mTLS. Two "HA" services that were really batch jobs dropped from three replicas to one. The VPA we'd installed and ignored started getting read, and its recommendations mostly agreed with our p95s, so we kept it in recommendations-only mode as a cross-check rather than letting it change anything automatically.

**Pass three: make it visible.** We installed Kubecost and set up a weekly allocation report per namespace. The API call that mattered:

```text
GET /model/allocation?window=7d&aggregate=namespace
```

The dashboard was enough, honestly. Namespaces suddenly had dollar figures next to them, and the conversation changed from "is the platform expensive?" to "why is the payments namespace sixty percent of the bill?" Accountability is the cheapest tool in the stack. We added a budget alert at eighty percent of monthly spend pointing at the on-call channel, and we put the weekly number in the same Slack thread as the latency report so cost stopped being the number nobody read.

The monthly number went from $38,400 to about $11,000 by the end of the quarter, and most of that came from requests being true and two node groups being deleted. We didn't add a single new system. The entire win was: measure, right-size, delete.

## What didn't work

For fairness: we tried buying our way out first. A sales engineer demoed a fancy cost platform that promised to "show us everything." It needed its own cluster, a dedicated operator to run it, and a day of consulting to configure. It sat unused for a month and we dropped it. The free path — kubectl, Prometheus, one dashboard — beat it. We also experimented with spot instances as a cost lever. The savings were real, but the flakiness annoyed every service owner until we confined spot to the workloads that tolerate interruption. Spot is a fine knob; it's a knob you turn after the numbers are true, not instead of making them true. And we nearly bought reserved capacity on the strength of our old, inflated requests — that would have locked in the waste for a year. Good thing the invoice came before the purchase order.

## The rules I'd start with

If I set up a cluster tomorrow, I'd do these before anything fancy:

1. **Requests come from data, not templates.** Run for two weeks with generous requests, capture real usage, then set requests from p95s and revisit quarterly. Never let a checklist write your requests.
2. **Default everything to off.** Opt in to scale, to HA, to mesh features. Every replica above one needs a reason. Every node group needs a tenant and a review date.
3. **Cost is a signal, not a surprise.** Namespace tagging from day one. A weekly allocation report. Alerts at eighty percent of budget. If the first time you see a number is the invoice, you've already lost.
4. **HPA is only as honest as your requests.** If requests are fiction, autoscaling is theater. Fix the base numbers first, then tune the policy.
5. **Delete before you optimize.** The cheapest infrastructure is the infrastructure that doesn't exist. Every optimization conversation should start with "can we just not run this?"

## What I'd do differently

I'd have put cost on the same dashboard as latency from the beginning. We treated cost as a finance problem and performance as an engineering problem, and the gap cost us about six months of overspend. I'd also have tagged namespaces from the first deploy. Retro-tagging a year of resources is boring, and boring is expensive.

And I'd push back earlier on the architecture-by-consultant stuff. The mesh added latency, complexity, and a line item, and we were too busy operating it to notice the bill. If a tool doesn't help you ship or help you see, it's not infrastructure, it's inventory.

## The takeaway

FinOps on Kubernetes is mostly accounting with kubectl access. The tools that matter — `kubectl top`, Prometheus, one cost dashboard — were available from day one. What was missing was the discipline to look at them together. Right-sized requests, deleted waste, and a weekly number people actually read fixed a problem worth about two hundred thousand dollars a year, with zero new software.

If your cloud bill is creeping up and you don't know why, don't buy a tool yet. Run `kubectl top nodes`, compare requests to reality, and count how many node groups you can delete. I'd bet the answer is at least one.
