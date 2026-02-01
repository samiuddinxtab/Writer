
# Product Requirements Document (PRD)
**Project:** Urdu Articles — Writer-first, Cloudflare Free Tier  
**Author:** (Prepared for) Single-admin publishing project  
**Date:** 2026-02-02  
**Status:** Final draft for engineer handoff

---

## Executive Summary (one paragraph)
A lightweight, zero-cost web application to publish high-quality Urdu articles. Target single admin who writes on a smartphone; readers access a calm, wiki-style site with a structural sidebar. Built entirely on Cloudflare free services (Pages, Workers, D1). No user accounts, no ads, no comments. Canonical content stored as plain semantic text; editor is textarea-based to guarantee mobile stability.

---

## Goals & Success Metrics
**Primary goal:** Enable the admin to create, edit, and publish high-quality Urdu articles from a smartphone flawlessly.  
**Secondary goal:** Deliver a fast, distraction-free reading experience with wiki-style navigation.

**Key success metrics (OKRs / KPIs):**
- Writer reliability: 99% of test sessions show no cursor/caret jump during typing or autosave on target devices.
- Paste quality: 95% of pasted Urdu text from WhatsApp/Google Docs/Word renders correctly after normalization.
- Publish latency: 90th percentile publish roundtrip ≤ 3s on 4G.
- Reader performance: First contentful paint ≤ 1.5s on mobile 4G (edge-cached).
- Availability: Public read pages uptime ≥ 99.9% (Cloudflare SLA dependent).
- D1 safe usage: No D1 free-tier quota exhaustion under expected traffic (< defined daily reads baseline).

---

## Background & Assumptions
- Single admin/writer; low write volume, read-heavy traffic.
- Urdu only (RTL), online-only (no offline PWA for now).
- No media hosting (no images), no analytics or engagement features.
- Must operate entirely within Cloudflare free-tier constraints.
- Engineering teams/AIs must not add features beyond this doc without approval.

---

## Target Users & Personas
1. **Admin (Primary Persona)**
   - Demographics: Single author, smartphone-first, basic technical comfort.
   - Needs: Fast, reliable typing/pasting, autosave, one-tap publish, minimal UI.
   - Success: Can produce and publish an article within 10–15 minutes on phone.

2. **Reader (Secondary Persona)**
   - Demographics: Urdu-speaking readers on mobile/desktop.
   - Needs: Focused, readable articles, easy navigation via sidebar, quick load times.
   - Success: Find and read articles with minimal cognitive load.

---

## User Journeys (short)
1. Admin writes article:
   - Login (token); taps "New Article"; pastes content; edits; taps Publish; article visible publicly; sidebar updates.
2. Reader finds article:
   - Opens homepage or article URL; reads article; opens sidebar to navigate to sections/articles; selects another article.

---

## Functional Requirements (must-have)
### Admin (writer) features
- FR1: Secure admin login using a bearer token stored in secure client storage.
- FR2: New article creation flow: title input + full-screen body textarea (RTL).
- FR3: Paste sanitization & normalization on client before local save.
- FR4: Autosave to local storage (IndexedDB) and periodic remote save (debounced).
- FR5: Publish action: writes canonical plain text to D1 and triggers cache invalidation.
- FR6: Edit existing article: load content into editor, autosave behavior, publish updates.
- FR7: Simple admin list view: titles + updated_at + quick edit action.
- FR8: Section management (create/reorder) and pin/unpin articles (admin-only).

### Reader features
- FR9: Article view: render canonical text to clean HTML; apply Urdu typography rules.
- FR10: Wiki-style sidebar: sections -> article titles (current highlighted).
- FR11: Responsive behavior: sidebar visible on desktop, slide-in from right on mobile.
- FR12: Edge-cached read endpoints; cache invalidation on publish.

---

## Non-Functional Requirements (NFRs)
- NFR1: Performance — FCP ≤ 1.5s (edge-cached mobile 4G); TTFB minimal.
- NFR2: Reliability — Readers can load cached pages even if D1 is briefly unreachable.
- NFR3: Scalability — Read path scales via Cloudflare edge; writes limited to single admin.
- NFR4: Security — HTTPS only; admin token validation; server-side input sanitization.
- NFR5: Accessibility — WCAG AA for text contrast, RTL semantics, screen-reader friendly (`lang="ur"`).
- NFR6: Maintainability — Clear separation: frontend (Pages), API (Workers), DB (D1).
- NFR7: Privacy — No analytics or tracking; no third-party trackers loaded.

---

## UX / UI Summary (refer to UI/UX design doc)
- Writer-first editor: full-screen textarea, large line-height, minimal action bar.
- Reader: narrow measure, Noto Nastaliq primary font with Naskh fallback, RTL layout.
- Sidebar: sections and article lists, scrollable, right-side on RTL devices.
- Autosave & paste handling rules as in UI/UX doc.

---

## Content Model (conceptual)
- Article: id, title, slug, excerpt, content (plain semantic text), section_id, is_pinned, published_at, updated_at
- Section: id, name, slug, order_index
- Tag (optional): id, name, slug
- ArticleTags: join (article_id, tag_id)
(Note: exact SQL schema to be created by engineers per D1 capabilities; content must be stored as plain text.)

---

## API Contract (high-level, not code)
- Public read endpoints:
  - GET /api/sections -> ordered list of sections
  - GET /api/sections/:slug/articles -> list of articles (id, title, slug, published_at, is_pinned)
  - GET /api/articles/:slug -> full article payload (title, content, published_at, section)
- Admin write endpoints (require Bearer token):
  - POST /api/admin/articles -> create article (title, content, section_id, is_pinned)
  - PUT /api/admin/articles/:id -> update article
  - POST /api/admin/sections -> create section
  - POST /api/admin/tags -> create tag
- Responses: JSON; errors standardized (code, message)
- Cache-control: read endpoints must include TTL headers for edge caching; admin endpoints must purge/invalidate caches upon success.

---

## Security & Privacy
- Admin token rotated offline; stored in Worker secret and client secure storage.
- Sanitize pasted content client-side and server-side (remove control characters, strip HTML).
- No tracking cookies; minimal headers; no third-party analytics loaded.
- Consider rate-limiting admin endpoints to prevent brute-force or accidental floods.

---

## Accessibility Requirements
- All pages use `lang="ur"` and `dir="rtl"`.
- Keyboard-accessible controls for desktop.
- Sufficient contrast for text and controls.
- Provide ARIA labels for sidebar toggle and publish actions.

---

## Testing & QA
- Device test matrix: low-end Android (e.g., 2GB RAM), mid-range Android, iOS Safari, Desktop Chrome.
- Tests:
  - Editor stability: typing, paste, autosave, retry publish.
  - Paste normalization: WhatsApp, Google Docs, MS Word, PDF plain-text extraction.
  - Cache invalidation: publish must replace edge-cached content.
  - Load/perf: simulate 500 concurrent readers hitting cached pages.
- Acceptance tests defined in Acceptance Criteria section.

---

## Rollout Plan & Milestones
1. M1 (Week 0–1): Design sign-off & infra scaffolding (Pages + Workers + D1 schema)
2. M2 (Week 2–3): Reader pages + sidebar (static data) + font integration
3. M3 (Week 4): Editor (textarea) + paste sanitizer + local autosave
4. M4 (Week 5): Admin publish flow → D1 + cache invalidation
5. M5 (Week 6): QA, device testing, performance tuning, backup/export endpoint
6. M6 (Week 7): Beta launch (invite-only), monitor D1 usage
7. M7 (Week 8): Public launch

(Adjust weeks based on engineering capacity; these are sprint-level estimates.)

---

## Risks & Mitigations (revised)
1. **Paste abnormalities** — eliminated by canonical plain-text input + normalization pipeline.
2. **Editor instability** — eliminated by using `<textarea>` only.
3. **D1 quota exhaustion** — mitigated by edge caching read paths and limiting writes.
4. **Typography performance on low-end devices** — mitigated by single font + fallback strategy.
5. **Scope creep** — governance: changes require signed approval to PRD.

---

## Acceptance Criteria (QA-ready)
- AC1: Admin can create, paste, edit and publish an article on a low-end Android device with no cursor jump and publish RTT ≤ 3s in 90% cases.
- AC2: Sidebar shows updated article title within cache invalidation window after publish.
- AC3: No HTML or styling tags persisted in D1 content fields.
- AC4: Reader pages load and render proper Urdu typography and RTL layout across test devices.
- AC5: System handles 100x expected read traffic via edge cache without touching D1 frequently.

---

## Monitoring & Maintenance
- Monitor D1 usage daily (Cloudflare dashboard alerts).
- Provide admin export endpoint (SQL/JSON) for backups.
- Document token rotation procedure and emergency disable steps (revoke token in Worker).
- Keep a minimal ops runbook: cache invalidation, D1 export, rollback.

---

## Handoff Deliverables (to provide to engineers/AI coders)
- Context file (existing)
- UI/UX design doc (existing)
- This PRD (this file)
- Acceptance criteria & device matrix
- Optional: sample seed data (sections + 5 articles) for QA

---

## Appendix: Acceptance Test Matrix (summary)
- Typing stability: test 100 sessions across devices — 99 pass threshold
- Paste normalization: sample 50 pasted articles from real sources — 95 pass threshold
- Publish latency & cache: test in 4G & simulate cache invalidation
- D1 resiliency test: ensure read cache covers heavy bursts

---

**End of PRD**
