import { publicId } from './payment.js';
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
export function checkoutForm() {
  return `<form id="checkout-form" class="checkout-form" autocomplete="off" aria-label="Оплата картой">
    <input aria-label="Номер карты" type="text" inputmode="numeric" data-cp="cardNumber" maxlength="23" pattern="[0-9 ]{18,23}" placeholder="Номер карты" required>
    <div class="checkout-fields">
      <input aria-label="Месяц" type="text" inputmode="numeric" data-cp="expDateMonth" maxlength="2" pattern="0[1-9]|1[0-2]" placeholder="ММ" required><span aria-hidden="true">/</span>
      <input aria-label="Год" type="text" inputmode="numeric" data-cp="expDateYear" maxlength="2" pattern="[0-9]{2}" placeholder="ГГ" required>
      <div class="checkout-cvv"><input aria-label="CVV/CVC — 3 цифры" type="password" inputmode="numeric" data-cp="cvv" maxlength="3" pattern="[0-9]{3}" placeholder="CVC / CVV2" required><span aria-hidden="true">▰ <small>123</small></span></div>
    </div>
    <input aria-label="Имя владельца карты (необязательно)" type="text" data-cardholder maxlength="100" placeholder="Имя владельца (необязательно)">
    <div class="checkout-preview" aria-hidden="true"><div class="checkout-preview-number">**** &nbsp; **** &nbsp; **** &nbsp; <span data-preview-last>0000</span></div><strong data-preview-name>Имя владельца</strong><div class="checkout-preview-expiry">Действует до<br><span data-preview-expiry>ММ/ГГ</span></div></div>
    <button class="button pay" type="submit">Оплатить</button>
    <p class="checkout-status" role="status" aria-live="polite"></p>
    <p class="checkout-security">♙ &nbsp; Защищённое соединение</p><p class="checkout-powered">Secured by <strong>CloudPayments</strong></p>
  </form>`;
}
export function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
}
export function cardValues(form) {
  const read = key => form.querySelector('[data-cp="' + key + '"]').value.trim();
  const name = form.querySelector('[data-cardholder]').value.trim();
  return { cardNumber: read('cardNumber'), expDateMonth: read('expDateMonth'),
    expDateYear: read('expDateYear'), cvv: read('cvv'), ...(name ? { name } : {}) };
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
  const updateFields = event => {
    const field = event.target;
    const kind = field.dataset.cp;
    if (kind) {
      const digitsBefore = field.value.slice(0, field.selectionStart ?? field.value.length).replace(/\D/g, '').length;
      field.value = kind === 'cardNumber' ? formatCardNumber(field.value) : field.value.replace(/\D/g, '').slice(0, kind === 'cvv' ? 3 : 2);
      if (kind === 'cardNumber') {
        const position = Math.min(field.value.length, digitsBefore + Math.floor(Math.max(0, digitsBefore - 1) / 4));
        field.setSelectionRange(position, position);
      }
    }
    const values = cardValues(form);
    form.querySelector('[data-preview-last]').textContent = values.cardNumber.replace(/\D/g, '').slice(-4) || '0000';
    form.querySelector('[data-preview-name]').textContent = values.name || 'Имя владельца';
    form.querySelector('[data-preview-expiry]').textContent = (values.expDateMonth || 'ММ') + '/' + (values.expDateYear || 'ГГ');
  };
  form.addEventListener('input', updateFields);
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
      const checkout = new Checkout({ publicId });
      // Never log, persist, expose or reuse the cryptogram or card fields.
      let cryptogram = await checkout.createPaymentCryptogram(cardValues(form));
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
  return () => { disposed = true; form.reset(); form.removeEventListener('submit', submit); form.removeEventListener('input', updateFields); };
}
