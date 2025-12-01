# 📋 Spice API - Cheat Sheet

> Быстрая шпаргалка для копипаста

---

## ⚡ TL;DR - Самое главное

```javascript
// ✅ ТАК РАБОТАЕТ:
const url = `https://dev2018.de5a7.com/index_api/search?api_key=${API_KEY}&session_id=${SID}&page=0`;
fetch(url, { method: 'POST' });

// ❌ ТАК НЕ РАБОТАЕТ:
fetch(url, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }  // ← НЕТ!
});
```

**api_key только в URL query параметрах!**

---

## 🔑 Авторизация

```javascript
// ❌ НЕПРАВИЛЬНО
headers: {
    'Authorization': 'Bearer API_KEY'     // НЕТ
    'Authorization': 'Basic API_KEY'      // НЕТ
    'X-API-Key': 'API_KEY'                // НЕТ
}
body: JSON.stringify({ api_key: 'KEY' })  // НЕТ

// ✅ ПРАВИЛЬНО
const url = `${BASE_URL}/endpoint?api_key=${API_KEY}`;
```

---

## 🎯 Шаблон для копипаста

### Базовый запрос

```javascript
const BASE_URL = 'https://dev2018.de5a7.com';
const API_KEY = process.env.SPICE_API_KEY;

const params = new URLSearchParams({
    api_key: API_KEY,
    session_id: SESSION_ID,
    // ... другие параметры
});

const response = await fetch(`${BASE_URL}/endpoint?${params}`, {
    method: 'POST',
    headers: { 'Accept': 'application/json' }
});

const data = await response.json();
```

### Поиск пользователей

```javascript
const params = new URLSearchParams({
    api_key: API_KEY,
    session_id: SESSION_ID,
    page: 0,
    pas: 30,
    sex: 2,              // 1=муж, 2=жен, 3=пара
    age_from: 25,
    age_to: 35,
    is_online: 1,
    is_photo: 1,
    get_picture_430: 1
});

const response = await fetch(
    `https://dev2018.de5a7.com/index_api/search?${params}`,
    { method: 'POST', headers: { 'Accept': 'application/json' } }
);
```

### Серверный прокси (безопасно)

```javascript
// backend/api/search.js
export default async function handler(req, res) {
    const params = new URLSearchParams({
        api_key: process.env.SPICE_API_KEY,
        session_id: req.session.id,
        ...req.body
    });
    
    const response = await fetch(
        `https://dev2018.de5a7.com/index_api/search?${params}`,
        { method: 'POST' }
    );
    
    res.json(await response.json());
}
```

---

## 📋 Популярные endpoints

```javascript
// Поиск пользователей
POST /index_api/search?api_key=KEY&session_id=SID&page=0&pas=30

// Онлайн пользователи
GET /ajax_api/online?api_key=KEY&session_id=SID

// Профиль пользователя
POST /index_api/profile?api_key=KEY&session_id=SID&id_membre=12345

// Глобальные профили (без session_id)
POST /index_api/landing_module/profils_global?api_key=KEY&force_pays=64

// Сообщения
POST /ajax_api/get_pubs?api_key=KEY&session_id=SID

// Топ пользователи
POST /index_api/topmembers?api_key=KEY&session_id=SID&sex=2
```

---

## 🧪 curl команды для тестов

```bash
# Поиск
curl -X POST "https://dev2018.de5a7.com/index_api/search?api_key=KEY&session_id=SID&page=0&pas=10"

# Онлайн
curl "https://dev2018.de5a7.com/ajax_api/online?api_key=KEY&session_id=SID"

# Глобальные профили
curl -X POST "https://dev2018.de5a7.com/index_api/landing_module/profils_global?api_key=KEY&force_pays=64"

# С фильтрами
curl -X POST "https://dev2018.de5a7.com/index_api/search?api_key=KEY&session_id=SID&sex=2&age_from=25&age_to=35&is_photo=1"
```

---

## 🔧 Параметры поиска

| Параметр | Значения | Описание |
|----------|----------|----------|
| `api_key` | string | API ключ (обязательно) |
| `session_id` | string | ID сессии (обязательно) |
| `page` | 0, 1, 2... | Номер страницы (0-based) |
| `pas` | 10, 20, 30 | Результатов на страницу |
| `sex` | 1, 2, 3 | 1=мужчина, 2=женщина, 3=пара |
| `age_from` | 18-99 | Минимальный возраст |
| `age_to` | 18-99 | Максимальный возраст |
| `is_online` | 0, 1 | Только онлайн |
| `is_photo` | 0, 1 | Только с фото |
| `get_picture_430` | 0, 1 | Высокое качество фото |
| `nick` | string | Поиск по username |
| `id_ville` | number | ID города |

---

## 📊 Структура ответа

```javascript
{
    connected: 1,              // 1 = успех, 0 = ошибка
    result: [                  // Массив пользователей
        {
            id_membre: 12345,
            pseudo: "Username",
            age: 28,
            sexe1: 2,
            ville: "City",
            is_online: 1,
            photos_v2: [       // Массив фото (если get_picture_430=1)
                {
                    sq_small: "...80x80.jpg",
                    sq_middle: "...215x215.jpg",
                    sq_430: "...430x430.jpg",
                    normal: "...original.jpg"
                }
            ]
        }
    ],
    total: 156,                // Всего результатов
    nb_pages: 6,               // Всего страниц
    page: 0                    // Текущая страница
}
```

---

## 🐛 Диагностика ошибок

```javascript
// Проверка 1: api_key в URL?
console.log(url.includes('api_key='));  // должно быть true

// Проверка 2: session_id в URL?
console.log(url.includes('session_id='));  // должно быть true

// Проверка 3: Нет Authorization заголовка?
console.log(headers.Authorization);  // должно быть undefined

// Проверка 4: Ответ валидный?
console.log(data.connected === 1);  // должно быть true
```

---

## ⚠️ Частые ошибки

| Ошибка | Причина | Решение |
|--------|---------|---------|
| 401 Unauthorized | api_key не в URL | Добавь `?api_key=KEY` |
| `{connected: 0}` | Неверный session_id | Сначала сделай login |
| Параметры игнорируются | Параметры в body | Параметры в URL! |
| Фото не загружаются | Нет `get_picture_430` | Добавь `&get_picture_430=1` |

---

## 🔒 Environment Variables

```bash
# .env
SPICE_API_KEY=your_secret_api_key_here
SPICE_BASE_URL=https://dev2018.de5a7.com
```

```javascript
// Использование
const API_KEY = process.env.SPICE_API_KEY;
const BASE_URL = process.env.SPICE_BASE_URL || 'https://dev2018.de5a7.com';
```

---

## 📦 Полный пример класса

```javascript
class SpiceAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://dev2018.de5a7.com';
    }

    async request(endpoint, params = {}) {
        const allParams = new URLSearchParams({
            api_key: this.apiKey,
            ...params
        });

        const response = await fetch(
            `${this.baseUrl}${endpoint}?${allParams}`,
            {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
            }
        );

        return await response.json();
    }

    async search(sessionId, filters = {}) {
        return this.request('/index_api/search', {
            session_id: sessionId,
            page: 0,
            pas: 30,
            ...filters
        });
    }

    async getOnline(sessionId) {
        return this.request('/ajax_api/online', {
            session_id: sessionId
        });
    }

    async getProfile(sessionId, userId) {
        return this.request('/index_api/profile', {
            session_id: sessionId,
            id_membre: userId
        });
    }
}

// Использование
const api = new SpiceAPI(process.env.SPICE_API_KEY);
const users = await api.search(sessionId, {
    sex: 2,
    age_from: 25,
    age_to: 35,
    is_online: 1
});
```

---

## 🎓 Ключевые выводы

1. ✅ **api_key в URL** - не в заголовках!
2. ✅ **Параметры в URL** - не в body!
3. ✅ **Метод POST** - но body пустое (кроме upload файлов)
4. ✅ **session_id обязателен** - для большинства endpoints
5. ✅ **Используй прокси** - не передавай api_key на frontend

---

## 📚 Ссылки

- Swagger: https://dev2018.de5a7.com/swagger-ui-master/dist/index_V2.html
- JSON спецификация: https://dev2018.de5a7.com/api/swagger_en_last_V2.json
- Полная документация: `API_ENDPOINTS_ANALYSIS.md`
- Quick Start: `SPICE_API_GUIDE.md`


