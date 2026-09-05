# Design System Guide — "Inventory" Style
> Reference: Dribbble shot "Inventory Management Website"
> Purpose: This document defines the visual language, components, and layout rules an agentic AI must follow when designing or extending pages for this website. Treat every rule below as a constraint, not a suggestion — consistency across pages matters more than novelty on any single page.

---

## 1. Brand Personality
- Professional but approachable SaaS product (B2B, operations/logistics tone)
- Clean, confident, slightly playful through illustration — not corporate-stiff
- High contrast between deep navy/black text and a single vibrant green accent
- Generous whitespace; content breathes, nothing feels cramped

---

## 2. Color Palette

| Role | Color | Hex (approx) | Usage |
|---|---|---|---|
| Primary Accent (Green) | Emerald Green | `#1FAE5D` / `#22C55E` | Primary buttons, active nav pill, icon accents, links-as-CTA, checkmarks |
| Ink / Heading | Near-black Navy | `#111827` / `#0B1220` | Headlines, logo badge background, primary body text |
| Body Text | Slate Gray | `#4B5563` | Paragraph copy, secondary descriptions |
| Muted Text | Light Gray | `#9CA3AF` | Captions, labels, timestamps |
| Background — Primary | White | `#FFFFFF` | Main content surface, cards |
| Background — Ambient | Soft mint/blue gradient | `#EAF3F1` → `#F5FAF9` | Page backdrop behind the framed content, subtle grid texture overlay |
| Icon Accent — Blue | `#3B82F6` | Secondary feature icon badges (e.g. "Barcode Scanning") |
| Icon Accent — Purple | `#A855F7` | Secondary feature icon badges (e.g. "Multi-Warehouse") |
| Icon Accent — Orange | `#F97316` | Secondary feature icon badges (e.g. "Automation") |
| Illustration Blue | `#3B7DFF` | Dotted connector lines, illustration details |

**Rules:**
- Green is the *only* color used for primary calls-to-action. Never use blue/purple/orange for a main CTA button — those are reserved for feature-icon badges only.
- Each feature/step block gets ONE accent color from the rotation (green → blue → purple → orange), cycling in that order for icon badges.
- Text is always navy/gray on white — never colored body text.

---

## 3. Typography

- **Headings:** Bold, rounded-geometric sans-serif (e.g. Poppins, General Sans, Satoshi, or Clash Display — Bold/ExtraBold weight). Tight line-height (~1.05–1.1), large size, navy color.
- **Body copy:** Regular-weight sans-serif (e.g. Inter, General Sans Regular), slate gray, comfortable line-height (~1.6).
- **Optional serif accent:** the source design pairs a serif display face with the sans system sparingly (e.g. for a section eyebrow or pull-quote) to add contrast — use only for small accent labels, never for primary headlines or body copy.

**Scale (desktop):**
| Element | Size | Weight |
|---|---|---|
| Hero H1 | 48–56px | Bold/800 |
| Section H2 | 28–34px | Bold/700, centered |
| Card/Feature Title | 16–18px | Semibold/600 |
| Body / Description | 15–16px | Regular/400 |
| Nav links | 15px | Medium/500 |
| Button text | 15–16px | Bold/700 |
| Small/caption | 12–13px | Medium/500, uppercase tracking for labels like "DESKTOP" / "HOMEPAGE" |

---

## 4. Layout & Grid

- Content lives inside a **rounded, framed container** (large `border-radius` ~24–32px, thin black or dark border ~2px) that sits on top of the soft ambient gradient background — like a browser/device frame. Use this framing device consistently for full-page mockups/previews.
- Max content width ~1200–1280px, centered, generous side padding (64–96px desktop, 20–24px mobile).
- Section vertical rhythm: large gaps between sections (~96–120px desktop) — sections should never feel adjacent.
- Section headings are **centered**, feature/step content below is left-aligned within its own block.
- Background of the outer page uses a **faint grid/graph-paper texture** at low opacity behind the gradient — subtle, not decorative-heavy.

---

## 5. Navigation Bar

- Left: Logo as a **dark navy pill/rounded-rect badge**, white bold "Logo" text (or wordmark) inside.
- Center: horizontal text nav links (Product, Integration, Customer Stories, Pricing, Blog) — regular weight, navy/dark gray, no underline, hover = slightly darker or accent-green underline.
- Right: a plain text "Sign in" link followed by a **green pill CTA button** (e.g. "Features" / "Get Started").
- Nav sits on transparent/white background, no shadow, thin bottom border optional.

---

## 6. Buttons

- **Primary CTA:** Full pill shape (`border-radius: 999px`), solid green fill (`#22C55E`), white bold text, comfortable padding (~14px vertical / 28–32px horizontal). No border. Slight hover darken.
- **Secondary/nav CTA:** Same pill shape, smaller size, used in nav bar.
- **Text links:** No button chrome, navy or gray text, used for "Sign in" style items.
- Never use square/sharp-cornered buttons — pill shape is a hard rule throughout.

---

## 7. Illustration Style

- Hand-drawn, flat, **outlined line-art illustrations** with a limited palette: green, blue, black stroke, white fill.
- Thick, confident black outlines (~3–4px equivalent).
- Dotted/dashed blue connector lines used as decorative motion/flow accents around illustrations.
- Characters and objects are simplified, friendly, slightly whimsical — avoid photorealism or stock photography entirely. All imagery on this site should be illustration-based, not photographic.

---

## 8. Components

### 8.1 Feature Grid (4-column)
- Icon badge: rounded-square (~48px), colored background (cycle green/blue/purple/orange), white icon centered.
- Bold title directly under icon.
- 1–2 line gray description below title.
- Equal-width columns, generous gutter, no card border/shadow — just whitespace separation.

### 8.2 Numbered Process Steps
- Left: a framed screenshot/mockup card (rounded corners, subtle border).
- Right: vertically stacked steps, each with a small colored square icon badge, bold title, gray description.
- A **dashed vertical connector line** links the step icons top-to-bottom.

### 8.3 Trusted-By Logo Row
- Horizontal row of partner/customer logos, grayscale or brand-original colors, evenly spaced, centered, no card/border around individual logos.

### 8.4 Testimonial Card
- White rounded card, soft shadow.
- Large quotation mark glyph top-left, star rating row (filled green/gold stars) top-right or above quote.
- Quote text in medium-size navy/gray text.
- Avatar (circular) + name (bold) + title/company (gray) below quote.
- Carousel arrows (left/right, circular icon buttons) and dot indicators beneath if multiple testimonials.

### 8.5 Final CTA
- Centered bold H2, single green pill button below ("Get started").

---

## 9. Spacing & Radius Tokens

| Token | Value |
|---|---|
| `radius-sm` (icon badges) | 12px |
| `radius-md` (cards) | 16–20px |
| `radius-lg` (page frame, feature cards) | 24–32px |
| `radius-pill` (buttons, logo badge) | 999px |
| `space-section` | 96–120px vertical |
| `space-block` | 24–40px |
| `space-inline` | 8–16px |

---

## 10. Do / Don't

**Do:**
- Keep every CTA button green and pill-shaped.
- Use the icon-badge color rotation (green → blue → purple → orange) consistently across feature sets.
- Use line-art illustrations for all imagery.
- Center section headings; left-align supporting content.
- Maintain generous whitespace between sections.

**Don't:**
- Don't introduce photographic imagery.
- Don't use sharp/square buttons.
- Don't use more than one accent color on a single button or badge.
- Don't crowd sections — avoid tight vertical rhythm.
- Don't use colored body text; text stays navy/gray only.

---

## 11. Implementation Notes for Agentic AI
- When generating new pages/sections, reuse the component patterns in Section 8 rather than inventing new card/layout styles.
- Always pull colors from the palette table (Section 2) — no ad hoc hex values.
- Default to the pill-button and rounded-frame conventions even for new page types (dashboards, pricing tables, forms) to preserve consistency with this reference design.
- If a new icon-badge color is needed beyond the 4-color rotation, prefer a muted tint of an existing palette color over introducing a new hue.
