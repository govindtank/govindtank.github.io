---
title: "Platform Engineering: Building Internal Developer Portals That Teams Love"
slug: "platform-engineering-building-internal-developer-portals-that-teams-love"
date: "July 15, 2026"
excerpt: >
coverImage: "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&q=80&w=1200"
category: "DevEx"
readTime: 7
tags:
  - "DevEx"
archetype: "tutorial"
---


# Platform Engineering: Building Internal Developer Portals That Teams Love

I have built two internal developer portals in my career. The first one took nine months, five microservices, and a dedicated team of three. Nobody used it. The second one took six weeks, one service, and a config file. Teams now send me feature requests for it every week.

The difference was not the technology. It was the scope.

Most internal developer portal projects fail the same way: they try to model the entire company on day one. Every team, every service, every environment, every permission, all of it, in a giant schema that nobody agrees on. The result is a beautiful empty shell that everyone is afraid to touch, and the team that built it quietly reassigns to something with users.

This post is about the other path. I am going to walk through how I build a portal now, from scratch, in a way that real teams actually adopt. The boring way. The way that survives contact with a production outage.

## Start with the friction, not the framework

Before you install anything, find the answer to one question: what is the most common, most annoying thing your developers do by hand?

At my current company the answer was obvious. Spinning up a new service took the better part of a day. You had to know the repo naming convention, which CI template to copy, which database to provision, which Slack channel to join, and who owned on-call for the thing you were building. The knowledge lived in four different wikis and two people's heads. New hires burned their first week on it, and senior engineers had turned the ritual into a private ceremony.

I asked twenty engineers what they typed into the wiki search box. Then I built for the top three answers and ignored the rest. That list is your backlog, and it should embarrass you with how small it is. If your backlog of developer pain has more than five items, you have not actually asked anyone; you have imagined a platform.

## Pick the thinnest slice

Here is the part I used to get wrong. I wanted a platform that handled everything: service creation, deploys, secrets, feature flags, cost tracking, compliance. A platform for everything is a platform for nothing, because it takes eighteen months to ship, and by then your company has reorganized twice and the person who commissioned it has a new title.

The thinnest slice is one golden path, end to end, done properly. For us it was: a developer asks for a service and gets a repo with CI, a health endpoint, a database, and an owner recorded. Everything else comes later.

That slice took six weeks. It had one UI screen, one API, and one database table. On a roadmap it looked almost insultingly small. It worked, and the teams noticed. Small and working beats grand and stalled, every time.

## Scaffold the portal config

I am not going to tell you to build a portal engine from scratch. I did that once, and I am still paying for it in maintenance. Use something with a catalog, a scaffolder, and an auth story already solved — Backstage and its relatives fit this description. The configuration is where you make it yours.

Everything about our portal lives in one versioned repo, reviewed like production code. The entire platform config is a file like this:

```yaml
# portal.yaml — the whole platform config, versioned and reviewed
catalog:
  providers:
    githubOrg:
      org: acme
      schedule: "0 * * * *"
scaffolder:
  templates:
    - ./templates/service
techdocs:
  builder: local
  publish:
    type: local
auth:
  providers:
    oidc:
      issuer: https://login.acme.dev
```

Notice what is not in there: no custom plugins, no bespoke backends, no special integrations. The config is boring on purpose. Boring config is config you can upgrade when the upstream project ships a new version, and it is config a new engineer can read in five minutes. Both of those are features.

## Define one golden path template

The template is the heart of the whole thing. It is a recipe, not a philosophy. Ours produces a repo with a health endpoint, a test suite, a CI workflow, a README that states the owner, and a license. It is deliberately opinionated and deliberately small.

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: acme-python-service
  title: Python HTTP service (the boring one)
spec:
  parameters:
    - title: Service name
      required: true
      properties:
        serviceName:
          type: string
  steps:
    - id: fetch
      action: fetch:template
      input:
        url: ./skeleton
        values:
          name: ${{ parameters.serviceName }}
    - id: publish
      action: publish:github
      input:
        repoUrl: github.com?owner=acme&repo=${{ parameters.serviceName }}
    - id: register
      action: catalog:register
      input:
        repoContentsPath: catalog-info.yaml
```

The template matters more than the portal. If the template is good, teams stop copy-pasting from each other's repositories, and the drift in your codebase starts to shrink. If the template is bad, no amount of portal chrome will save you. Spend the extra day on the skeleton — the health check, the test setup, the CI file — because that day pays for itself in the first month. This is where I put my effort now, and it is the advice I give every team that asks me where to start.

## Publish the API catalog

Once services exist, you need to know they exist. The catalog is a set of YAML files living next to each service's code, so ownership travels with the code and never goes stale the way a wiki does.

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: billing-api
  annotations:
    github.com/project-slug: acme/billing-api
spec:
  type: service
  owner: group:payments
  lifecycle: production
  providesApis:
    - billing-api-v1
```

Two rules keep this file honest. First, the owner is a group, never a person. People leave; groups persist. Second, the file lives in the service repository and CI fails if the annotations drift from reality. A catalog entry that lies is worse than no entry, because it sends a developer to the wrong owner during an incident.

## The boring parts that decide everything

The parts nobody demos in the sales pitch are the parts that make or break a portal.

Authentication and authorization come first, before any feature. If a portal is not integrated with your SSO and your permission model, it becomes a second shadow system that nobody trusts. Our rule is simple: if it is not in the identity provider, it does not exist.

Ownership is the second. Every catalog entry has an owner group, and the portal surfaces it everywhere — who do I talk to about this service, who gets paged when it breaks. This one decision killed more portal adoption than any technical bug I have debugged.

Documentation is the third, and I do not mean a documentation portal. I mean the README the template generates, the runbook link on every service page, the answer to "how do I deploy" being one click away. The portal's job is to shorten the distance between a question and an answer.

## What not to build

I want to be explicit about the things I refuse to build, because I have built all of them and regretted each one.

Do not build your own portal engine. The catalog, the scaffolder, the auth wiring — these are solved problems with maintained projects behind them. Your company does not have a unique problem in this space. It has the same problem as everyone else, which means it should use the same solution.

Do not model the whole organization on day one. Start with services and owners. Teams, systems, resources, and the fancy entity types can wait until someone actually asks for them, which they will, roughly never.

Do not build a metrics dashboard nobody asked for. "The portal should show DORA metrics" is how portal projects die: three months wiring up data your developers never look at, while the golden path rots. If teams are not asking for it, it is not the next slice.

Do not automate what is already working. If your deploys are fine, leave them alone. The portal should absorb the friction people actually feel, not the friction you imagine they feel after reading a blog post.

## How I know it is working

Six weeks after the thin slice shipped, I checked three numbers. Time from "I need a new service" to a deployed health endpoint: a day down to under an hour. New-service questions in the developer Slack channel: from daily to near zero. Pull requests using the template's structure instead of hand-copied old repositories: the majority.

The real signal was quieter. Engineers started editing the template themselves and opening pull requests against it. That is the moment a portal stops being my project and becomes the team's infrastructure. When the people using the golden path maintain the golden path, you have won.

The first portal I built had a custom plugin architecture and a database schema diagram I was proud of. The second one has a config file, one template, and a catalog. I know which one I would rebuild. Start smaller than feels right. Ship the thinnest slice. Let the teams tell you what comes next.
