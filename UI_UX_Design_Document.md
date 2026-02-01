
# UI / UX Design Document
**Project:** Cloudflare-based Urdu Articles — Writer-first, Zero-cost  
**Status:** Final design doc for handoff to engineering  
**Date:** 2026-02-02

---

## Overview (1 paragraph)
Build a zero-cost, Cloudflare-only web application to publish high-quality Urdu articles. Target: single admin who writes primarily from a smartphone. Reader UX: calm, wiki-style with a structural sidebar. Strict constraints: online-only, Urdu-only (RTL), articles only, overwrite edits, canonical plain-text content, no engagement features.

---

## Design Philosophy (brief)
- **Writer-first:** If writing from phone is effortless, reading follows.
- **Simplicity over features:** Minimal UI to reduce errors and complexity.
- **Predictability and stability:** Avoid fragile web patterns (e.g., contenteditable).
- **Structure, not promotion:** Sidebar provides context and navigation, not engagement hooks.

---

## Global UX Rules
- Base direction: `direction: rtl;` on root content containers.
- One font family per context (body vs UI). Primary body font: **Noto Nastaliq Urdu** with a simpler Naskh fallback for low-end devices.
- Measure: 60–70 characters (approx) max line length on wide screens; adapt to mobile naturally.
- Line height: 1.8–2.0 for body text (Urdu needs vertical space).
- Color: high-contrast text on light background; minimal palette (background, body text, accent).
- Touch targets: minimum 44×44 CSS pixels.
- No animations except essential transitions (sidebar open/close).

---

## Writer (Admin) UI — Full Specification
**Primary goal:** Allow a single admin to create, edit, and publish articles entirely from a smartphone without friction.

### Screen flow (mobile-first)
1. **Login** (one-time): admin pastes Bearer token or signs in via secure mechanism — minimal UI. After login, app stores token in secure storage (not localStorage if possible).
2. **Home (Admin)**: List of recent articles (title + updated_at) — minimal list. "New Article" floating action button (FAB) visible.
3. **Full-screen Editor** (primary screen):
   - Full viewport single-column.
   - Large `<textarea>` occupying most vertical space; header shows title input (sticky top).
   - Title input: single-line input with clear label; autosave title separately.
   - Body: `<textarea>` with:
     - `direction: rtl;` and `lang="ur"`.
     - Font-size: 18–20px (Noto Nastaliq), line-height: 1.8.
     - Padding: comfortable (16–20px).
   - Minimal action bar (sticky bottom, small): [Save draft icon (hidden if autosave works), Publish button, More (delete/archive)].
   - Publish flow: tap Publish → Confirm (single button "Publish") → optimistic save + show "Published" toast.
4. **Edit existing article**: Open editor with loaded content; autosave active.
5. **Network error handling**:
   - If network fails during autosave: store in IndexedDB queue and retry. Show unobtrusive offline indicator "Draft saved locally".
   - No blocking modals; user can continue writing.
6. **Paste behavior**:
   - On paste, intercept clipboard content and:
     - Convert to **plain text**.
     - Normalize Unicode (NFKC or recommended normalization).
     - Strip invisible characters and directional marks (neutralize LTR markers).
     - Convert common patterns to simple semantic markers:
       - Headings: lines starting with `# ` or lines with all-caps/short length → `# Heading`
       - Lists: bullets `- ` or `* ` preserved
       - Blockquotes: lines starting with `>` preserved
     - Remove images/media — show a toast "Images removed; text pasted".
   - The editor **never** accepts raw HTML or inline styling.
7. **Autosave rules**:
   - Save to local IndexedDB every 3 seconds of inactivity or on blur.
   - Throttle saves to remote (Workers/D1) to once per 10–15 seconds max if connected.
   - Save must not re-render the input or move cursor/caret. Use `textarea` native behavior to ensure caret stability.
8. **Validation & sanitization server-side**:
   - Server should re-normalize text and reject payloads containing control characters or HTML tags.
9. **Publish semantics**:
   - Publish = overwrite `content` field of article.
   - Admin may toggle `is_pinned` and `section` from a simple dropdown.
10. **UX success metrics for writer** (for QA):
    - No cursor jumps during typing or auto-save in 99% of cases on target devices.
    - Paste from WhatsApp / Google Docs results in readable, correctly-shaped Urdu text 95% of the time.
    - Publish round-trip ≤ 3 seconds on 4G.

---

## Reader UI — Article Page
**Primary goal:** Calm reading with structural access via sidebar.

### Article layout
- Top: Article title (large, centered or left-aligned according to final visual design; ensure RTL alignment).
- Meta row: published date, section name (no author box).
- Body: rendered HTML from canonical plain-text.
  - Render rules: headings → `<h1>`/`<h2>` etc; lists → `<ul>`; quotes → `<blockquote>`.
  - All rendered HTML must be sanitized; no embedded scripts/styles.
- Typography: Noto Nastaliq, size ~18–20px, line-height 1.8–2.0, max-width ~60–70 characters.
- No inline ads, no share popups by default.

### Sidebar (wiki-style)
- **Desktop**:
  - Vertical sidebar (left or right? For Urdu/RTL, default the sidebar on the right — confirm with visual tests).
  - Fixed width (e.g., 280–320px); independent scroll.
  - Content:
    - Sections (ordered)
    - Article titles per section (title only)
    - Current article highlighted visually (accent color + background)
    - Pinned articles at top
  - Sidebar remains visible on larger screens.
- **Mobile**:
  - Hidden by default.
  - Accessible via a single icon in the header (hamburger or list icon).
  - Slides in from the **right** (RTL-correct).
  - Full-screen overlay with dismiss via swipe-right or close icon.
  - Sidebar entries are tappable; selection closes overlay and navigates.
- **Interactions**:
  - No infinite scroll in sidebar or article lists.
  - Sidebar is scrollable independently; keep it snappy.

### Navigation & UX rules
- No breadcrumbs unless visually needed.
- Use clear visual affordances for active section.
- Maintain whitespace; no presentation clutter.

---

## Content Structure (words-only)
- **Article**: title, slug, excerpt, content (plain-semantic text), section_id, published_at, updated_at, is_pinned.
- **Section**: id, name, slug, order_index.
- **Tag**: id, name, slug (optional).
- No deep nesting. Article belongs to exactly one section. Tags are optional.

---

## Typography & RTL Implementation Notes
- Use `dir="rtl"` on article container elements.
- Use `unicode-bidi: isolate;` for mixed direction inline segments where needed (numbers/URLs).
- Provide `lang="ur"` attributes for assistive tech.
- Primary font: Noto Nastaliq Urdu. Provide Naskh fallback or system serif for devices that struggle.
- Load fonts with `font-display: swap` to avoid render-blocking and give fallback while loading.
- Test on low-end Android devices; if performance issues occur, switch to a lighter-weight Naskh fallback for body.

---

## Interaction & Accessibility
- All interactive elements must be keyboard-accessible (for admin on desktop).
- Ensure color contrast meets WCAG AA for body text.
- Focus states visible for links and controls.
- Provide `aria-labels` for sidebar toggle and publish actions.
- Provide `lang="ur"` and proper directionality for screen readers.

---

## Error Handling & Edge Cases
- **Save failures**: retry in background, show subtle status (e.g., toast "Saved locally — will sync when online").
- **Publish failure**: show error with explicit retry button.
- **Large paste/unsupported content**: reject and explain ("Pasted content contained images. Only text allowed.").
- **D1 limit error**: surface admin-visible banner "Storage limit reached — contact owner" and provide export endpoint.

---

## Performance & Caching (handbook for engineers)
- Cache sidebar (sections + article lists) at edge; invalidate on publish of relevant section.
- Cache article pages; set Cache-Control with reasonable TTL (e.g., 1 hour) and revalidate on publish.
- Minimize D1 reads: use edge-cached JSON for read paths.
- Load fonts selectively; avoid multiple font weights.

---

## Developer Handoff Checklist (what to include)
- Context file (already created).
- This UI/UX design document (deliverable).
- Precise API contract stub (endpoints, payloads) — engineer to implement.
- Acceptance criteria: list of behavior tests for writer/editor and reader.
- Device test matrix: target Android versions/devices, iOS versions, desktop browsers.

---

## References & Evidence (selected authoritative sources)
- Cloudflare D1 docs (limits & pricing) — ensure D1 usage aligns with quota.  
- W3C bidi & Arabic/Urdu layout recommendations.  
- MDN contenteditable and API notes on editing behaviors.  
- NN/g guidelines for vertical navigation and menus.  
- Google Fonts: Noto Nastaliq Urdu.

(Links used during research are included in a separate reference bundle for developers.)

---

## Appendix A — Paste Sanitization Rules (technical but not code)
1. Convert clipboard HTML to plain text using a robust sanitizer.
2. Apply Unicode normalization (NFKC recommended) to the plain text.
3. Strip control characters: 200E, 200F, and other bidi control marks except where intentionally used.
4. Collapse multiple blank lines into a single paragraph break unless user pasted intentional spacing.
5. Preserve simple semantics: headings, lists, blockquotes by converting patterns or leading markers.
6. Reject embedded images/media; provide user feedback.

---

## Appendix B — Autosave Timing & Limits (recommended)
- Local autosave: every 3 seconds of inactivity or on blur.
- Remote save: at most once per 10 seconds; debounce user input.
- Network retries: exponential backoff up to 5 attempts, then stop and keep local copy.
- Local storage retention: keep local drafts for 30 days; allow export.

---

## Acceptance Criteria (for QA)
- Admin can compose and publish an article using only a smartphone, with no visible editor glitches or cursor jumps in 99% of test sessions across a sample of low-end Android devices.
- Paste from WhatsApp results in correctly normalized Urdu text in 95% of test cases.
- Sidebar loads and displays sections and 100 article titles per section within 200ms on 4G (edge-cached).
- No HTML or inline styles are persisted in D1 content fields.

---

## Delivery
This document is intended as the final UI/UX design doc to hand to coders. It is detailed enough to enable implementation with minimal interpretation, while deliberately forbidding features outside scope.

---

**If you want, I will now:**
- Generate a downloadable markdown file of this doc (done) and provide a link.
- Convert it to PDF for printing and handoff.
- Produce a short checklist for QA engineers.

