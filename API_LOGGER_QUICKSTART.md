# 🔍 Quick Start - API Logger

## Открыть консоль браузера
- **Windows/Linux**: `F12` или `Ctrl+Shift+J`
- **Mac**: `Cmd+Option+J`

## Все запросы логируются автоматически! 

Вы увидите в консоли:
```
GET /api/wallet-transactions
✅ 200 OK (145ms)
📥 Response: { success: true, ... }
```

## Полезные команды в консоли:

```javascript
// Показать историю запросов
apiLogger.showHistory()

// Найти запросы по URL
apiLogger.filterByUrl('wallet')    // Все запросы к кошельку
apiLogger.filterByUrl('messages')  // Все запросы сообщений
apiLogger.filterByUrl('networx')   // Платежи

// Статистика
apiLogger.showStats()

// Включить/выключить
apiLogger.toggle()

// Очистить историю
apiLogger.clearHistory()
```

## Подключен на страницах:
✅ index.html (главная)
✅ main.html (дашборд)
✅ wallet.html
✅ messages.html
✅ discover.html
✅ matches.html
✅ gifts.html
✅ search.html
✅ profile.html
✅ settings.html

---

**Подробная инструкция:** [API_LOGGER_GUIDE.md](API_LOGGER_GUIDE.md)

