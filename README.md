# Lazyweb Skill

**Design with evidence, not vibes.**

AI agents design from training data averages — generic layouts, safe colors, patterns you've seen a thousand times. This skill gives your agent access to Lazyweb's database of real app screenshots from thousands of the best mobile apps ever built.

Your agent searches before it designs. It finds real examples, assesses quality using multi-model consensus scoring, and synthesizes patterns into actionable guidance. Research that takes designers hours, done in seconds.

## Two skills included

**`/lazyweb-search`** — Find real app screenshots by describing what you need. Text search, image comparison, find-similar. Your agent learns to construct good queries, assess result quality, and route between mobile references (Lazyweb) and desktop/web references (web research).

**`/lazyweb-research`** — Deep design research that combines Lazyweb with web research to answer questions like "what are best practices for onboarding flows in fitness apps?" Goes beyond finding screenshots — synthesizes patterns, runs competitive analysis, and delivers actionable design principles grounded in real examples.

## Install

```bash
npx skills add https://github.com/aboul3ata/lazyweb-skill
```

<details>
<summary>Alternative: manual install</summary>

Clone into your skills directory:

**Claude Code:**
```bash
git clone https://github.com/aboul3ata/lazyweb-skill.git ~/.claude/skills/lazyweb-skill
```

Then symlink each skill:
```bash
ln -sf ~/.claude/skills/lazyweb-skill/lazyweb-search ~/.claude/skills/lazyweb-search
ln -sf ~/.claude/skills/lazyweb-skill/lazyweb-research ~/.claude/skills/lazyweb-research
```

**Cursor:**
```bash
git clone https://github.com/aboul3ata/lazyweb-skill.git .cursor/skills/lazyweb-skill
```
</details>

## Prerequisites

These skills call the Lazyweb CLI, which talks to a local backend server that queries Lazyweb's Supabase database. You need:

1. **cli-lazybackend** — The search backend (runs locally)
2. **cli-lazyweb** — The CLI that the skills invoke

<details>
<summary>Setup instructions</summary>

### 1. Clone the repos

```bash
git clone https://github.com/aboul3ata/cli-lazybackend.git
git clone https://github.com/aboul3ata/cli-lazyweb.git
```

### 2. Install dependencies

```bash
cd cli-lazybackend && bun install
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

See `.env.example` for the required API keys.

### 4. Start the backend

```bash
cd cli-lazybackend && bun run dev
```

The backend runs on port 3456 by default.

### 5. Test it

```bash
cd cli-lazyweb && bun run src/index.ts search "pricing page" --limit 3
```
</details>

## What your agent can do

| Command | What it does |
|---------|-------------|
| `lazyweb search "dark mode settings"` | Find screenshots matching a description |
| `lazyweb search "pricing" --category Finance` | Filter by app category |
| `lazyweb search "onboarding" --company linear` | Filter by company |
| `lazyweb compare ./my-design.png` | Find screenshots visually similar to your image |
| `lazyweb similar 12345` | Find screenshots similar to one you already found |
| `lazyweb search "pricing" --fields high_design_bar` | Include rich metadata |

Results include a confidence score so your agent knows which results to trust and which to supplement with web research.

## How it works

Lazyweb searches across multiple AI models simultaneously and uses consensus scoring to surface the most relevant results. One result per company by default, latest version of each screen automatically used.

## License

MIT
