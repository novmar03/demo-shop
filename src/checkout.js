import { publicId } from './payment.js';
import { money } from './ui.js';
let loading;
export function checkoutForm(order) {
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
export function mountCheckout(form) {
  let disposed = false;
  let pending = false;
  const submit = async event => {
    event.preventDefault();
    if (pending || disposed || !form.reportValidity()) return;
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
      await checkout.createPaymentCryptogram();
      if (disposed) return;
      form.reset();
      status.textContent = 'Криптограмма создана. Платёж не проводился: сервер оплаты ещё не подключён.';
    } catch {
      if (!disposed) status.textContent = 'Не удалось создать криптограмму. Проверьте реквизиты карты и соединение, затем повторите попытку.';
    } finally {
      pending = false;
      if (!disposed) button.disabled = false;
    }
  };
  form.addEventListener('submit', submit);
  return () => { disposed = true; form.reset(); form.removeEventListener('submit', submit); };
}
