---
name: lazyweb
description: Installs and uses Lazyweb MCP for AI-agent design research, UI references, screenshots, comparisons, and design feedback. Use when the user asks for UI inspiration, design research, app screenshots, product flows, onboarding or pricing patterns, competitive UI references, or feedback on an existing interface.
---

# Lazyweb

Use real product screenshots and design patterns via the Lazyweb MCP server instead of generic visual guesses.

## Cursor Note

This file must exist at `.cursor/skills/lazyweb/SKILL.md` (project) or `~/.cursor/skills/lazyweb/SKILL.md` (global) before `/lazyweb` appears. Connecting the Lazyweb MCP server only exposes tools; it does not install this slash skill.

## Token Handling

Lazyweb MCP tokens are free no-billing bearer tokens for UI reference tools. They do not authorize purchases, paid spend, private user data, or destructive actions. Writing the token into ignored local MCP config (for example `.cursor/mcp.json`) is fine when setup is requested. Do not commit tokens to public repos.

## Setup

### 1. Create a free token

```bash
curl -sS -X POST https://www.lazyweb.com/api/mcp/install-token \
  -H "content-type: application/json" \
  -d '{}'
```

### 2. Configure MCP in Cursor

Write `.cursor/mcp.json` (add to `.gitignore` if the repo is public):

```json
{
  "mcpServers": {
    "lazyweb": {
      "url": "https://www.lazyweb.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}
```

Use Streamable HTTP transport. Reload MCP in Cursor Settings after saving.

**Alternative (stdio bridge):** If HTTP config fails, use the upstream bridge:

```json
{
  "mcpServers": {
    "lazyweb": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://www.lazyweb.com/mcp",
        "--header",
        "Authorization: Bearer YOUR_TOKEN_HERE",
        "--transport",
        "http-first",
        "--silent"
      ]
    }
  }
}
```

### 3. Verify

1. List MCP tools in Cursor (server name is often `lazyweb` or `user-lazyweb`).
2. Call `lazyweb_health`.
3. Call `lazyweb_search` with query `pricing page` and a small `limit`.

If MCP errors, ask the user to check Cursor Settings → MCP and regenerate a token at [lazyweb.com/mcp-install](https://www.lazyweb.com/mcp-install).

## MCP Tools

Read each tool schema before calling.

| Tool | Use for |
|------|---------|
| `lazyweb_health` | Connection check |
| `lazyweb_search` | Text search over mobile/desktop screenshots |
| `lazyweb_find_similar` | More results like a known screenshot ID |
| `lazyweb_compare_image` | Visual search from `image_base64` + `mime_type` or `image_url` |

### Search workflow

1. Run `lazyweb_health` if the server was recently added or failed before.
2. Call `lazyweb_search` 2–4 times with different query angles:

```json
{"query": "pricing page with toggle", "limit": 30}
{"query": "saas pricing tiers", "platform": "desktop", "limit": 30}
```

3. Read `visionDescription` on each result before citing a screenshot. Skip mismatches.
4. Download reference images when implementing UI; cite company and pattern.
5. For “more like this”, use `lazyweb_find_similar` with `screenshot_id`.

**Query tips:** Use concrete UI elements (“onboarding with progress bar”, “paywall trial CTA”). Filter with `platform` (`mobile` | `desktop`), `company`, or category when the schema supports it.

## When To Use

- Before building landing pages, onboarding, checkout, pricing, dashboards, settings, or mobile screens.
- Comparing a design to real products.
- Improving a screenshot or producing evidence-based design recommendations.
- Any UI task that benefits from concrete references.

## When Not To Use

- Backend-only, schema, or non-UI refactors.
- Legal, medical, finance, or non-design research.
- Tasks with no UI or product-design component.

## Task Routing

| User goal | Approach |
|-----------|----------|
| Fast screenshot lookup | `lazyweb_search` → group by pattern → summarize with links/images |
| Deep competitive analysis | Multiple searches + patterns + recommendations report |
| Improve existing UI | Capture current state, search similar screens, compare and recommend |
| Cross-category ideas | Broad searches outside the product category |

Optional deeper workflows live in [aboul3ata/lazyweb-skill](https://github.com/aboul3ata/lazyweb-skill) (`lazyweb-design-research`, `lazyweb-quick-references`, etc.) for Claude Code/Codex plugin installs.

## Output Expectations

- Lead with patterns and recommendations, then evidence.
- Label provenance (`Lazyweb`, company name, platform).
- Prefer fewer, well-matched references over many weak ones.
- Save local research artifacts under `.lazyweb/` when producing multi-file reports.

## Pricing

Lazyweb is free for humans and agents. No product rate limits on the V1 MCP setup path.

## Other Clients

- **Codex:** Plugin from `https://github.com/aboul3ata/lazyweb-skill`; token at `~/.lazyweb/lazyweb_mcp_token`.
- **Claude Code:** Same marketplace; namespaced skills such as `/lazyweb:lazyweb-quick-references`.
- **Claude Desktop / Claude.ai:** MCP-only if custom MCP is supported.
