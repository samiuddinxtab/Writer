# Cloudflare Basics — What Is This Platform?

Let's start with the basics: **Cloudflare is a company that helps websites run fast and stay online**. Think of them as the infrastructure behind the internet that you never see but use every day.

## What Is Cloudflare Pages? (Frontend Hosting)

**In simple terms:** Cloudflare Pages is where your website files live.

Imagine your website is a restaurant. **Cloudflare Pages is like the dining room** — this is where your customers (readers) sit and consume your content. Just like a restaurant needs a physical space, your website needs somewhere to store its HTML, CSS, and JavaScript files.

**What it does:**
- Stores your website files (the stuff readers see)
- Serves your site to visitors around the world
- Automatically handles security (HTTPS/SSL certificates)
- Makes your site load fast through their global network

**What you don't need to worry about:**
- Server maintenance
- Security updates
- Traffic spikes crashing your site

## What Is Cloudflare Workers? (Backend API)

**In simple terms:** Cloudflare Workers is like the kitchen staff in your restaurant — it handles the behind-the-scenes work.

When readers click around your site or when you publish articles, **Workers does the thinking**. It receives requests (like "show me article X"), talks to the database, and sends back the right information.

**What it does:**
- Handles admin login and article publishing
- Serves articles to readers
- Manages cache invalidation (more on this later)
- Processes form submissions
- Provides your API endpoints

**Why it matters:** Workers runs on Cloudflare's global network, so it's fast everywhere. It's also free for moderate usage.

## What Is Cloudflare D1? (Database)

**In simple terms:** D1 is your filing cabinet — it stores all your articles, sections, and content permanently.

**Think of it like this:**
- Cloudflare Pages = the dining room (what customers see)
- Cloudflare Workers = the kitchen (processing)
- Cloudflare D1 = the filing cabinet (permanent storage)

**What it does:**
- Stores your articles as plain text
- Keeps track of publication dates
- Manages sections and organization
- Maintains data relationships (which article belongs to which section)

**Important:** D1 is SQLite-compatible, which means it's simple and reliable. Your data stays safe even if your phone breaks.

## How They Work Together (Simple Flow)

```
You (on phone) → Cloudflare Workers (kitchen) → D1 (filing cabinet)
                                      ↓
Readers → Cloudflare Pages (dining room) ← Workers serves cached content
```

**Step-by-step for publishing:**
1. You write an article on your phone and tap "Publish"
2. Your request goes to Cloudflare Workers (the kitchen)
3. Workers saves the article to D1 (filing cabinet)
4. Workers clears the cache (more fresh content for readers)
5. Readers immediately see your new article

**Step-by-step for reading:**
1. Reader visits your site
2. Cloudflare Pages serves cached content instantly
3. If content isn't cached, Workers fetches from D1
4. Content gets cached for the next reader

## Why Cloudflare? (Free Tier Benefits)

### Zero Cost, Zero Risk
- **Free forever** for your usage level
- **No credit card required** — eliminates fraud risk
- **No surprise bills** — clear limits that you'll never hit with this project

### Perfect for Urdu Content
- **Excellent RTL (Right-to-Left) support** — Urdu text renders beautifully
- **Global edge network** — fast for Urdu speakers worldwide
- **No character encoding issues** — handles Unicode perfectly

### Simple and Reliable
- **No server management** — Cloudflare handles everything
- **Automatic updates** — security patches applied automatically
- **99.99% uptime** — enterprise reliability at no cost

### Mobile-Friendly
- **CDN built-in** — your site loads fast on mobile networks
- **Edge caching** — content served from nearby locations
- **Minimal JavaScript** — works on older phones

## Why Does This Matter?

**Understanding these three services helps you:**
- Debug problems when they arise
- Make informed decisions about features
- Understand why things work (or don't work)
- Communicate effectively with other developers

**Most importantly:** You don't need to be a Cloudflare expert to use this platform. The documentation guides you through everything step-by-step, including exact buttons to tap on your phone.

**Next step:** Ready to set up your account? Head to [02_setup.md](02_setup.md) for the step-by-step guide.