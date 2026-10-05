const homePath = new URL('../', import.meta.url).pathname;

const attemptKey = 'demo-checkout-attempt';
export function rememberPaymentAmount(amount) {
  try {
    if (Number.isFinite(amount) && amount > 0) window.sessionStorage.setItem(attemptKey, JSON.stringify({ amount, createdAt: Date.now() }));
  } catch {}
}
export function paymentAmount() {
  try {
    const attempt = JSON.parse(window.sessionStorage.getItem(attemptKey));
    return Number.isFinite(attempt?.amount) && attempt.amount > 0 && Date.now() - attempt.createdAt < 3600000 ? attempt.amount : null;
  } catch { return null; }
}
export function paymentHomeUrl(result) {
  return result === 'success' ? homePath : `${homePath}?payment=${result === 'failed' ? 'failed' : 'unknown'}`;
}

export function returnHome(result) {
  window.location.assign(paymentHomeUrl(result));
}

export function handlePaymentReturn() {
  const url = new URL(window.location.href);
  const result = url.searchParams.get('payment');
  if (!['success', 'failed', 'unknown'].includes(result)) return;
  // The query parameter controls presentation only; it is not proof of payment.
  if (url.pathname !== homePath) {
    window.location.replace(paymentHomeUrl(result));
    return;
  }
  url.searchParams.delete('payment');
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  if (result === 'success') return;
  const style = document.createElement('style');
  style.textContent = `
    .payment-result-dialog{box-sizing:border-box;width:540px;max-width:calc(100vw - 48px);border:0;border-radius:14px;padding:48px 48px 44px;background:#f7f9ff;color:#202020;text-align:center;font-family:inherit;box-shadow:none}
    .payment-result-dialog::backdrop{background:rgba(49,65,99,.94)}
    .payment-result-close{position:absolute;right:14px;top:14px;width:28px;height:28px;border:0;background:transparent;color:#8992a1;cursor:pointer}
    .payment-result-close::before,.payment-result-close::after{content:'';position:absolute;left:13px;top:1px;width:2px;height:26px;background:currentColor;transform:rotate(45deg)}
    .payment-result-close::after{transform:rotate(-45deg)}
    .payment-result-close:focus-visible{outline:2px solid #2e71fc;outline-offset:4px;border-radius:4px}
    .payment-result-symbol{display:flex;align-items:center;justify-content:center;margin:0 auto 36px;width:222px;height:222px;max-width:100%;border-radius:50%;background:radial-gradient(circle,#f49a9b 22%,#f8c2c3 48%,#fff5f5 71%)}
    .payment-result-symbol span{box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:140px;height:140px;border:14px solid white;border-radius:50%;background:#ef5458;color:white;font-size:56px;font-weight:700;line-height:1}
    .payment-result-dialog h2{margin:0;font-size:26px;line-height:1.3;font-weight:700}
    .payment-result-dialog p{font-size:16px;line-height:1.5;margin:14px 0 0;color:#919aad}
    .payment-result-dialog .payment-result-amount{font-size:30px;line-height:1.4;color:#222d41;margin:22px 0 30px}
    .payment-result-shop{width:100%;height:56px;font-size:17px;background:#2e71fc}
    .payment-result-shop:hover{background:#2560d4}
    @media(max-width:600px){.payment-result-dialog{padding:40px 24px 28px}.payment-result-symbol{width:180px;height:180px;margin-bottom:24px}.payment-result-dialog h2{font-size:22px}.payment-result-dialog .payment-result-amount{font-size:28px}}
  `;
  document.head.append(style);
  const dialog = document.createElement('dialog');
  dialog.className = 'payment-result-dialog';
  dialog.setAttribute('aria-labelledby', 'payment-result-title');
  const amount = paymentAmount();
  const formattedAmount = amount === null ? 'Сумма недоступна' : new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  dialog.innerHTML = `<button type="button" class="payment-result-close" aria-label="Вернуться на Checkout"></button><div class="payment-result-symbol" aria-hidden="true"><span>!</span></div><h2 id="payment-result-title">${result === 'failed' ? 'Не удалось оплатить' : 'Результат не подтверждён'}</h2><p>Оплата тестового заказа</p><p class="payment-result-amount">${formattedAmount}</p>${result === 'unknown' ? '<p>Проверьте операцию в CloudPayments перед повторной оплатой.</p>' : ''}<button type="button" class="button payment-result-shop">Вернуться в магазин</button>`;

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.body.append(dialog);
  let destination = homePath + 'checkout/';
  dialog.querySelector('.payment-result-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.payment-result-shop').addEventListener('click', () => { destination = homePath; dialog.close(); });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    dialog.remove(); style.remove();
    try { window.sessionStorage.removeItem(attemptKey); } catch {}
    window.location.assign(destination);
  }, { once: true });
  dialog.showModal();
}
