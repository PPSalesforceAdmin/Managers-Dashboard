# Progressive Property — Design System Reference
## For Claude Code / CLAUDE.md

Extracted directly from progressiveproperty.co.uk source CSS (April 2026).

---

## FONTS

**Primary font (all UI):** `Inter, sans-serif`
- Load via Google Fonts or CDN
- Headings on OptimizePress builder pages also reference `Poppins` and `Lato` (loaded via WebFontConfig), but the actual rendered components use **Inter exclusively**

**Fallback stack:** `'IBM Plex Sans', sans-serif` (used on OP3 blank templates only — ignore for your app)

**Legacy fonts loaded but not primary:** `Lato` (weights 100–900), `Poppins` (weights 100–900) — these are loaded in the head but Inter overrides them in all component-level CSS.

---

## COLOURS

### Brand Primary
| Name | HEX | RGB | Usage |
|------|-----|-----|-------|
| PP Orange | `#FF520B` | rgb(255, 82, 11) | All CTA buttons, accent borders, active tab indicators, icon colour, badges, social icons |
| PP Navy | `#222D57` | rgb(34, 45, 87) | All dark backgrounds (hero, cards, sections, footer-dark), heading text on light backgrounds |

### Accent / Tertiary  
| Name | HEX | RGB | Usage |
|------|-----|-----|-------|
| PP Amber | `#FFA733` | rgb(255, 167, 51) | Secondary pricing tier icon colour, secondary plan label |
| PP Green CTA | `#1EB236` → `#49F877` | gradient | WhatsApp-style CTA button |

### Neutrals
| Name | HEX | RGB | Usage |
|------|-----|-----|-------|
| White | `#FFFFFF` | rgb(255, 255, 255) | Primary background, card backgrounds, button text on dark |
| Off-white | `#F8F8F8` | rgb(248, 248, 248) | Top bar background, tab content background |
| Light grey border | `rgba(0,0,0,0.03)` | — | Subtle card borders |
| Body text | `#484848` | rgb(72, 72, 72) | Default body text colour (at 0.8 opacity frequently) |
| Dark text | `#161616` | rgba(22, 22, 22, 0.8) | Heading text on light backgrounds |
| Muted text | `rgba(0,0,0,0.6)` | — | Secondary/subtitle text |
| Footer bg | `#333333` | rgb(51, 51, 51) | Footer background |
| Footer text | `#CCCCCC` | — | Footer body text |
| Footer links | `#FFFFFF` | — | Footer link text |

---

## TYPOGRAPHY SCALE

### Headings (on light backgrounds)
- **H1 / Hero:** 58px, weight 700, letter-spacing -1px, line-height default, colour white (on dark bg)
- **H2 / Section title:** 44px, weight 700, letter-spacing -1px, colour `#222D57`
- **H3 / Card title:** 23px, weight 700, letter-spacing -0.5px, line-height 1.1em
- **H4 / Sub-heading:** 20px, weight 700
- **H5 / Small heading:** 16-18px, weight 600-700

### Body text
- **Default paragraph:** 15-17px, weight 400-500, line-height 2em, colour `rgba(72,72,72,0.8)`
- **Body on dark bg:** 15-16px, weight 400, line-height 2em, colour `rgba(255,255,255,0.8-0.9)`
- **Small text / labels:** 13-14px, weight 500-600
- **Tiny labels / badges:** 10-12px, weight 600-700

### Special text treatments
- Section subtitles: centred, max-width ~60%, `rgba(72,72,72,0.8)`
- Card descriptions on dark: `rgba(255,255,255,0.6)`
- Navigation links: 13px, uppercase, colour `#777`

---

## BUTTONS

### Primary CTA (Orange)
```css
background-color: #FF520B;  /* or #FF560C */
color: #FFFFFF;
font-family: Inter, sans-serif;
font-weight: 700;
font-size: 13-16px;
border-radius: 5-10px;
height: 40-68px;  /* varies by context */
padding: 0 22px;
box-shadow: none;
border: none;
text-transform: none;
```
Hover: `filter: brightness(1.05)`

### Secondary CTA (Navy)
```css
background-color: #222D57;
/* Same structure as primary, used for alternate emphasis */
```

### Gradient CTA
```css
background-image: linear-gradient(#FF520B 0%, #FF520B 100%);
/* Use solid orange. No gradient needed — the warm-orange endpoint was a drift. */
/* If you genuinely want a gradient for visual interest, darken slightly: */
/* linear-gradient(#FF520B 0%, #E54A0A 100%) */
border-radius: 10px;
```

### Ghost / Text button
```css
background: transparent;
color: #222D57;
font-weight: 700;
border: none; /* or bottom-border only for underline style */
```

### Pill badge/tag
```css
background-color: #FF520B;
border-radius: 49px;
padding: 5-10px;
font-size: 11-14px;
font-weight: 700;
color: white;
```

---

## BORDER RADIUS

- **Cards:** 10px (standard), 20px (featured/prominent cards)
- **Buttons:** 5px (standard), 10px (large CTAs)
- **Pill/badge:** 49px or 100px (full round)
- **Modal/popup:** 25px
- **Images in cards:** 5px

---

## SHADOWS

- **Standard card:** `rgba(0,0,0,0.27) 0px 0px 20px -4px`
- **Soft card:** `rgba(21,27,54,0.12) 0px 0px 20px -4px`
- **Very soft:** `rgba(0,0,0,0.05) 0px 0px 20px -4px`
- **Heavy card (stat panels):** `rgb(21,27,54) 0px 0px 20px -4px`
- **Image cards:** `rgba(0,0,0,0.12) 0px 0px 20px -4px`

---

## LAYOUT

- **Max-width container:** 1170px (standard), 1200px (hero), 1140px (content rows)
- **Column gap:** 20px default, 10px tight
- **Section padding:** 60-75px vertical (desktop), 15px (tablet/mobile)
- **Navbar height:** 100px
- **Navbar letter-spacing:** 0.5px
- **Footer padding:** 70px top/bottom
- **Footer font-size:** 13px

### Breakpoints (from CSS media queries)
- Desktop: 1200px+
- Tablet landscape: 960-1023px (navigation collapses)
- Tablet: 768-1023px
- Mobile: < 767px
- Small mobile: < 600px, < 580px, < 450px

---

## SECTION PATTERNS

### Hero section
- Dark navy background (`#222D57`) with background image at 16% opacity
- Centred white text, max-width 900px for headline
- Orange bottom-border on navbar (2px solid `#FF520B`)

### Light content section
- White background
- Centred headings in `#222D57`, 44px
- Body text centred, max-width 60%

### Dark content section  
- Navy background (`#222D57`)
- White headings, 0.8 opacity body text

### Card patterns
- Rounded corners (10-20px)
- Soft shadow
- Navy bg cards with white text, or white bg with navy text
- Orange pill badges overlapping cards (negative margin technique)

### Footer
- Background `#333`
- 3-column layout
- 13px link text, `#CCC` body, `#FFF` links
- Orange social icons (`#FF520B`) in filled circles, 16px icon, 9px padding

---

## GRADIENT DEFINITIONS

```css
/* Green CTA gradient (WhatsApp-style) */
linear-gradient(13deg, #1EB236 0%, #49F877 100%)

/* Hero overlay gradient (transparent) */
linear-gradient(rgba(0,0,0,0) 0%, rgba(34,45,87,0) 100%)
```

Note: The old site used orange-to-warm-orange gradients. These were the drift in action. Use solid `#FF520B` for all orange surfaces. If a gradient is needed for depth, go `#FF520B` → slightly darker (e.g. `#E54A0A`), not towards amber.

---

## ICON STYLE

- Font Awesome 6 Free (weight 900 = solid)
- Glyphicons Halflings (legacy nav icons)
- Icon colour: `#FF520B`
- Icon colour on dark: `#FFFFFF`
- Icon wrapper for social: filled circle, `background-color: #FF520B`, 9px padding

---

## CSS CUSTOM PROPERTIES (useful ones)

```css
--op3-flex-column-gap: 20px;
--op3-flex-basis-steps: [1-5]; /* column count */
```

---

## QUICK REFERENCE FOR CLAUDE.MD

```
## Progressive Property Brand
fonts: Inter (all weights)
primary: #FF520B (orange) — ONE orange, everywhere
secondary: #222D57 (navy) — ONE navy, everywhere
accent: #FFA733 (amber, secondary plans only)
text: #484848 at 0.8 opacity
text-dark-bg: #FFFFFF at 0.8-0.9 opacity
radius-card: 10-20px
radius-button: 5-10px
radius-pill: 49px
shadow-card: 0 0 20px -4px rgba(0,0,0,0.27)
max-width: 1170px
```
