import {products} from './products.js';
export const STORAGE_KEY='demo-store-cart-v1';
export function normalizeCart(value){
 if(!Array.isArray(value))return [];
 const quantities=new Map();
 for(const item of value){if(products.some(p=>p.id===item?.id)&&Number.isSafeInteger(item.quantity)&&item.quantity>0)quantities.set(item.id,Math.min(999,(quantities.get(item.id)||0)+item.quantity));}
 return [...quantities].map(([id,quantity])=>({id,quantity}));
}
export function updateCart(cart,id,action){
 const next=normalizeCart(cart);
 if(!products.some(p=>p.id===id))return next;
 const item=next.find(i=>i.id===id);
 if(action==='remove')return next.filter(i=>i.id!==id);
 if(action==='add'){if(item)item.quantity=Math.min(999,item.quantity+1);else next.push({id,quantity:1});}
 if(action==='subtract'&&item)item.quantity=Math.max(1,item.quantity-1);
 return next;
}
export function orderSnapshot(cart,orderId=null){
 const items=normalizeCart(cart).map(i=>({...products.find(p=>p.id===i.id),quantity:i.quantity,subtotal:products.find(p=>p.id===i.id).price*i.quantity}));
 return {orderId,currency:'RUB',items,itemCount:items.reduce((s,i)=>s+i.quantity,0),totalAmount:items.reduce((s,i)=>s+i.subtotal,0)};
}
export function loadCart(storage){try{return normalizeCart(JSON.parse(storage.getItem(STORAGE_KEY)));}catch{return [];}}
export function saveCart(storage,cart){try{storage.setItem(STORAGE_KEY,JSON.stringify(normalizeCart(cart)));return true;}catch{return false;}}
