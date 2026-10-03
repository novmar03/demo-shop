export const publicId = 'pk_066676ef6f171ddb7da63bbcd591c';
const SDK_URL = 'https://widget.cloudpayments.ru/bundles/cloudpayments.js';
let loading;

export function paymentParameters(order) {
  if (!order.items.length || !Number.isFinite(order.totalAmount) || order.totalAmount <= 0) {
    throw new Error('Корзина пуста или сумма некорректна.');
  }
  return {
    publicTerminalId: publicId,
    description: 'Покупка в демо-магазине',
    amount: order.totalAmount,
    currency: 'RUB',
    culture: 'ru-RU',
    paymentSchema: 'Single',
    ...(order.orderId ? { externalId: order.orderId } : {}),
    items: order.items.map(item => ({ id: String(item.id), name: item.name, count: item.quantity, price: item.price })),
  };
}

export function loadPaymentWidget() {
  if (window.cp?.CloudPayments) return Promise.resolve(window.cp.CloudPayments);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    const fail = () => {
      clearTimeout(timer);
      script.remove();
      loading = undefined;
      reject(new Error('Не удалось загрузить форму оплаты. Проверьте соединение и попробуйте ещё раз.'));
    };
    const timer = setTimeout(fail, 20000);
    script.onerror = fail;
    script.onload = () => {
      if (!window.cp?.CloudPayments) return fail();
      clearTimeout(timer);
      resolve(window.cp.CloudPayments);
    };
    document.head.append(script);
  });
  return loading;
}

export async function openPayment(order) {
  const parameters = paymentParameters(order);
  const CloudPayments = await loadPaymentWidget();
  const widget = new CloudPayments();
  return widget.start(parameters);
}
