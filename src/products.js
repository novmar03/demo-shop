const image = (name) =>
  new URL(`../public/products/merch/${name}.webp`, import.meta.url).pathname;

// Source product identifiers are intentionally different from the retired catalog.
// Synchronize backend/catalog.cjs with the Yandex function before accepting these IDs.
export const products = [
  {
    id: 1792768165569,
    name: "Кепка",
    price: 2100,
    image: image(1792768165569),
    hoverImage: image("1792768165569-hover"),
  },
  {
    id: 1792768141484,
    name: "Брелок «Акула бизнеса»",
    price: 900,
    image: image(1792768141484),
    hoverImage: image("1792768141484-hover"),
  },
  {
    id: 1792761969023,
    name: "Свеча «Гори огнем»",
    price: 1400,
    image: image(1792761969023),
    hoverImage: image("1792761969023-hover"),
  },
  {
    id: 1792768153866,
    name: "Новогодние носки",
    price: 490,
    image: image(1792768153866),
    hoverImage: image("1792768153866-hover"),
  },
  {
    id: 1792769376764,
    name: "Шопер «Красный конь»",
    price: 2300,
    image: image(1792769376764),
    hoverImage: image("1792769376764-hover"),
  },
  {
    id: 1792769442745,
    name: "Кружка «В стае»",
    price: 900,
    image: image(1792769442745),
    hoverImage: image("1792769442745-hover"),
  },
  {
    id: 1792769351863,
    name: "Стикер-пак",
    price: 700,
    image: image(1792769351863),
    hoverImage: image("1792769351863-hover"),
  },
  {
    id: 1792770120857,
    name: "Маска для сна",
    price: 4100,
    image: image(1792770120857),
    hoverImage: image("1792770120857-hover"),
  },
];
