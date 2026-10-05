const homePath = new URL('../', import.meta.url).pathname;

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
    .payment-result-dialog{box-sizing:border-box;width:360px;max-width:calc(100vw - 32px);border:0;border-radius:22px;padding:66px 24px 56px;background:#fff;color:#202020;text-align:center;font-family:inherit;box-shadow:none}
    .payment-result-dialog::backdrop{background:rgba(49,65,99,.94)}
    .payment-result-close{position:absolute;right:18px;top:18px;width:28px;height:28px;border:0;background:transparent;color:#8992a1;cursor:pointer}
    .payment-result-close::before,.payment-result-close::after{content:'';position:absolute;left:13px;top:1px;width:2px;height:26px;background:currentColor;transform:rotate(45deg)}
    .payment-result-close::after{transform:rotate(-45deg)}
    .payment-result-close:focus-visible{outline:2px solid #2e71fc;outline-offset:4px;border-radius:4px}
    .payment-result-symbol{display:flex;align-items:center;justify-content:center;margin:0 auto 36px;width:222px;height:222px;max-width:100%;border-radius:50%;background:radial-gradient(circle,#f49a9b 22%,#f8c2c3 48%,#fff5f5 71%)}
    .payment-result-symbol span{box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:140px;height:140px;border:14px solid white;border-radius:50%;background:#ef5458;color:white;font-size:56px;font-weight:700;line-height:1}
    .payment-result-dialog h2{margin:0;font-size:26px;line-height:1.3;font-weight:700}
    .payment-result-dialog p{font-size:14px;line-height:1.5;margin:16px 0 0}
  `;
  document.head.append(style);
  const dialog = document.createElement('dialog');
  dialog.className = 'payment-result-dialog';
  dialog.setAttribute('aria-labelledby', 'payment-result-title');
  dialog.innerHTML = `<button type="button" class="payment-result-close" aria-label="Закрыть"></button><div class="payment-result-symbol" aria-hidden="true"><span>!</span></div><h2 id="payment-result-title">${result === 'failed' ? 'Оплата не прошла' : 'Результат не подтверждён'}</h2>${result === 'unknown' ? '<p>Проверьте операцию в CloudPayments перед повторной оплатой.</p>' : ''}`;
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.body.append(dialog);
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    dialog.remove(); style.remove();
    document.querySelector('.brand')?.focus();
  }, { once: true });
  dialog.showModal();
}
