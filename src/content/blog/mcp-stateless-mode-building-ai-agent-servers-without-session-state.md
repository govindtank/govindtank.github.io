---
title: "MCP Stateless Mode: Building AI Agent Servers Without Session State"
slug: "mcp-stateless-mode-building-ai-agent-servers-without-session-state"
date: "August 07, 2026"
excerpt: >
  The MCP spec's stateless mode drops the initialization handshake so agent tool servers run behind plain load balancers. Here's how to build one with the Python SDK.
coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200"
category: "AI-Engineering"
readTime: 7
tags:
  - "AI-Engineering"
  - "MCP"
  - "AI-Agents"
  - "Backend"
archetype: "tutorial"
---


# MCP Stateless Mode: Building AI Agent Servers Without Session State

Last week I ran a small MCP server behind a plain HTTP load balancer and watched it fall over. Not because the code was wrong, but because the Model Context Protocol required a stateful initialization handshake, and my second request went to a different instance that had no idea who I was. The fix turned out to be a spec change that shipped while I wasn't looking: MCP stateless mode. Google wrote about scaling agent infrastructure with it this week, Cloudflare called it "the next generation of MCP," and the spec itself went final on 2026-07-28. If you build tools for AI agents, this is the change you want to understand before your next deployment.

This tutorial walks through what stateless mode changes, then builds a real server with the Python SDK, one step at a time.

## The problem stateless mode solves

Before stateless mode, an MCP client and server had to complete a three-way handshake: the client sent `initialize`, the server answered with protocol version, capabilities, and server info, and the client acknowledged. That handshake created session state on the server that lived for the whole connection.

That statefulness is the reason you cannot put an MCP server behind a round-robin load balancer. Instance A holds your session; instance B has no idea what capabilities you negotiated. Operators respond with sticky sessions, which pin a client to one instance and ruin horizontal scaling. When an instance dies, the client reconnects, re-handshakes, and renegotiates everything.

The spec proposal that fixed this, SEP-2575 "Make MCP Stateless," went final and made stateless the default. The handshake is gone. Every request is self-contained: protocol version, client info, and client capabilities travel with each request instead of being negotiated once.

## What actually changed in the protocol

Three things, all of which you will see in code below:

1. **Version negotiation moved into headers.** The client sends `MCP-Protocol-Version` on every HTTP request, and mirrors it in the `_meta` field of the JSON-RPC payload. Mismatch means a 400.
2. **A new discovery RPC replaced the handshake.** `server/discover` returns the supported protocol versions, capabilities, and server info. Clients may call it before anything else, or just send requests and retry with a supported version if they get the `-32022` UnsupportedProtocolVersionError.
3. **Capabilities are declared per request.** Client capabilities ride along in every request's `_meta`, so the server never has to remember what a client can handle.

The mental model is: the server is a pure function of the request. Same request, same response, no matter which instance handles it.

## Step 1: Set up the project

The Python SDK 2.0+ supports stateless mode. Create a project and install it:

```bash
mkdir stateless-mcp && cd stateless-mcp
python3 -m venv .venv && source .venv/bin/activate
pip install "mcp>=2.0" uvicorn
```

We will serve over Streamable HTTP, which is the transport that makes the stateless properties visible. If you were using stdio, the same protocol semantics apply, but the stateful-versus-stateless distinction matters most when requests can land on different machines.

## Step 2: Declare the server

The server we build exposes one tool: a storefront inventory lookup that returns whether an item is in stock. Boring on purpose, so we can watch the protocol mechanics instead of the business logic.

```python
# server.py
from mcp.server.fastmcp import FastMCP

mcp = FastMCP(
    "inventory-server",
    stateless=True,          # no session state, no handshake
    transport="http",        # Streamable HTTP
)

@mcp.tool()
def check_stock(sku: str) -> dict:
    """Check whether an SKU is in stock."""
    stock = {"TEE-001": 12, "MUG-042": 0, "STK-007": 3}
    qty = stock.get(sku, 0)
    return {"sku": sku, "in_stock": qty > 0, "qty": qty}

if __name__ == "__main__":
    mcp.run()
```

The `stateless=True` flag is the whole point. The server registers no session lifecycle, keeps no per-client state, and treats every incoming request as independent. You can run four copies of this behind a load balancer and never think about stickiness.

## Step 3: Run and hit it

Start the server on port 8000:

```bash
uvicorn server:app --port 8000
```

Then, in another terminal, send a discovery request with curl:

```bash
curl -s -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "MCP-Protocol-Version: 2026-07-28" \
  -d '{"jsonrpc":"2.0","id":1,"method":"server/discover"}'
```

The response carries the supported versions and the server's capabilities, so a client knows what it can do before issuing a tool call:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "supportedVersions": ["2026-07-28", "2025-11-25"],
    "capabilities": {"tools": {}},
    "serverInfo": {"name": "inventory-server", "version": "0.1.0"}
  }
}
```

## Step 4: Call a tool, the stateless way

Now the interesting part. Every tool call must carry the version header and the per-request metadata:

```bash
curl -s -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "MCP-Protocol-Version: 2026-07-28" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "check_stock",
      "arguments": {"sku": "TEE-001"},
      "_meta": {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientInfo": {"name": "my-agent", "version": "1.0.0"},
        "io.modelcontextprotocol/clientCapabilities": {}
      }
    }
  }'
```

If the header and the `_meta` version disagree, the server answers 400. If the client omits the required `_meta` fields, the request is malformed. If the client asks for a version the server does not speak, the server returns error code `-32022` with a list of supported versions, and the client picks one and retries. No handshake, no session, no state to lose.

Run this request, kill the server, start a second instance on the same port, and run it again. It just works. That is the entire payoff: requests are interchangeable across instances, which is what makes MCP servers deployable like normal web services.

## Step 5: The one stateful thing you can still do

Stateless mode is the default, not the only mode. If a tool genuinely needs a long-lived conversation, the spec keeps room for that. But there is a deliberate design principle in SEP-2575: prefer stateless requests, prefer state references (pass an ID rather than relying on server memory), and treat statefulness as a last resort.

The one explicitly stateful RPC left is `subscriptions/listen`, which opens a long-lived channel for notifications like `tools/list_changed`. Notice how it is opt-in per notification type — the client has to say exactly which notifications it wants. Everything else stays request-scoped, and durable work that must survive a connection drop belongs in the tasks primitive, not in session state.

## Recap

The sequence we just ran, end to end:

1. Client sends `server/discover` (optional but useful) to learn supported versions and capabilities.
2. Client sends `tools/call` with the version in an HTTP header, mirrored in `_meta`, plus client info and capabilities.
3. Server processes the request, sends the response on its own SSE stream, and forgets the client.
4. A different server instance can handle the next request with zero coordination.

That is the whole migration: from "negotiate once, remember forever" to "declare on every request."

## Pitfalls I hit so you do not

- **Forgetting the header.** The `MCP-Protocol-Version` header is mandatory on HTTP. Miss it and the server rejects the request before your handler runs. It is easy to miss because the old SDKs did not need it.
- **Header and `_meta` mismatch.** If you hardcode the version in the header but build `_meta` dynamically, they will drift. Build both from one constant.
- **Keeping old SDKs.** Pre-2.0 Python SDKs still do the handshake. Stateless mode is a server-side opt-in in newer SDKs; upgrading is not optional if you want this behavior.
- **Expecting state to survive.** Anything you used to stash in session state — user preferences, pagination cursors, partial results — must now come from the client or a store keyed by an ID the client passes. This is the biggest behavioral change for existing servers.
- **Cancellation semantics changed.** Closing the SSE response stream now cancels the request, and resumable streams are gone. Long jobs need the tasks primitive instead of relying on reconnection.

## Closing

Stateless MCP is one of those spec changes that looks small on paper and changes operations completely once you deploy it. The initialization handshake was the thing keeping MCP servers out of normal load-balanced infrastructure, and removing it means agent tool servers can now be treated like any other stateless HTTP service: scale horizontally, restart freely, and let a plain round-robin balancer do its job.

Start with the inventory server above, put two instances behind a balancer, and send the same request to both. When the second one answers without blinking, you will feel what the last week of infrastructure blog posts was about.
