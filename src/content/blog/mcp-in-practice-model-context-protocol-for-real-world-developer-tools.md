---
archetype: "explainer"
title: "MCP in Practice: Model Context Protocol for Real-World Developer Tools"
slug: "mcp-in-practice-model-context-protocol-for-real-world-developer-tools"
date: "August 12, 2026"
excerpt: >
  This post details how to build MCP servers with custom tools and choose between SSE and stdio transports. We cover integrating the protocol directly into IDEs and automating workflows within CI/CD pipelines.
coverImage: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=1200"
category: "AI-Engineering"
readTime: 13
tags:
  - "AI-Engineering"
---

# MCP in Practice: Model Context Protocol for Real-World Developer Tools

I spent three weeks debugging a CI pipeline failure that looked like a flaky test but turned out to be a transport negotiation timeout. The error message was generic: `ECONNRESET`. The logs showed the agent thinking, then silence, then a crash. I assumed it was network instability. It wasn't. It was a mismatch in how the IDE's MCP client and the internal tool server negotiated capabilities over different transports.

We are adding AI agents to our stack at an alarming rate. We spin up local LLMs, connect them to codebases via file watchers, and feed them secrets through environment variables. The problem is that every vendor wants their own JSON-RPC dialect or proprietary binary format. I wanted a standard way to plug tools into an IDE without rewriting the IDE's core logic for every new tool. That standard is the Model Context Protocol (MCP).

It solves a specific problem: how do you expose functionality from a backend process to a frontend application in a way that is language-agnostic and secure by default? The answer isn't magic; it's a strict contract defined by JSON-RPC 2.0, wrapped in a few specific rules about authentication and resource discovery.

## The mental model first

Before writing a single line of code, we need to agree on the actors. Forget "AI agents" for a second. Think of this as a classic plugin architecture where the communication layer is rigidly defined.

Imagine you have an IDE. This is your client. It has a UI, a language server protocol handler, and a sandboxed environment where you don't want to install random Python scripts directly into the main process. Now imagine you need a tool that lives elsewhere—a database connector running on port 5432, or a local script that scans git history.

In the past, we built custom RPC clients for each of these. We wrote gRPC stubs, XML-RPC parsers, or custom WebSocket handlers. The result was a mess of `try-catch` blocks and version mismatches.

MCP changes the relationship between the client and the tool. Instead of the client knowing how to talk to every specific tool, the client talks to *any* tool that speaks MCP. The server does not need to know about the IDE's UI or the user's intent. It just provides a set of resources (files, database rows) and tools (functions that execute logic).

The mental model is a strict mediator pattern. The Client initiates the connection. The Server advertises what it has via a handshake. The Client then invokes specific methods like `tools/call` or `resources/read`. There is no implicit knowledge sharing. If you don't define a tool, the client doesn't know it exists. This prevents the "magic" where an AI suddenly starts accessing files it shouldn't because the developer forgot to disable a flag.

This separation of concerns is why I prefer MCP over generic LLM APIs that try to infer context. With an API endpoint, you are trusting the provider's internal implementation details. With MCP, the contract is explicit. The server defines its schema once, and the client can validate it immediately.

## Core mechanics

The protocol is built on JSON-RPC 2.0. If you have used Node.js or Python RPC clients before, this is familiar ground. The magic lies in the specific top-level methods and the structure of the response objects.

A connection starts with a `initialize` request. This is where the negotiation happens. The client sends its capabilities, and the server responds with its own list of available tools, resources, and prompts.

Here is what a minimal server initialization looks like in Python using the official `mcp-server` library:

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server

server = Server("my-tool-server")

@server.tool()
def check_status():
    """Check the current status of the system."""
    return {"status": "online"}

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream, 
            write_stream, 
            initialize_request=None
        )

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

The client receives this response and parses the `capabilities` field. It knows exactly which tools exist before it tries to call them. This prevents runtime errors caused by calling undefined functions.

Transport is the next layer. You can connect via STDIO, which is how most IDE integrations work today. The IDE spawns a subprocess for the server and communicates through stdin/stdout pipes. Alternatively, you can use SSE (Server-Sent Events) or HTTP streams over TCP.

The choice of transport affects how the connection is established but not the message format. When using STDIO, the connection is local by default, which simplifies security. The client doesn't need to validate a TLS certificate because the pipe is local. However, if you use SSE over a remote URL, you must handle authentication tokens in the headers.

The protocol defines three primary resource types: tools, resources, and prompts. Tools are functions that execute logic. Resources are readable data like file contents or database rows. Prompts are templates for generating text that the LLM can use to construct responses.

When a tool is called, the client sends a `tools/call` request with the name of the tool and an arguments object. The server executes the function and returns the result in a standardized JSON format. If the execution fails, the server returns an error object with a specific code and message. This structure allows the client to display a clear error message to the user rather than a stack trace.

The strict typing of these requests and responses is what makes MCP robust. Unlike loose API integrations where you might pass arbitrary JSON that gets ignored or mishandled, MCP enforces a schema. If you define a tool with specific arguments, the client validates them before invoking the function.

## What happens at runtime

Let's walk through a concrete scenario end to end. I have a Python script that queries a PostgreSQL database. I want my IDE to call this script without me needing to install it globally or expose the database connection string in the environment variables of the main process.

First, I create an MCP server configuration file. This file defines the transport and the tools.

```python
# tools.py
from mcp.server import Server
from mcp.server.stdio import stdio_server
import asyncio
import json

server = Server("db-tools")

@server.tool()
def get_user_by_id(user_id: int):
    """Fetch a user by ID from the database."""
    # Simulate a database call
    if user_id > 0:
        return {"id": user_id, "name": "Alice", "email": "alice@example.com"}
    else:
        raise Exception("Invalid user ID")

async def run_stdio():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream)

if __name__ == "__main__":
    asyncio.run(run_stdio())
```

I start this script in a separate terminal. The IDE's MCP client detects the new process and attempts to connect via STDIO.

The handshake begins. The client sends an `initialize` request with a protocol version string, usually "2024-11-05". The server responds with its own capabilities, listing the `get_user_by_id` tool.

Now the IDE's AI agent wants to look up a user. It constructs a `tools/call` request. The payload looks like this:

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_user_by_id",
    "arguments": {
      "user_id": 123
    }
  }
}
```

The client sends this over the STDIO pipe. The server receives it, deserializes the JSON, validates the arguments against the tool definition, and executes the function.

The function returns a dictionary. The server serializes this into a JSON-RPC response:

```json
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"id\":123,\"name\":\"Alice\",\"email\":\"alice@example.com\"}"
      }
    ]
  },
  "isError": false
}
```

The IDE parses this response and passes the text content to the LLM. The LLM then generates a natural language response based on that data. The entire flow happens without the IDE ever knowing the database schema or needing direct access credentials.

If the server crashes during execution, the client catches the exception and returns an error object. This allows the UI to display a tooltip explaining that the tool failed, rather than freezing the extension.

This runtime behavior is deterministic. Every request has a specific ID. Responses are matched to requests using these IDs. If the server takes too long to respond, the client can timeout the connection or retry the request. The protocol handles backpressure naturally because it streams messages over a single channel.

One detail often missed: resource discovery. Before calling a tool, the client might want to list available resources. It sends a `resources/list` request. The server responds with a list of resource URIs and their metadata. This allows the AI to ask, "Do you have access to the project configuration?" before attempting to read it.

The flow is strictly request-response. There are no subscriptions or fire-and-forget messages in the core protocol. This keeps the implementation simple and predictable. You send a message, you get an answer. If there's no answer, something went wrong.

## Edge cases and gotchas

Things break. They break more often than documentation suggests. I have seen too many agents fail because of subtle issues in how they handle errors or manage connection lifecycles.

The first major pitfall is resource exhaustion. If a tool server runs indefinitely without cleanup, it can accumulate state in memory. The protocol itself doesn't enforce timeouts on individual tool executions. A slow database query inside your tool can block the entire STDIO pipe for seconds or minutes. If you are using SSE over HTTP, the connection might stay open while the backend times out internally. This leads to a "zombie" connection where the client thinks the server is alive, but it's just processing a hang.

To mitigate this, you must implement timeouts at the application level, not rely on the protocol. In Node.js clients, you can set a `timeout` option on the transport. In Python, you need to wrap your async calls with `asyncio.wait_for`. If you don't, your IDE will eventually run out of memory waiting for a response that never comes.

Another common issue is authentication. When using STDIO, authentication is often handled via environment variables passed to the server process. This works fine for local development but fails in CI pipelines where the environment might be stripped. The protocol supports passing auth tokens in the `initialize` request or via custom headers over SSE. However, many existing servers ignore these and rely solely on env vars. If you switch from STDIO to SSE without updating your server to handle token-based auth, the handshake will fail silently, resulting in a generic "connection refused" error.

Resource URI schemes are also a source of confusion. The protocol uses standard URIs like `file://` or `data:text/plain`. If your tool expects a file path but receives a `file://` URI, you need to strip the scheme and decode it. A naive implementation might crash when trying to open a non-existent file path because the URI includes special characters that need decoding.

There is also the issue of prompt injections via resources. Since MCP allows reading arbitrary files as resources, an attacker could potentially place a malicious script in your repo and have the AI execute it if the tool definition is too permissive. The protocol doesn't prevent this; it's up to the server implementation to sandbox the tool execution. If you run tools with elevated privileges, you are vulnerable to remote code execution through file reads.

Finally, versioning breaks often. The protocol version string in the `initialize` request must match between client and server. If you upgrade your client library but forget to update your server's expected version, the handshake will fail. The error message is usually cryptic: "Protocol version mismatch." You have to check the logs of both sides to see which version was negotiated.

| Issue | Symptom | Root Cause | Fix |
| :--- | :--- | :--- | :--- |
| Hang on tool call | IDE freezes, no response | Missing timeout in server logic | Add `asyncio.wait_for` or transport timeout |
| Auth failure | Handshake fails immediately | Env vars not propagated to subprocess | Pass tokens via headers for SSE transports |
| URI decode error | File read returns empty string | URI scheme not stripped/decoded | Use `urllib.parse.urlparse` before fs.read |
| Version mismatch | "Protocol version invalid" | Client/Server version strings differ | Check `mcp` package versions on both ends |

## Why this keeps happening

The reason these edge cases persist is that developers treat MCP as a black box. They install the library, define a tool, and assume it works. But MCP is just a transport layer. The logic inside your tool is still yours to manage.

If you write a tool that opens a file without checking permissions, you inherit the risks of the host OS. If you write a tool that makes an HTTP request without validating the URL, you introduce race conditions. The protocol doesn't shield you from these mistakes. It only ensures that if you make a mistake, the error is reported in a structured way instead of crashing the IDE process.

I've seen teams build complex orchestration layers around MCP because they assume the protocol handles everything it needs to. They forget that the client and server are still two separate processes communicating over a wire. If one side dies, the connection drops. You need to handle reconnection logic if you want resilience. The official documentation mentions this, but it's buried in the transport section.

The real value of MCP is not in the magic of AI integration. It's in the simplicity of the contract. By forcing everything into JSON-RPC 2.0, we remove ambiguity. We don't have to guess if a method exists. We don't have to guess what arguments are required. We can validate the schema before execution.

This predictability is what allows us to build reliable systems. When I integrate an MCP server into our CI pipeline, I know exactly how to monitor it. I can check for specific error codes in the logs. I can set up alerts for connection drops. I don't have to rely on vague "AI hallucination" metrics because the failure modes are deterministic and observable.

The protocol also makes testing easier. You can mock the transport layer and inject fake responses without needing a live database or file system. This speeds up development significantly. You write unit tests for your tool logic, then integration tests for the full MCP handshake.

One last thing: the prompt templates. Many developers ignore the `prompts` capability. They think tools are enough. But prompts allow you to define multi-step workflows that the AI can invoke directly from the chat interface. If you want your tool to be used in a specific context, like "summarize this file," you should expose it as a prompt template, not just a resource read. The client will offer it as an option to the user.

## Closing

The Model Context Protocol gives us a standardized way to connect AI tools to our existing infrastructure without reinventing the wheel. It forces us to be explicit about what we expose and how we authenticate.

It works because it is boring. It relies on simple JSON messages, strict handshakes, and clear error codes. In a world full of flashy "magic" AI integrations, this predictability is exactly what we need for production systems.