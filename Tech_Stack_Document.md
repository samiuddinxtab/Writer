
# Tech Stack Document
**Project:** Urdu Articles Publishing App (Writer‑First, Wiki‑Style)  
**Status:** Final – Engineering Handoff Reference  
**Scope:** Zero‑cost, Cloudflare‑only, single‑admin, read‑heavy system  
**Audience:** Senior engineers, AI coding agents (Claude, Codex, etc.)

---

## 1. Purpose of This Document
This document defines the **authoritative technical stack and architectural rules** for the project.  
It is intentionally **implementation‑agnostic** (no code), but **precise enough** that expert engineers or AI systems can implement the system **without making assumptions** or expanding scope.

Anything **not explicitly mentioned here is out of scope**.

---

## 2. Core Technical Principles (Non‑Negotiable)

1. **Zero Cost**
   - Must operate fully within Cloudflare free tier limits.
   - No paid plans, no third‑party paid services.

2. **Read‑Heavy, Write‑Light**
   - One admin writes.
   - Unlimited readers read.
   - Architecture optimized for reads and caching.

3. **Stability > Cleverness**
   - Prefer boring, proven patterns.
   - Avoid fragile browser APIs and experimental tooling.

4. **Vendor Lock‑In Accepted**
   - Cloudflare‑specific APIs are acceptable.
   - Portability is secondary to simplicity.

---

## 3. Platform Overview (Locked)

### Hosting & Infrastructure
- **Frontend Hosting:** Cloudflare Pages
- **Backend Runtime:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite‑based)
- **CDN & Edge Cache:** Cloudflare global edge (implicit via Pages/Workers)

### Explicitly Excluded
- R2 (file storage)
- KV (unless future revision)
- Queues / Cron
- WebSockets
- Analytics platforms
- Third‑party backends

---

## 4. Frontend Technology Stack

### Framework
- **Primary Choice:** Svelte (compiled, runtime‑light)
- **Bundler:** Vite
- **Rendering Model:** Client‑side rendering with static assets

**Rationale:**
- Small JS bundles (critical for mobile users)
- Predictable behavior
- Easy to reason about for AI coders
- No heavy runtime abstraction

### UI Architecture Rules
- Single‑column layouts
- RTL‑first components
- Mobile‑first breakpoints
- Minimal state management (local component state preferred)

### Styling
- Plain CSS or utility‑first CSS (no heavy UI frameworks)
- Consistent spacing scale
- No animation libraries
- Fonts loaded intentionally (performance sensitive)

---

## 5. Backend (API) Stack

### Runtime
- **Cloudflare Workers**
- Stateless request/response model

### API Design Rules
- REST‑style endpoints
- JSON over HTTP
- Clear separation:
  - Public read APIs
  - Admin‑only write APIs

### Authentication Model
- **Single admin**
- Bearer token stored as a Worker secret
- Token validated on every admin request
- No user sessions
- No OAuth
- No cookies required

**Security Philosophy:**  
Minimal attack surface, no public writes.

---

## 6. Database Layer (D1)

### Database Characteristics
- SQLite‑compatible
- Strong consistency
- Limited concurrent writes (acceptable for single admin)

### Usage Rules
- D1 is the **canonical source of truth**
- Store **plain semantic text only**
- No HTML blobs
- No media
- No analytics data

### Query Philosophy
- Simple SELECTs for reads
- Writes only from admin endpoints
- Avoid N+1 query patterns
- Cache read results aggressively

### Capacity Strategy
- Assume free‑tier size and daily query limits
- Design so that limits are not hit under normal usage
- Provide admin export capability for backup/migration

---

## 7. Caching Strategy (Critical)

### Edge Caching
- All public read endpoints must be cacheable
- Articles cached per URL
- Sidebar structure cached independently

### Cache Invalidation
- Cache invalidation occurs only on:
  - Article publish/update
  - Section change
- No time‑based invalidation required initially

### Result
- D1 reads minimized
- Traffic spikes absorbed by edge cache
- Free tier remains viable long‑term

---

## 8. Editor & Content Handling (Technical Constraints)

### Canonical Content Format
- Plain text with minimal semantic markers
- Unicode‑normalized
- No HTML persistence

### Input Handling
- `<textarea>`‑based editor only
- Paste interception required
- Clipboard content sanitized and normalized

### Autosave
- Local persistence (IndexedDB or equivalent)
- Remote persistence throttled
- No UI re‑render during typing

**Why this matters:**  
Prevents cursor jumps, undo corruption, and mobile browser bugs.

---

## 9. Typography & Rendering Stack

### Fonts
- Primary: High‑quality Urdu font (Nastaliq style)
- Fallback: Lighter Naskh/system serif

### Rendering Pipeline
1. Fetch plain text from API
2. Convert semantic markers to HTML
3. Apply typography and RTL layout
4. Sanitize output before rendering

### Performance Rules
- One font weight only
- `font-display: swap`
- Avoid layout thrashing

---

## 10. Device & Browser Targets

### Minimum Targets
- Android (low‑end devices included)
- Mobile Chrome / Firefox
- Desktop Chrome / Firefox
- Safari (basic support)

### Explicit Non‑Goals
- Legacy IE
- Smart TVs
- Embedded webviews with limited JS support

---

## 11. Error Handling & Resilience

### Admin Side
- Network failures handled gracefully
- Local drafts preserved
- Explicit publish failure messaging

### Reader Side
- Cached content preferred
- Graceful degradation if API unavailable
- No blocking spinners

---

## 12. Development & Deployment Workflow

### Source Control
- Git‑based workflow
- Main branch deploys to production

### Deployment
- Cloudflare Pages handles frontend builds
- Workers deployed via Wrangler or Pages Functions

### Environments
- Local development
- Production
- Preview builds for UI review

---

## 13. Forbidden Technical Decisions

The following are explicitly disallowed unless the design document is revised:

- Rich‑text editors (Quill, TipTap, etc.)
- Client‑side databases beyond local draft storage
- Heavy UI frameworks
- Automatic feature generation
- Background workers or schedulers
- Analytics or tracking SDKs

---

## 14. Success Criteria (Technical)

- Entire system runs indefinitely on free tier
- Admin can publish from mobile with zero editor instability
- Readers experience fast load times globally
- D1 limits are not exceeded under normal traffic
- System is easy to reason about and maintain

---

## 15. Final Note to Engineers / AI Coders

This project is **deliberately constrained**.

Do not:
- Add features
- Add abstractions
- “Improve” UX without approval

Your job is to **implement faithfully**, not innovate.

---

**End of Tech Stack Document**
