import {products} from './products.js';
import {STORAGE_KEY,loadCart,saveCart,updateCart,orderSnapshot} from './cart.js';
const basePath=new URL('../',import.meta.url).pathname;
const cartPath=basePath+'cart/';
document.querySelector('.brand').href=basePath;
document.querySelector('#cart-link').href=cartPath;
let storage;try{storage=window.localStorage;}catch{}
let cart=loadCart(storage),timer;
const money=n=>new Intl.NumberFormat('en-US').format(n)+' ₽';
const app=document.querySelector('#app');
const cartIcon='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 4h2l2 12h12l2-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>';
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>el.classList.remove('visible'),3500);}
function render(){
 const order=orderSnapshot(cart);document.querySelector('#cart-link').textContent=order.itemCount?'Cart · '+order.itemCount:'Cart';
 const isCart=location.pathname.replace(/\/$/,'')===cartPath.replace(/\/$/,'');document.title=isCart?'Cart · Demo Store':'Demo Store';
 if(!isCart){app.innerHTML=`<section class="promo"><div><p class="eyebrow">CLOUDPAYMENTS × DEMO STORE</p><h1>Good things.<br>Simple checkout.</h1><p>Your everyday favourites, all in one place.</p></div><div class="promo-art" aria-hidden="true"><span>cloudpayments</span><div class="demo-card">DEMO EXPERIENCE<strong>One cart.<br>Endless possibilities.</strong><small>Explore · Add · Enjoy</small></div></div></section><div class="section-heading"><h2>The everyday collection</h2><span>8 thoughtfully selected products</span></div><section class="catalog" aria-label="Product catalog">${products.map(p=>`<article class="product"><div class="product-image"><img src="${p.image}" alt="${p.name}"></div><div class="product-info"><h3>${p.name}</h3><div class="price-row"><strong>${money(p.price)}</strong><button class="button icon-button" data-action="add" data-id="${p.id}" aria-label="Add ${p.name} to cart">${cartIcon}</button></div></div></article>`).join('')}</section>`;return;}
 app.innerHTML=`<a class="back" href="${basePath}" data-nav>← Continue shopping</a><h1 class="cart-title">Cart <span>${order.itemCount}</span></h1>`+(order.items.length?`<div class="cart-layout"><section class="cart-items" aria-label="Selected products">${order.items.map(p=>`<article class="cart-row"><img src="${p.image}" alt="${p.name}"><div class="item-details"><h2>${p.name}</h2><p>${money(p.price)} / unit</p><button class="remove" data-action="remove" data-id="${p.id}" aria-label="Remove ${p.name}">Remove</button></div><div class="quantity" aria-label="Quantity for ${p.name}"><button data-action="subtract" data-id="${p.id}" aria-label="Decrease ${p.name} quantity" ${p.quantity===1?'disabled':''}>−</button><span>${p.quantity}</span><button data-action="add" data-id="${p.id}" aria-label="Increase ${p.name} quantity" ${p.quantity===999?'disabled':''}>+</button></div><strong class="subtotal">${money(p.subtotal)}</strong></article>`).join('')}</section><aside class="summary"><h2>Your order</h2><p class="summary-line"><span>Items</span><span>${order.itemCount}</span></p><div class="total"><span>Total</span><strong>${money(order.totalAmount)}</strong></div><button class="button pay" data-pay>Pay</button><p class="summary-note">Demo checkout · No real payment</p></aside></div>`:`<section class="empty"><span class="empty-icon" aria-hidden="true">${cartIcon}</span><h2>Your cart is empty</h2><p>Add products from the catalog</p><a href="${basePath}" data-nav class="button">Back to catalog</a></section>`);
}
document.addEventListener('click',event=>{
 const nav=event.target.closest('[data-nav]');if(nav&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&event.button===0){event.preventDefault();history.pushState({},'',nav.getAttribute('href'));render();window.scrollTo(0,0);return;}
 const action=event.target.closest('[data-action]');if(action){const id=Number(action.dataset.id),a=action.dataset.action;cart=updateCart(cart,id,a);const persisted=saveCart(storage,cart);render();const replacement=document.querySelector(`[data-action="${a}"][data-id="${id}"]`);(replacement||document.querySelector('.back'))?.focus();if(a==='add')toast('Product added to cart');if(!persisted)toast('Cart updated. Storage is unavailable; this cart will last for this session.');}
 if(event.target.closest('[data-pay]')){const order=orderSnapshot(cart);window.dispatchEvent(new CustomEvent('demo-store:checkout',{detail:order}));toast('Payment functionality will be implemented in the next stage.');}
});
window.addEventListener('popstate',render);
window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY||event.key===null){cart=loadCart(storage);render();}});
render();
