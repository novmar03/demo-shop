# Соответствие документации CloudPayments

Сверено 31.10.2026: https://developers.cloudpayments.ru/

## Виджет

Разделы «Установка виджета», «Параметры», «События (коллбэки)».
`src/payment.js`: `widget = new CloudPayments()` — конструктор cp.CloudPayments,
полученный после загрузки официального SDK. `widget.start(intentParams)` возвращает
WidgetResult. В app.js результат назван widgetResult; его type и status не переименованы.

`createIntentParams(order)` — наша функция преобразования корзины в параметры SDK,
не метод CloudPayments. Поля: publicTerminalId, paymentSchema, description, amount,
currency, culture, externalId (при наличии orderId), items. В items передаётся count,
а не внутреннее quantity. Для виджета дополнительно передаётся skin: classic.

## Платёжный конструктор

Разделы «Установка платежного конструктора», «Параметры инициализации»,
«Кастомизация платежного конструктора», «События (коллбэки)», «Отписка».
`src/blocks.js`: blocksApp, initializationParams, customizationParams,
mount, on('success'), on('fail'), off, unmount — нейминг документации.
Результат SDK передаётся без изменения status. Защита disposed относится
к жизненному циклу нашего сайта и предотвращает обработку запоздалых событий.

## Checkout

Раздел «Скрипт checkout», вариант с привязкой полей формы.
`src/checkout.js`: checkout = new Checkout({ publicId, container }),
checkout.createPaymentCryptogram(). Поля data-cp: cardNumber, expDateMonth,
expDateYear, cvv. publicId здесь корректен: заменять его на publicTerminalId нельзя.
Имя владельца не собирается. Криптограмма не логируется, даже если в примерах
документации используется console.log. SDK загружаются с официальных адресов.

## Граница с нашим backend

/payment и /post3ds — маршруты нашего Gateway, не endpoints API CloudPayments.
cardCryptogramPacket, items, success/status, acsUrl, paReq, transactionId, termUrl
в обмене с Gateway — существующий внутренний контракт. Он сохранён для совместимости.
В серверном API CP регистр другой: CardCryptogramPacket, Amount, Currency,
TransactionId, PaRes; ответы Success, Model, Model.AcsUrl, Model.PaReq.
Поля формы перехода к банку: MD, PaReq, TermUrl — уже соответствуют документации.
Для изменения внутреннего контракта необходим исходник облачной функции и
согласованное обновление обеих сторон. Серверное соответствие этим ревью не доказано.

Публичный ID не определяет тестовый режим. Финальный статус реального заказа
подтверждается сервером; клиентский callback или URL не заменяет такую проверку.
