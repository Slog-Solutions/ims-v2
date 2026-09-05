# Responsive Design Guide — BEG & Centre Roorkee EQPT INFO & MGMT SYS

This guide is written for whichever agent (human or AI) touches this frontend next.
It documents the responsive system that already exists in this codebase, the specific
issues found and fixed in this pass, and the rules to follow so new UI doesn't regress.

Read this before writing any new component or page. Don't invent a new spacing/breakpoint
system — extend the one described here.

---

## 1. How "responsive" is defined for this project

"Responsive" here covers three related things, and all three must hold:

1. **Viewport resize** — the layout reflows correctly from ~360px (small phone) up to
   4K desktop, with no horizontal scroll on the page body and no clipped content.
2. **Browser zoom (Ctrl/Cmd + `+`/`-`, or pinch-zoom)** — zooming narrows the effective
   CSS layout viewport. A page that is only "responsive" at native window sizes but
   breaks at 150%–200% browser zoom is **not** responsive. Any element with a hardcoded
   pixel width and no fluid fallback is a zoom bug waiting to happen.
3. **OS/browser text-size scaling** — users who increase their base font size for
   accessibility should not break layouts either. This is why the design tokens below
   are expressed with `clamp()` and relative units wherever they carry meaning.

**Practical test procedure for any page you touch:** open it at 1440px wide, then resize
the window down to 1024 → 768 → 480 → 360px, and separately test browser zoom at 100% →
125% → 150% → 175% → 200% on a normal desktop width. At every step: no horizontal
scrollbar on `<body>`, no text/button clipped, no element overlapping another.

---

## 2. Design tokens — single source of truth

All tokens live in `src/index.css` under `:root` (and `.dark-theme` for overrides).
**Never hardcode a color, spacing, radius, or shadow value in a component.** Use the
existing CSS variable. If a value you need doesn't exist yet, add it to `:root` first.

Key token groups already defined:
- Colors: `--bg-*`, `--primary-green*`, `--text-*`, `--border-color*`, `--accent-*`
- Typography scale (already fluid): `--fs-display`, `--fs-h1`, `--fs-h2`, `--fs-h3` use
  `clamp(min, preferred-vw, max)` — this is the correct pattern, reuse it for any new
  large heading. `--fs-h4` down to `--fs-2xs` are fixed px for body/UI text, which is
  intentional (small UI text shouldn't fluidly scale with viewport width, only with
  browser zoom, which px already respects).
- Spacing (8px grid): `--space-2xs` → `--space-3xl`
- Radius: `--radius-xs` → `--radius-full`
- Layout constants: `--sidebar-width` (260px), `--sidebar-collapsed-w` (72px),
  `--topbar-height` (64px), `--content-max-width` (1400px)

If you introduce a new component that needs its own size token (e.g. a chart container),
follow the pattern already used by the equipment donut card:
```css
width: clamp(170px, 15vw, 215px);
```
`clamp(min, fluid, max)` is the standard way to size anything in this project that isn't
plain text or a fixed-height icon/button.

---

## 3. Breakpoint system

**Audit finding:** the existing CSS already uses media queries, but at inconsistent,
one-off widths chosen per-component: `1199, 991, 767/768, 700, 662, 575/576, 480, 430,
407, 390`. This works today but makes it hard to reason about "what does the layout look
like at width X" and easy to introduce a gap between two breakpoints where nothing has
been tested.

**Rule going forward:** use these six standard breakpoints for any *new* CSS. Don't
invent a new one-off number unless a specific component genuinely breaks at an
in-between width (as several already legitimately do — that's fine, just prefer the
standard scale first):

| Name | Max-width | Use for |
|---|---|---|
| `xs` | 480px | Small phones |
| `sm` | 575px | Phones |
| `md` | 767px | Large phones / small tablets (topbar/sidebar stack point) |
| `lg` | 991px | Tablets (sidebar becomes off-canvas drawer at this point) |
| `xl` | 1199px | Small laptops (stat grids drop to 2 columns) |
| `xxl` | 1400px | `--content-max-width` — page content stops growing wider |

The existing odd breakpoints (662, 700, 407, 430, 390) are legitimate fine-tuning for
specific components (navbar wrap point, marketplace filter chips, etc.) — leave them,
but don't add more of that kind without a documented reason in a code comment.

---

## 4. The app shell — do not fight this pattern

The app uses a **fixed-viewport shell with internal scroll regions**, not a normal
scrolling page:

```
html, body            → height: 100%, overflow: hidden
.app-container         → height: 100vh, overflow: hidden
.app-body-layout        → flex row, height: 100vh
  .sidebar-panel          → height: 100vh, own overflow-y: auto (off-canvas < 992px)
  .app-main-area           → flex column, height: 100vh
    .topbar / .navbar-farm   → fixed height, sticky
    .main-content             → flex: 1, height: calc(100vh - topbar), overflow-y: auto
```

This is intentional: only `.main-content` (and the sidebar nav list) scroll; the shell
itself never scrolls. **When adding a new page**, put all page content inside the
existing `.main-content` region — don't add another `height: 100vh` wrapper inside it,
and don't remove `overflow-y: auto` from `.main-content`, or content will clip instead
of scrolling at high zoom levels or on short viewports.

If a full-screen overlay is needed (modals, the bulk-add workspace), follow the existing
`.bulk-add-overlay` pattern: `position: fixed; inset: 0;` with its own internal
`overflow-y: auto` region — never `overflow: hidden` on the outer overlay itself.

---

## 5. Component rules

### 5.1 Never ship a fixed pixel width without a fluid fallback
This was the main defect found in this audit (see §7). Any inline style or CSS rule of
the form `width: 230px` on something that isn't a fixed-size icon/avatar/badge **must**
have a way to shrink on narrow viewports. Two acceptable patterns:

```jsx
// Minimum: safety net (what this pass added everywhere it found the bug)
style={{ width: '230px', maxWidth: '100%' }}

// Better: fully fluid, preferred for new code
style={{ width: 'clamp(160px, 30vw, 230px)' }}
```
Fixed sizes are fine for: icons, avatars, badges, checkboxes/radio dots, and anything
whose real-world size shouldn't change (e.g. a 34px nav icon button).

### 5.2 Filter rows / toolbars
Wrap in a flex container with `flex-wrap: wrap` and `gap` (Bootstrap's `d-flex flex-wrap
gap-*` utility classes are already used throughout — keep using them), and give each
child a fluid width per §5.1. This is what the existing `.action-row`, `.orders-header-row`
and `.marketplace-filters` classes do — copy that pattern for new toolbars instead of
writing bespoke flex CSS.

### 5.3 Tables
Wrap in `.table-responsive-farm` (horizontal scroll on overflow) exactly as done today.
Don't try to make wide data tables reflow into cards on mobile unless specifically asked
— horizontal scroll inside a bounded card is the established pattern here and is
correct for dense inventory/voucher data.

### 5.4 Charts (donut/bar cards)
Follow `EquipmentHoldingsDonutCard.jsx` / `StockDistributionBarCard.jsx`: SVG dimensions
driven by `clamp()` CSS variables, legend text truncated with `text-overflow: ellipsis`
plus a `max-width`, and a `@media (max-width: 576px)` rule that stacks chart + legend
vertically instead of side-by-side. Any new analytics card should reuse this exact
shape rather than inventing a new one.

### 5.5 Grids
Use the existing `.stats-grid` (4 → 2 → 1 columns) and `.two-col-layout` (2 → 1 column)
utility classes, or Bootstrap's `row`/`col-12 col-xl-6` grid (used in `Dashboard.jsx`) —
don't hand-roll a new CSS grid for a layout these already cover.

### 5.6 Typography
Large headings (page titles, hero text): use `clamp()` like `--fs-h1`/`--fs-h2` already
do. Body/UI text: use the fixed-px tokens (`--fs-body`, `--fs-sm`, etc.) as-is — they
already respond correctly to browser zoom and OS text scaling because they're real `px`
values inside a normally-scaling document, not baked into an image or canvas.

---

## 6. Things to leave alone / known intentional tradeoffs

- `background-attachment: fixed` is used on the navbar, sidebar, and app background for
  a parallax-style look. This is a deliberate visual choice, not a bug — but be aware it
  can cause minor repaint jank on some mobile browsers. If a future task is specifically
  "improve mobile scroll performance," that's the first thing to look at; it is **not**
  a responsiveness/zoom issue and shouldn't be changed as part of a responsive pass.
- `src/styles/_variables.scss`, `_mixins.scss`, `_theme.scss`, `_animations.scss`, and
  `main.scss` exist but are **empty (0 bytes) and not imported anywhere**. All real
  styling lives in `src/index.css` and `src/App.css`. Don't add new styles to the empty
  SCSS files expecting them to take effect — either wire them into the build first or
  (preferably) keep using `index.css`/`App.css` for consistency with the rest of the app.
- Bootstrap (`bootstrap/dist/css/bootstrap.min.css`) is imported globally for grid/utility
  classes and some form controls; the custom design system in `index.css` layers on top
  and overrides Bootstrap's defaults (buttons, cards, tables). New components should
  prefer Bootstrap's utility classes (`d-flex`, `flex-wrap`, `gap-*`, `col-*`) for layout
  plumbing, and the custom `--*` tokens/classes (`.card-farm`, `.btn-primary-farm`, etc.)
  for visual styling.

---

## 7. Audit results from this pass

### Fixed
Found hardcoded `width: 'Npx'` inline styles with no fluid fallback on filter/search
inputs and table header cells in these files, and added `maxWidth: '100%'` to each so
they can no longer force horizontal overflow on narrow viewports or at high browser zoom:

- `src/pages/Reports.jsx` (8 occurrences)
- `src/pages/Condemnations.jsx` (6 occurrences)
- `src/pages/EquipmentCentral.jsx` (7 occurrences)
- `src/pages/Vouchers.jsx` (10 occurrences)
- `src/pages/TaskPlanner.jsx` (2 occurrences)

This is a **safety-net fix**, not a full redesign of those fields — it guarantees they
can no longer overflow, but they still shrink to a fixed floor rather than scaling
smoothly. Follow-up: replace `width: 'Npx', maxWidth: '100%'` with `width:
'clamp(120px, 25vw, Npx)'` on each of the above per the §5.1 "better" pattern, field by
field, next time one of those pages is touched — do it opportunistically rather than as
a giant separate refactor.

### Checked and already correct — no change needed
- `src/index.css` global safety net (`img/svg/video { max-width: 100% }`,
  `html, body { max-width: 100%; overflow-x: hidden }`, `* { box-sizing: border-box }`)
- `index.html` — viewport meta tag (`width=device-width, initial-scale=1.0`) present and correct
- Sidebar/Navbar off-canvas breakpoints (991px) and app-shell scroll regions
- Dashboard grid (`Dashboard.jsx`) — uses Bootstrap responsive columns + `.two-col-layout`
- Chart cards (`EquipmentHoldingsDonutCard.jsx`, `StockDistributionBarCard.jsx`) —
  already fully `clamp()`-driven
- `Login.jsx` — has its own scoped `@media` rules at 768px/480px that correctly stack
  the two-column layout
- `pages/ItemsCatalog.jsx`, `pages/NomenclatureMaster.jsx`, `pages/RfidSimulator.jsx`,
  `pages/shared/Profile.jsx`, and all files under `components/` — no hardcoded fixed-px
  widths without a fluid fallback found

### Not yet individually audited component-by-component
This pass focused on layout-breaking width issues findable by static search. It did
**not** do a full manual pass (resize + zoom test) through every page in a browser.
Before considering the app "fully responsive," walk through the checklist in §1 for:
- `ItemsCatalog.jsx`, `NomenclatureMaster.jsx`, `RfidSimulator.jsx`, `Profile.jsx`
- Any modals/overlays not covered above
- Real data states (long product names, long establishment names, empty states) —
  static search can't catch a table column that only overflows with real long text

---

## 8. Checklist for any new page or component

- [ ] No `width:`/`height:` in px without `maxWidth`/`clamp()` fallback (icons/avatars exempt)
- [ ] Lives inside `.main-content`; doesn't add its own `height: 100vh` wrapper
- [ ] Filter/toolbar rows use `d-flex flex-wrap gap-*` (or `.action-row`)
- [ ] Wide tables wrapped in `.table-responsive-farm`
- [ ] Large headings use `clamp()`; body text uses the existing `--fs-*` tokens
- [ ] Tested at 1440 → 1024 → 768 → 480 → 360px window widths
- [ ] Tested at 100% → 150% → 200% browser zoom at a normal desktop width
- [ ] No new one-off breakpoint added unless the standard scale (§3) genuinely doesn't fit
