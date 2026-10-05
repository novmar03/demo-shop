import { publicId } from './payment.js';
import { money } from './ui.js';
import { returnHome } from './payment-result.js?v=20261005-1039';
let loading;
export const checkoutApi = 'https://d5dlit4s64dgke72o1ih.3rspsmhh.apigw.yandexcloud.net';
let paymentLocked = false;

export function redirectToBank(result, doc = document) {
  const url = new URL(result.acsUrl);
  if (url.protocol !== 'https:' || url.username || url.password ||
      !result.paReq || !/^\d+$/.test(String(result.transactionId)) ||
      result.termUrl !== `${checkoutApi}/post3ds`) throw new Error('Invalid 3DS response');
  const redirect = doc.createElement('form');
  redirect.method = 'POST';
  redirect.action = url.href;
  redirect.hidden = true;
  for (const [name, value] of Object.entries({ MD: result.transactionId, PaReq: result.paReq, TermUrl: result.termUrl })) {
    const input = doc.createElement('input');
    input.type = 'hidden'; input.name = name; input.value = String(value);
    redirect.append(input);
  }
  doc.body.append(redirect);
  redirect.submit();
}
export function checkoutForm(order) {
  return renderCheckoutForm(order)
    .replace('Демонстрация Checkout: проверка карты и создание криптограммы. Проведение платежа пока не подключено.', 'Данные карты защищены CloudPayments. Подтверждение оплаты может потребоваться на странице банка.')
    .replace('Проверить Checkout', 'Оплатить');
}
function renderCheckoutForm(order) {
  return `<form id="checkout-form" class="checkout-form" autocomplete="off"><h3>Оплата картой</h3><p class="checkout-note">Демонстрация Checkout: проверка карты и создание криптограммы. Проведение платежа пока не подключено.</p><label>Номер карты<input type="text" inputmode="numeric" data-cp="cardNumber" minlength="16" maxlength="23" pattern="[0-9 ]{16,23}" placeholder="0000 0000 0000 0000" required></label><div class="checkout-fields"><label>Месяц<input type="text" inputmode="numeric" data-cp="expDateMonth" maxlength="2" pattern="0[1-9]|1[0-2]" placeholder="ММ" required></label><label>Год<input type="text" inputmode="numeric" data-cp="expDateYear" minlength="2" maxlength="2" pattern="[0-9]{2}" placeholder="ГГ" required></label><label>CVV/CVC<input type="password" inputmode="numeric" data-cp="cvv" minlength="3" maxlength="4" pattern="[0-9]{3,4}" placeholder="•••" required></label></div><label>Имя владельца карты<input type="text" data-cp="name" maxlength="100" placeholder="Как на карте (необязательно)"></label><p>Сумма заказа: <strong>${money(order.totalAmount)}</strong></p><button class="button pay" type="submit">Проверить Checkout</button><p class="checkout-status" role="status" aria-live="polite"></p></form>`;
}
function loadCheckout() {
  if (window.cp?.Checkout) return Promise.resolve(window.cp.Checkout);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.cloudpayments.ru/checkout.js';
    script.async = true;
    const fail = () => { clearTimeout(timer); script.remove(); loading = undefined; reject(new Error('SDK unavailable')); };
    const timer = setTimeout(fail, 20000);
    script.onerror = fail;
    script.onload = () => { if (!window.cp?.Checkout) return fail(); clearTimeout(timer); resolve(window.cp.Checkout); };
    document.head.append(script);
  });
  return loading;
}
export function mountCheckout(form, order) {
  let disposed = false;
  let pending = false;
  const button = form.querySelector('button');
  const status = form.querySelector('.checkout-status');
  button.disabled = paymentLocked;
  const submit = async event => {
    event.preventDefault();
    if (pending || paymentLocked || disposed || !form.reportValidity()) return;
    pending = true;
    const button = form.querySelector('button');
    const status = form.querySelector('.checkout-status');
    button.disabled = true;
    status.textContent = 'Проверяем данные…';
    try {
      const Checkout = await loadCheckout();
      if (disposed) return;
      const checkout = new Checkout({ publicId, container: form });
      // Never log, persist, expose or reuse the cryptogram or card fields.
      let cryptogram = await checkout.createPaymentCryptogram();
      if (disposed) return;
      form.reset();
      if (!order?.items?.length || typeof cryptogram !== 'string' || !cryptogram) throw new Error('Invalid order');
      paymentLocked = true;
      status.textContent = 'Отправляем платёж…';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);
      let result;
      try {
        const reply = await fetch(`${checkoutApi}/payment`, {
          method: 'POST', credentials: 'omit', signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardCryptogramPacket: cryptogram,
            items: order.items.map(({ id, quantity }) => ({ id, quantity })) }),
        });
        cryptogram = null;
        if (!reply.ok) throw new Error('Payment status unknown');
        result = await reply.json();
      } finally { clearTimeout(timer); cryptogram = null; }
      if (result.success === false && result.status === 'declined') {
        paymentLocked = false;
        returnHome('failed');
      } else if (result.success === true && result.status === 'paid') {
        returnHome('success');
      } else if (result.success === true && result.status === 'requires3ds') {
        if (!disposed) status.textContent = 'Переходим на страницу банка для подтверждения…';
        redirectToBank(result);
      } else throw new Error('Unexpected payment response');
    } catch {
      if (paymentLocked) { returnHome('unknown'); return; }
      if (!disposed) status.textContent = paymentLocked
        ? 'Результат платежа не подтверждён. Не оплачивайте повторно: сначала проверьте операцию в CloudPayments.'
        : 'Не удалось подготовить платёж. Проверьте реквизиты карты и повторите попытку.';
    } finally {
      pending = false;
      if (!disposed) button.disabled = paymentLocked;
    }
  };
  form.addEventListener('submit', submit);
  return () => { disposed = true; form.reset(); form.removeEventListener('submit', submit); };
}
