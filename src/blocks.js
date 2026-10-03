import { paymentParameters } from './payment.js';
let loading;
function loadBlocks() {
  if (window.cp?.PaymentBlocks) return Promise.resolve(window.cp.PaymentBlocks);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://widget.cloudpayments.ru/bundles/paymentblocks.js';
    script.async = true;
    const fail = () => { clearTimeout(timer); script.remove(); loading = undefined; reject(new Error('Не удалось загрузить платёжные блоки.')); };
    const timer = setTimeout(fail, 20000);
    script.onerror = fail;
    script.onload = () => {
      if (!window.cp?.PaymentBlocks) return fail();
      clearTimeout(timer); resolve(window.cp.PaymentBlocks);
    };
    document.head.append(script);
  });
  return loading;
}

// Each render owns its instance. Disposal also cancels an unfinished SDK load.
export function mountBlocks(container, order, onResult) {
  let disposed = false;
  let instance;
  loadBlocks().then(PaymentBlocks => {
    if (disposed || !container.isConnected) return;
    container.replaceChildren();
    instance = new PaymentBlocks({ ...paymentParameters(order), language: 'ru-RU' }, {
      appearance: {
        colors: { primaryButtonColor: '#2e71fc', primaryHoverButtonColor: '#265dce', primaryButtonTextColor: '#ffffff', primaryButtonHoverTextColor: '#ffffff', activeInputColor: '#2e71fc' },
        borders: { radius: '8px' },
      },
      components: { paymentButton: { text: 'Оплатить' } },
    });
    instance.mount(container);
    instance.on('success', result => onResult(order, result));
    instance.on('fail', result => onResult(order, result));
  }).catch(() => {
    if (disposed || !container.isConnected) return;
    container.innerHTML = '<p role="status">Не удалось загрузить платёжные блоки. Проверьте соединение.</p><button type="button" class="button" data-retry-blocks>Попробовать снова</button>';
  });
  return () => {
    disposed = true;
    if (instance) { instance.off('success'); instance.off('fail'); instance.unmount(); }
  };
}
