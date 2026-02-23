# Frituur MCP

<img src="assets/mcp-frituur.png" alt="Project logo" width="300"/>

A small Remote MCP server implementation that exposes a single tool for fetching available order time slots from a Lightspeed ordering page.

Quick start
-----------

Prerequisites
- Node.js & pnpm
- Wrangler (Cloudflare Workers CLI) and a configured Cloudflare account if you plan to deploy

Install dependencies

```bash
# with pnpm
pnpm install
```

Run the development server

The project provides scripts in `package.json` that use Wrangler to run the worker locally.

```bash
# start the local worker (uses `wrangler dev`)
pnpm start
```

Resources and further reading
- Model Context Protocol (official): https://modelcontextprotocol.org/
- Cloudflare Agents / Remote MCP server guide: https://developers.cloudflare.com/agents/guides/remote-mcp-server/
- Wrangler (Cloudflare Workers CLI): https://developers.cloudflare.com/workers/cli-wrangler/
- Blog post: https://www.jeroendruwe.be/posts/frituur-mcp/