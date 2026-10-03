# Demo Store

A dependency-free storefront with eight products, a separate `/cart` page, quantity controls, removal, live totals, accessible empty state and localStorage persistence.

## Run

Requires Node.js 20 or newer.

```sh
npm start
```

Open http://localhost:3000. Run `npm test` for cart calculation and persistence tests. No package installation is needed.

## Architecture and next payment stage

- `src/products.js`: numeric RUB prices and local product illustrations.
- `src/cart.js`: pure cart mutations, validated storage and `orderSnapshot(cart, orderId)`.
- `src/app.js`: catalog/cart UI, browser history and checkout placeholder.

The snapshot contains `orderId` (currently null), `currency`, selected product data, quantities, subtotals, total item count and `totalAmount`. Pay emits a `demo-store:checkout` CustomEvent with that snapshot, then displays the requested placeholder message. It makes no payment/network calls. A future payment adapter can consume the snapshot; real totals/order IDs must then be validated and created on a backend.

Cart quantities are limited to 999 per product and never fall below one. Invalid stored data is discarded. If browser storage is blocked, the cart continues in memory with a notice.

## Design

Primary buttons adapted from the supplied [Figma UI library](https://www.figma.com/design/XbFxURJJQ1jlfXNPeBwHWe/Design-code?node-id=1-1019): Neu Classic M-48 default/hover (`1:1019`, `1:1024`), blue #2E71FC / #265DCE, 48px height, 8px radius, 14px text. Optional Figma button icons are disabled; the storefront uses its own cart icon. Stolzl is named in the font stack with system fallbacks because no licensed font file was supplied. Product images are original local SVG illustrations. The static promo uses CloudPayments brand text and a blue gradient. No reference homepage image was attached in this implementation request; layout follows the written specification.

Grid: four columns above 1000px, two through tablet widths, one at 600px and below. The cart summary stacks below items on smaller screens.

## Hosting

Published via GitHub Pages from the main branch at https://novmar03.github.io/demo-shop/.
The cart has a static entry at `cart/index.html`, so direct visits and refreshes work at `/demo-shop/cart/`. Asset and navigation paths resolve relative to the installation directory, supporting both GitHub Pages and a root deployment. `.nojekyll` disables unnecessary Jekyll processing.
