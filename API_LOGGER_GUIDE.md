# 🔍 API Logger - Инструкция по использованию

## Что это?

API Logger - это утилита для отладки, которая перехватывает **все** `fetch` запросы в браузере и выводит подробную информацию о них в консоль.

## Как использовать

### 1. Откройте консоль браузера
- **Chrome/Edge**: `F12` или `Ctrl+Shift+J` (Win) / `Cmd+Option+J` (Mac)
- **Firefox**: `F12` или `Ctrl+Shift+K` (Win) / `Cmd+Option+K` (Mac)
- **Safari**: `Cmd+Option+C`

### 2. API Logger загружается автоматически
При загрузке любой страницы вы увидите:
```
[API-LOGGER] 🚀 Инициализирован
[API-LOGGER] ✅ Готов к работе! Все fetch запросы будут логироваться.
```

### 3. Все запросы автоматически логируются
Каждый запрос отображается в консоли в виде:

```
GET /api/wallet-transactions
  📤 URL: /api/wallet-transactions
  🔧 Method: POST
  📦 Body: { action: "get_wallet", user_id: "12345" }
  
200 /api/wallet-transactions 145ms
  ✅ Status: 200 OK
  ⏱️ Duration: 145ms
  📥 Response: { success: true, data: {...} }
```

## 📋 Доступные команды

Введите эти команды прямо в консоли браузера:

### `apiLogger.toggle()`
Включить/выключить логирование
```javascript
apiLogger.toggle()  // Выключить
apiLogger.toggle()  // Включить обратно
```

### `apiLogger.showHistory()`
Показать историю всех запросов
```javascript
apiLogger.showHistory()      // Последние 20 запросов
apiLogger.showHistory(50)    // Последние 50 запросов
apiLogger.showHistory(100)   // Последние 100 запросов
```

### `apiLogger.filterByUrl('pattern')`
Найти запросы по части URL
```javascript
apiLogger.filterByUrl('api')           // Все запросы к /api/
apiLogger.filterByUrl('wallet')        // Все запросы связанные с кошельком
apiLogger.filterByUrl('spice-multi')   // Все запросы через spice-multi-test
apiLogger.filterByUrl('networx')       // Все платежные запросы
```

### `apiLogger.showStats()`
Показать статистику запросов
```javascript
apiLogger.showStats()
// Выведет:
// - total: 45        (всего запросов)
// - success: 42      (успешных)
// - errors: 3        (с ошибками)
// - avgDuration: 123 (средняя длительность в ms)
```

### `apiLogger.clearHistory()`
Очистить историю запросов
```javascript
apiLogger.clearHistory()
```

## 🎯 Примеры использования

### Пример 1: Отладка проблем с кошельком
1. Откройте страницу `wallet.html`
2. Откройте консоль (`F12`)
3. Выполните действие (например, пополнение)
4. Посмотрите логи запросов
5. Если нужно, отфильтруйте:
```javascript
apiLogger.filterByUrl('wallet')
```

### Пример 2: Проверка платежей
```javascript
// Открыть страницу wallet.html
// Попытаться пополнить баланс
// Посмотреть какие запросы ушли:
apiLogger.filterByUrl('networx')
apiLogger.filterByUrl('payment')
```

### Пример 3: Отладка сообщений
```javascript
// Открыть messages.html
// Отправить сообщение
// Проверить запросы:
apiLogger.filterByUrl('messages')
apiLogger.showHistory(10)  // Последние 10 запросов
```

### Пример 4: Поиск медленных запросов
```javascript
// Поработать с приложением
// Посмотреть статистику:
apiLogger.showStats()

// Найти все запросы с конкретным endpoint:
apiLogger.filterByUrl('spice-multi-test')
```

## 🎨 Цветовая схема

В консоли используются цвета для быстрой идентификации:

- 🔵 **Синий** - метод запроса (GET, POST)
- 🟢 **Зеленый** - успешный ответ (200-299)
- 🔴 **Красный** - ошибка (400+, network error)
- ⚪ **Серый** - URL и дополнительная информация
- ⏱️ **Курсив** - время выполнения

## 🔧 Технические детали

### Что логируется

**Для каждого запроса:**
- ✅ Полный URL
- ✅ HTTP метод (GET, POST, PUT, DELETE)
- ✅ Headers (если есть)
- ✅ Body (если есть, парсится JSON)
- ✅ HTTP статус ответа
- ✅ Время выполнения (в миллисекундах)
- ✅ Данные ответа (если JSON)
- ✅ Ошибки (если произошли)

### Сохраняется в памяти
Все запросы сохраняются в `window.apiLogger.logs[]` и доступны через команды.

### Перехват fetch
API Logger **перехватывает** оригинальный `window.fetch` и добавляет логирование, но не изменяет поведение запросов.

## ⚠️ Важно

1. **Не отключайте на продакшене** - API Logger предназначен только для разработки
2. **Логи видны только вам** - они выводятся только в вашу консоль браузера
3. **Не влияет на производительность** (минимальное влияние ~1-2ms на запрос)
4. **Безопасно** - не изменяет данные запросов

## 🐛 Отладка конкретных проблем

### Проблема: "Не работает пополнение кошелька"
```javascript
// 1. Откройте wallet.html
// 2. Попробуйте пополнить
// 3. В консоли:
apiLogger.filterByUrl('wallet')
apiLogger.filterByUrl('networx')
// 4. Смотрите статусы и ошибки
```

### Проблема: "Не отправляются сообщения"
```javascript
// 1. Откройте messages.html
// 2. Попробуйте отправить сообщение
// 3. В консоли:
apiLogger.filterByUrl('messages')
// 4. Проверьте response
```

### Проблема: "Не загружаются профили в Tinder"
```javascript
// 1. Откройте discover.html
// 2. Свайпайте профили
// 3. В консоли:
apiLogger.filterByUrl('search')
apiLogger.filterByUrl('match')
// 4. Смотрите какие данные приходят
```

## 📊 Анализ производительности

Найти самые медленные запросы:
```javascript
// Показать историю
apiLogger.showHistory(50)

// Сортировать по duration в таблице
// Или отфильтровать по конкретному API:
apiLogger.filterByUrl('spice-multi')
```

## 🚀 Расширенное использование

### Экспорт логов
```javascript
// Сохранить все логи в переменную
const logs = window.apiLogger.logs

// Скопировать в буфер обмена
copy(JSON.stringify(logs, null, 2))

// Или сохранить в файл (в консоли)
console.save(logs, 'api-logs.json')
```

### Программный доступ
```javascript
// Получить последний запрос
const lastRequest = window.apiLogger.logs[window.apiLogger.logs.length - 1]

// Найти все ошибки
const errors = window.apiLogger.logs.filter(l => l.status >= 400 || l.status === 'ERROR')
console.table(errors)

// Посчитать запросы к конкретному endpoint
const walletRequests = window.apiLogger.logs.filter(l => l.url.includes('wallet'))
console.log('Wallet requests:', walletRequests.length)
```

## 📞 Поддержка

Если что-то не работает:
1. Проверьте что консоль открыта (`F12`)
2. Обновите страницу (`Ctrl+R` / `Cmd+R`)
3. Убедитесь что видите сообщение `[API-LOGGER] ✅ Готов к работе!`
4. Попробуйте `apiLogger.showHistory()` - должна быть таблица

---

**Создано:** 5 ноября 2025  
**Версия:** 1.0

