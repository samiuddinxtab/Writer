# Urdu Articles — Cloudflare-Powered Publishing

A lightweight, zero-cost platform for publishing high-quality Urdu articles. Built entirely on Cloudflare's free services with mobile-first design.

## What This Uses

- **Cloudflare Pages** — Frontend hosting (your website files)
- **Cloudflare Workers** — Backend API (handles admin editor and reader API)
- **Cloudflare D1** — Database (stores articles and sections)

## How It Works

Your articles live in a simple database (D1). When readers visit your site, Cloudflare's global network serves cached content instantly from nearby servers. When you publish an article from your phone, it gets saved to the database and the cache updates automatically. The entire system runs on Cloudflare's free tier with no credit card required.

**Why Cloudflare?** Zero cost forever, no credit card fraud risk, excellent global performance, and great support for Urdu text and RTL languages.

## Start Here

1. **New to Cloudflare?** → Read [docs/README.md](docs/README.md) to understand the basics
2. **Ready to set up?** → Follow [docs/cloudflare/02_setup.md](docs/cloudflare/02_setup.md) 
3. **Need help?** → Check [docs/cloudflare/04_troubleshooting.md](docs/cloudflare/04_troubleshooting.md)

**No technical background required** — these docs assume you've never used Cloudflare and guide you through everything step by step, including exact button names to tap on your phone.