// Публичные настройки. API Secret хранится только в Yandex Lockbox.
export const paymentConfig = Object.freeze({
  publicId: "pk_de5c9efda336e5539a0631a5ccd27",
  checkoutApi: "https://d5d67uu5n2urvbv51580.d8epmcec.apigw.yandexcloud.net",
  widgetSkin: "classic",
  sdkTimeoutMs: 20000,
  paymentTimeoutMs: 25000,
});
