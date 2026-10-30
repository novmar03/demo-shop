import { paymentConfig } from "./config.js";
import {
  paymentParameters,
  widgetPublicId,
} from "./payment.js?v=20261030-review";
let loading;
function loadBlocks() {
  if (window.cp?.PaymentBlocks) return Promise.resolve(window.cp.PaymentBlocks);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://widget.cloudpayments.ru/bundles/paymentblocks.js";
    script.async = true;
    const fail = () => {
      clearTimeout(timer);
      script.remove();
      loading = undefined;
      reject(new Error("Не удалось загрузить платёжные блоки."));
    };
    const timer = setTimeout(fail, paymentConfig.sdkTimeoutMs);
    script.onerror = fail;
    script.onload = () => {
      if (!window.cp?.PaymentBlocks) return fail();
      clearTimeout(timer);
      resolve(window.cp.PaymentBlocks);
    };
    document.head.append(script);
  });
  return loading;
}

// Each render owns its instance. Disposal also cancels an unfinished SDK load.
export function mountBlocks(container, order, onResult) {
  let disposed = false;
  let instance;
  loadBlocks()
    .then((PaymentBlocks) => {
      if (disposed || !container.isConnected) return;
      container.replaceChildren();
      instance = new PaymentBlocks(
        {
          ...paymentParameters(order),
          publicTerminalId: widgetPublicId,
          language: "ru-RU",
        },
        {
          appearance: {
            colors: {
              primaryButtonColor: "#2e71fc",
              primaryHoverButtonColor: "#265dce",
              primaryButtonTextColor: "#ffffff",
              primaryButtonHoverTextColor: "#ffffff",
              activeInputColor: "#2e71fc",
            },
            borders: { radius: "8px" },
          },
          components: { paymentButton: { text: "Оплатить" } },
        },
      );
      instance.mount(container);
      instance.on("success", (result) => {
        if (!disposed) onResult(order, { ...result, status: "success" });
      });
      instance.on("fail", (result) => {
        if (!disposed) onResult(order, { ...result, status: "fail" });
      });
    })
    .catch(() => {
      if (disposed || !container.isConnected) return;
      container.innerHTML =
        '<p role="status">Не удалось загрузить платёжные блоки. Проверьте соединение.</p><button type="button" class="button" data-retry-blocks>Попробовать снова</button>';
    });
  return () => {
    disposed = true;
    if (instance) {
      instance.off("success");
      instance.off("fail");
      instance.unmount();
    }
  };
}
