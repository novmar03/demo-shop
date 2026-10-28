# Landing design

Reference: https://easy.cloudpayments.ru/, inspected 2026-10-28.

The landing uses locally stored original artwork and Stolzl Book / Regular /
Medium fonts. `src/landing.js` renders semantic sections; `src/landing.css`
scopes the new visual design to `.is-landing`, leaving payment form layouts intact.
No Tilda checkout, analytics, or external rendering runtime is included.

Measured desktop geometry:

| Element | Size / spacing |
| --- | --- |
| Content | 1160 px, centered |
| Fixed header | 65 px; logo 210 px |
| Hero | 1160 × 500 px, radius 20 px, starts at y=105 |
| Hero heading | 42 / 46 px, medium |
| Phone illustration | 388 × 484 px |
| Benefits | four columns, ~275 × 250 px, gap 20 px |
| Hero to benefits | 30 px |
| Catalog background | #f0f2f5 |
| Product cards | four columns, 275 px, radius 16 px, image ratio 100:133 |
| About banner | 1160 × 318 px, #0b1e46 |
| About heading | 34 / 37 px |
| CTA | 190 × 48 px, radius 8 px |
| Footer | logo 174 px, copyright opposite |

Breakpoints: 1200, 960, 640, 480 px. Smaller layouts stack the phone below
the hero text, reduce typography, switch catalog columns and provide a menu button.
Animations use 1-second zoom/fade and 100-pixel rise, chained product entry,
typing/deleting the original three words, and button hover transitions.
`prefers-reduced-motion` disables movement and typing.

The catalog now uses the eight merchandise products and source IDs from Easy,
including original alternate photographs for hover. Cart storage uses a new key,
so retired product IDs are never reinterpreted as merchandise. The floating cart
is mounted directly in `body`: the header's backdrop-filter otherwise makes it
relative to the header instead of the viewport.

The Yandex Checkout function must use `backend/catalog.cjs` to resolve the new
IDs and prices. The frontend sends IDs and quantities, never an authoritative
client price. See `backend/README.md` for the server catalog update.

Run `npm test` for payment, cart, return handling, asset and GitHub Pages path checks.
