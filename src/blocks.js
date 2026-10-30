import { paymentConfig } from "./config.js";
import {
  createIntentParams,
} from "./payment.js?v=20261031-cp-docs";
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

// Each render owns its blocksApp. Disposal also cancels an unfinished SDK load.
export function mountBlocks(container, order, onResult) {
  let disposed = false;
  let blocksApp;
  loadBlocks()
    .then((PaymentBlocks) => {
      if (disposed || !container.isConnected) return;
      container.replaceChildren();
      const initializationParams = {
        ...createIntentParams(order),
        language: "ru-RU",
      };
      const customizationParams = {
        appearance: {
          colors: {
            primaryButtonColor: "#2e71fc",
            primaryHoverButtonColor: "#2560d4",
            primaryButtonTextColor: "#ffffff",
            primaryButtonHoverTextColor: "#ffffff",
          },
          borders: { radius: "8px" },
        },
        components: { paymentButton: { text: "Оплатить" } },
      };
      blocksApp = new PaymentBlocks(initializationParams, customizationParams);
      blocksApp.mount(container);
      blocksApp.on("success", (result) => {
        if (!disposed) onResult(order, result);
      });
      blocksApp.on("fail", (result) => {
        if (!disposed) onResult(order, result);
      });
    })
    .catch(() => {
      if (disposed || !container.isConnected) return;
      container.innerHTML =
        '<p role="status">Не удалось загрузить платёжные блоки. Проверьте соединение.</p><button type="button" class="button" data-retry-blocks>Попробовать снова</button>';
    });
  return () => {
    disposed = true;
    if (blocksApp) {
      blocksApp.off("success");
      blocksApp.off("fail");
      blocksApp.unmount();
    }
  };
}
