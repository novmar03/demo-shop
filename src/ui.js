export const money = value => new Intl.NumberFormat('ru-RU', {
  style: 'currency', currency: 'RUB', maximumFractionDigits: 0
}).format(value);

export function productCount(count) {
  const mod100 = count % 100;
  const mod10 = count % 10;
  const word = mod100 >= 11 && mod100 <= 14 ? 'товаров' : mod10 === 1 ? 'товар' : mod10 >= 2 && mod10 <= 4 ? 'товара' : 'товаров';
  return `${count} ${word}`;
}

// Дополнительные 24px иконки магазина в стиле линейных иконок UI-библиотеки.
const paths = {
  cart: '<path d="M3 4h2l2 12h12l2-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  arrow: '<path d="m10 5-7 7 7 7M3 12h18"/>',
  trash: '<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>'
};
export function icon(name) {
  return `<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

export function productImage(product, className = '') {
  return `<div class="product-image ${className}"><div class="image-frame ${product.imagePart ? `image-part image-${product.imagePart}` : ''}"><img src="${product.image}" alt="${product.name}" loading="lazy" decoding="async"></div></div>`;
}

export function quantityControls(product, quantity, { allowRemove = false } = {}) {
  return `<div class="quantity" role="group" aria-label="Количество: ${product.name}">
    <button type="button" data-action="${allowRemove && quantity === 1 ? 'remove' : 'subtract'}" data-id="${product.id}" aria-label="${allowRemove && quantity === 1 ? 'Убрать из корзины' : 'Уменьшить количество'}: ${product.name}" ${!allowRemove && quantity === 1 ? 'disabled' : ''}>${icon('minus')}</button>
    <span class="quantity-value" aria-label="${quantity} шт.">${quantity}</span>
    <button type="button" data-action="add" data-id="${product.id}" aria-label="Добавить ещё: ${product.name}" ${quantity >= 999 ? 'disabled' : ''}>${icon('plus')}</button>
  </div>`;
}

export function productCard(product, quantity) {
  return `<article class="product" data-product-id="${product.id}">
    ${productImage(product)}
    <div class="product-info">
      <h3>${product.name}</h3>
      <p class="product-description">${product.description}</p>
      <div class="price-row"><strong>${money(product.price)}</strong></div>
      <div class="product-controls">
        ${quantity ? `<div class="in-cart"><span class="in-cart-label">В корзине: ${quantity} шт.</span>${quantityControls(product, quantity, { allowRemove: true })}</div>` : `<button type="button" class="button add-button" data-action="add" data-id="${product.id}" aria-label="В корзину: ${product.name}">${icon('cart')}<span>В корзину</span></button>`}
      </div>
    </div>
  </article>`;
}
