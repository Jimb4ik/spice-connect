# 🚀 Spice API - Quick Start Guide

> Краткая инструкция для программистов, работающих с Spice API

---

## ⚠️ САМОЕ ВАЖНОЕ: Необычная авторизация

Spice API НЕ использует стандартные методы авторизации!

### ❌ НЕ РАБОТАЕТ (не делай так):

```javascript
// Попытка 1 - Bearer token
fetch('https://dev2018.de5a7.com/index_api/search', {
    headers: {
        'Authorization': `Bearer ${API_KEY}`  // ❌
    }
});

// Попытка 2 - Basic Auth
fetch('https://dev2018.de5a7.com/index_api/search', {
    headers: {
        'Authorization': `Basic ${btoa(API_KEY)}`  // ❌
    }
});

// Попытка 3 - Custom header
fetch('https://dev2018.de5a7.com/index_api/search', {
    headers: {
        'X-API-Key': API_KEY  // ❌
    }
});

// Попытка 4 - В body
fetch('https://dev2018.de5a7.com/index_api/search', {
    method: 'POST',
    body: JSON.stringify({
        api_key: API_KEY,  // ❌
        filters: {...}
    })
});
```

### ✅ РАБОТАЕТ (делай так):

```javascript
// api_key передается в URL query параметрах
fetch(`https://dev2018.de5a7.com/index_api/search?api_key=${API_KEY}&session_id=${SESSION_ID}&page=0&pas=30`, {
    method: 'POST',
    headers: {
        'Accept': 'application/json'
    }
    // body пустое!
});
```

---

## 📝 4 Главных правила

### 1. api_key только в URL
```
https://dev2018.de5a7.com/endpoint?api_key=YOUR_KEY&param=value
                                    ^^^^^^^^^^^^^^^^
                                    Только здесь!
```

### 2. Метод POST, но параметры в URL
```javascript
// ВСЕ параметры в URL, тело пустое
const url = `${BASE_URL}/index_api/search?api_key=${KEY}&sex=2&age_from=25`;
fetch(url, { method: 'POST' });  // ← body пустое!
```

### 3. Заголовки минимальные
```javascript
headers: {
    'Accept': 'application/json'
    // Всё! Больше ничего не нужно
}
```

### 4. Исключение: загрузка файлов
```javascript
// Только для upload используется body
const formData = new FormData();
formData.append('file', photoFile);

fetch(`${BASE_URL}/index_api/user_edit_photos?api_key=${KEY}&session_id=${SID}`, {
    method: 'POST',
    body: formData  // ← здесь body нужен
});
```

---

## 🎯 Полный пример: Поиск пользователей

```javascript
// Конфигурация
const BASE_URL = 'https://dev2018.de5a7.com';
const API_KEY = 'your_api_key';
const SESSION_ID = 'user_session';

// Параметры поиска
const params = new URLSearchParams({
    api_key: API_KEY,        // Обязательно
    session_id: SESSION_ID,  // Обязательно
    page: 0,                 // Страница (0-based)
    pas: 30,                 // Результатов на страницу
    sex: 2,                  // 1=мужчина, 2=женщина, 3=пара
    age_from: 25,
    age_to: 35,
    is_online: 1,            // Только онлайн
    is_photo: 1,             // Только с фото
    get_picture_430: 1       // Высокое качество фото
});

// Запрос
const response = await fetch(
    `${BASE_URL}/index_api/search?${params.toString()}`,
    {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
    }
);

const data = await response.json();

// Обработка
if (data.connected === 1) {
    console.log(`Найдено: ${data.total} пользователей`);
    
    data.result.forEach(user => {
        console.log(`${user.pseudo}, ${user.age} лет`);
        
        // Получение фото
        if (user.photos_v2?.[0]) {
            const photo = user.photos_v2[0];
            console.log(`Фото: ${photo.sq_middle}`);
        }
    });
}
```

---

## 🛡️ Безопасность: НЕ передавай API_KEY на frontend!

### ❌ Опасно:
```javascript
// frontend.js
const API_KEY = 'my_secret_key';  // ← Все увидят в исходном коде!
fetch(`https://dev2018.de5a7.com/index_api/search?api_key=${API_KEY}`);
```

### ✅ Правильно: Используй серверный прокси

```javascript
// frontend.js - клиент
fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sex: 2, age_from: 25 })
});

// backend/api/search.js - сервер
export default async function handler(req, res) {
    const API_KEY = process.env.SPICE_API_KEY;  // ← Из переменных окружения
    const { sex, age_from } = req.body;
    
    const params = new URLSearchParams({
        api_key: API_KEY,  // ← Добавляем на сервере
        session_id: req.session.id,
        sex,
        age_from,
        page: 0,
        pas: 30
    });
    
    const response = await fetch(
        `https://dev2018.de5a7.com/index_api/search?${params.toString()}`,
        { method: 'POST', headers: { 'Accept': 'application/json' } }
    );
    
    const data = await response.json();
    res.json(data);
}
```

---

## 📋 Основные endpoints

| Endpoint | Метод | Описание | Обязательные параметры |
|----------|-------|----------|------------------------|
| `/index_api/search` | POST | Поиск пользователей | `api_key`, `session_id` |
| `/ajax_api/online` | GET | Онлайн пользователи | `api_key`, `session_id` |
| `/index_api/profile` | POST | Профиль пользователя | `api_key`, `session_id`, `id_membre` |
| `/index_api/landing_module/profils_global` | POST | Глобальные профили | `api_key`, `force_pays=64` |
| `/ajax_api/get_pubs` | POST | Получить сообщения | `api_key`, `session_id` |

**Все параметры в URL query string!**

---

## 🐛 Частые ошибки

### 1. Ошибка 401 Unauthorized
```
Причина: api_key не в URL или неверный
Решение: ?api_key=YOUR_KEY должен быть в URL
```

### 2. Пустой ответ {"connected": 0}
```
Причина: Невалидный session_id
Решение: Сначала выполни login и получи session_id
```

### 3. Параметры игнорируются
```
Причина: Параметры в body вместо URL
Решение: ВСЕ параметры должны быть в query string
```

---

## 💾 Тестирование через curl

```bash
# Базовый поиск
curl -X POST "https://dev2018.de5a7.com/index_api/search?api_key=YOUR_KEY&session_id=YOUR_SESSION&page=0&pas=10"

# С фильтрами
curl -X POST "https://dev2018.de5a7.com/index_api/search?api_key=YOUR_KEY&session_id=YOUR_SESSION&sex=2&age_from=25&age_to=35&is_photo=1&page=0&pas=30"

# Онлайн пользователи (GET)
curl "https://dev2018.de5a7.com/ajax_api/online?api_key=YOUR_KEY&session_id=YOUR_SESSION"

# Глобальные профили
curl -X POST "https://dev2018.de5a7.com/index_api/landing_module/profils_global?api_key=YOUR_KEY&force_pays=64"
```

---

## 📊 Структура успешного ответа

```json
{
    "connected": 1,
    "result": [
        {
            "id_membre": 12345,
            "pseudo": "Username",
            "age": 28,
            "sexe1": 2,
            "ville": "City",
            "is_online": 1,
            "photos_v2": [
                {
                    "sq_small": "https://...80x80.jpg",
                    "sq_middle": "https://...215x215.jpg",
                    "sq_430": "https://...430x430.jpg",
                    "normal": "https://...original.jpg"
                }
            ]
        }
    ],
    "total": 156,
    "nb_pages": 6,
    "page": 0
}
```

---

## 📚 Дополнительная документация

- **Swagger UI:** https://dev2018.de5a7.com/swagger-ui-master/dist/index_V2.html
- **JSON спецификация:** https://dev2018.de5a7.com/api/swagger_en_last_V2.json

---

## ✅ Чек-лист перед началом работы

- [ ] Получил API_KEY от администратора
- [ ] Настроил переменную окружения `SPICE_API_KEY`
- [ ] Понял что api_key идет в URL, а НЕ в заголовках
- [ ] Понял что параметры в URL, а НЕ в body
- [ ] Создал серверный прокси для безопасности
- [ ] Протестировал базовый запрос через curl
- [ ] Получил session_id через login

---

## 💡 Краткая памятка

```
┌─────────────────────────────────────────────────┐
│   Spice API - Главное что нужно запомнить       │
└─────────────────────────────────────────────────┘

1. api_key → В URL (?api_key=XXX)
2. Параметры → В URL (а не в body)
3. Метод → POST (но body пустое)
4. Headers → Минимальные (Accept: application/json)
5. Безопасность → Через серверный прокси
```

**Удачи! Если что-то не работает - проверь что api_key в URL, а не в заголовках!**


