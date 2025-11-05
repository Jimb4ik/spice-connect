# 📡 Анализ API запросов сайта Lavrilo

## 🔑 Базовая информация

**Base URL:** `https://dev2018.de5a7.com` (по умолчанию)  
**Откуда берется Base URL:** `process.env.SPICE_BASE_URL || 'https://dev2018.de5a7.com'`  
**Метод авторизации:** `api_key` в query параметрах URL  
**Формат:** `?api_key=${API_KEY}&session_id=${SESSION_ID}`

### Environment Variables в Vercel:
- `SPICE_API_KEY` - API ключ (обязательно) ✅
- `SPICE_BASE_URL` - Base URL API (опционально, есть fallback) ⚙️

---

## 🚀 QUICK START GUIDE ДЛЯ РАЗРАБОТЧИКОВ

> **Инструкция для программистов, работающих с Spice API**

### ⚠️ КРИТИЧЕСКИ ВАЖНО: Метод авторизации

Spice API использует **нестандартный** метод авторизации:

```javascript
// ❌ НЕ РАБОТАЕТ - не делай так:
fetch('https://dev2018.de5a7.com/index_api/search', {
    headers: {
        'Authorization': `Bearer ${API_KEY}`,  // ❌ НЕПРАВИЛЬНО
        'X-API-Key': API_KEY                   // ❌ НЕПРАВИЛЬНО
    },
    body: JSON.stringify({ filters })          // ❌ НЕПРАВИЛЬНО
});

// ✅ РАБОТАЕТ - делай так:
fetch(`https://dev2018.de5a7.com/index_api/search?api_key=${API_KEY}&session_id=${SESSION_ID}&page=0&pas=30`, {
    method: 'POST',
    headers: {
        'Accept': 'application/json'
        // БЕЗ Authorization!
    }
    // БЕЗ body (для большинства endpoints)!
});
```

### 📝 Главные правила работы с Spice API:

1. **api_key передается ТОЛЬКО через URL query параметры**
   ```
   ?api_key=YOUR_KEY
   ```

2. **Метод POST, но параметры в URL, а не в body**
   ```javascript
   // Все фильтры и параметры - в URL
   const url = `${BASE_URL}/index_api/search?api_key=${KEY}&session_id=${SID}&sex=2&age_from=18&age_to=35`;
   fetch(url, { method: 'POST' }); // body пустое!
   ```

3. **Content-Type для обычных запросов**
   ```javascript
   headers: {
       'Accept': 'application/json'
       // НЕ используй Authorization заголовки!
   }
   ```

4. **Исключение: загрузка файлов**
   ```javascript
   // Только для upload фото используется body с multipart/form-data
   const formData = new FormData();
   formData.append('file', photoFile);
   
   fetch(`${BASE_URL}/index_api/user_edit_photos?api_key=${KEY}&session_id=${SID}`, {
       method: 'POST',
       body: formData  // ← здесь body нужен
   });
   ```

---

### 🎯 Пример: Поиск пользователей (Search API)

```javascript
// Настройки
const BASE_URL = 'https://dev2018.de5a7.com';
const API_KEY = 'your_api_key_here';
const SESSION_ID = 'user_session_id';

// Шаг 1: Формируем параметры поиска
const searchParams = {
    api_key: API_KEY,           // ← ОБЯЗАТЕЛЬНО
    session_id: SESSION_ID,      // ← ОБЯЗАТЕЛЬНО
    page: 0,                     // Страница (0-based)
    pas: 30,                     // Результатов на страницу
    sex: 2,                      // 1=мужчина, 2=женщина, 3=пара
    age_from: 25,                // Мин возраст
    age_to: 35,                  // Макс возраст
    is_online: 1,                // Только онлайн
    is_photo: 1,                 // Только с фото
    get_picture_430: 1           // Получить photos_v2 (высокое качество)
};

// Шаг 2: Формируем URL со ВСЕМИ параметрами
const queryString = new URLSearchParams(searchParams).toString();
const url = `${BASE_URL}/index_api/search?${queryString}`;

// Шаг 3: Отправляем запрос
const response = await fetch(url, {
    method: 'POST',
    headers: {
        'Accept': 'application/json'
    }
    // Тело пустое!
});

const data = await response.json();

// Шаг 4: Обработка ответа
if (data.connected === 1) {
    console.log(`Найдено: ${data.total} пользователей`);
    console.log(`Страниц: ${data.nb_pages}`);
    
    data.result.forEach(user => {
        console.log(`${user.pseudo}, ${user.age} лет`);
        
        // Получение фото
        if (user.photos_v2 && user.photos_v2.length > 0) {
            const photo = user.photos_v2[0];
            console.log(`Фото: ${photo.sq_middle}`); // 215x215
        }
    });
}
```

---

### 🔧 Структура успешного ответа

```json
{
    "connected": 1,
    "result": [
        {
            "id_membre": 12345,
            "pseudo": "Marie",
            "age": 28,
            "sexe1": 2,
            "ville": "Paris",
            "is_online": 1,
            "photos_v2": [
                {
                    "sq_small": "https://...photo_80x80.jpg",
                    "sq_middle": "https://...photo_215x215.jpg",
                    "sq_430": "https://...photo_430x430.jpg",
                    "normal": "https://...photo_original.jpg"
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

### 🛡️ Безопасность: Использование прокси

**ВАЖНО:** НЕ передавай API_KEY на frontend!

```javascript
// ❌ ОПАСНО - api_key на клиенте:
// frontend.js
const API_KEY = 'my_secret_key'; // ← ЛЮБОЙ увидит в коде!
fetch(`https://dev2018.de5a7.com/index_api/search?api_key=${API_KEY}`);

// ✅ БЕЗОПАСНО - используй серверный прокси:
// frontend.js
fetch('/api/search-proxy', {  // ← обращение к СВОЕМУ серверу
    method: 'POST',
    body: JSON.stringify({ sex: 2, age_from: 25 })
});

// backend/api/search-proxy.js
export default async function handler(req, res) {
    const API_KEY = process.env.SPICE_API_KEY; // ← из env переменных
    
    const params = new URLSearchParams({
        api_key: API_KEY,  // ← добавляем на сервере
        ...req.body
    });
    
    const response = await fetch(
        `https://dev2018.de5a7.com/index_api/search?${params.toString()}`,
        { method: 'POST' }
    );
    
    const data = await response.json();
    res.json(data);
}
```

---

### 📋 Основные endpoints для быстрого старта

| Endpoint | Метод | Что делает | Обязательные параметры |
|----------|-------|------------|------------------------|
| `/index_api/search` | POST | Поиск пользователей | `api_key`, `session_id` |
| `/ajax_api/online` | GET | Онлайн пользователи | `api_key`, `session_id` |
| `/index_api/profile` | POST | Профиль пользователя | `api_key`, `session_id`, `id_membre` |
| `/index_api/landing_module/profils_global` | POST | Глобальные профили | `api_key`, `force_pays=64` |
| `/ajax_api/get_pubs` | POST | Получить сообщения | `api_key`, `session_id` |

**Все параметры передаются в URL query string!**

---

### 🐛 Частые ошибки и их решение

#### 1. Ошибка 401 Unauthorized
```
Причина: api_key не передан или неверный
Решение: Проверь что api_key есть в URL query параметрах:
         ?api_key=YOUR_KEY
```

#### 2. Пустой ответ или {"connected": 0}
```
Причина: session_id невалидный или пользователь не авторизован
Решение: Сначала выполни login через /api/auth и получи session_id
```

#### 3. Параметры игнорируются
```
Причина: Параметры переданы в body вместо URL
Решение: ВСЕ параметры должны быть в query string URL
```

---

### 💾 Тестовый запрос через curl

```bash
# Базовый поиск
curl -X POST "https://dev2018.de5a7.com/index_api/search?api_key=YOUR_KEY&session_id=YOUR_SESSION&page=0&pas=10"

# С фильтрами
curl -X POST "https://dev2018.de5a7.com/index_api/search?api_key=YOUR_KEY&session_id=YOUR_SESSION&sex=2&age_from=25&age_to=35&is_photo=1&page=0&pas=30"

# Онлайн пользователи
curl "https://dev2018.de5a7.com/ajax_api/online?api_key=YOUR_KEY&session_id=YOUR_SESSION"
```

---

### 📚 Дополнительная документация

- **Swagger UI:** https://dev2018.de5a7.com/swagger-ui-master/dist/index_V2.html
- **JSON спецификация:** https://dev2018.de5a7.com/api/swagger_en_last_V2.json
- **Подробная документация:** Смотри разделы ниже в этом файле

---

## 📋 ОГЛАВЛЕНИЕ

1. [Авторизация и регистрация](#1-авторизация-и-регистрация)
2. [Профиль пользователя](#2-профиль-пользователя)
3. [Поиск и Discovery](#3-поиск-и-discovery)
4. [Матчинг (Tinder-подобная система)](#4-матчинг-tinder-подобная-система)
5. [Сообщения](#5-сообщения)
6. [Контакты и друзья](#6-контакты-и-друзья)
7. [Подарки](#7-подарки)
8. [Кошелек и транзакции](#8-кошелек-и-транзакции)
9. [Платежи (Networx Payment Gateway)](#9-платежи-networx-payment-gateway)
10. [Активность и статистика](#10-активность-и-статистика)
11. [Дополнительные endpoint'ы](#11-дополнительные-endpoints)

---

## 1. Авторизация и регистрация

### 🔐 POST `/api/auth` - Вход в систему
**Файл:** `api/auth.js`  
**Функционал:** Авторизация пользователя

**Request Body:**
```json
{
  "action": "login",
  "login": "username",
  "pass": "password",
  "rememberme": "1"
}
```

**Куда идет запрос:**
- Внутренний endpoint Vercel

**Response:**
```json
{
  "success": true,
  "connected": 1,
  "user_id": "12345",
  "session_id": "abc123xyz",
  "token_login": "token_xyz",
  "lang_ui": "en"
}
```

**Используется в:**
- `js/auth-manager.js` → метод `login()`
- Страница авторизации

---

### 📝 POST `/api/auth` - Регистрация
**Файл:** `api/auth.js`  
**Функционал:** Создание нового аккаунта

**Request Body:**
```json
{
  "action": "register",
  "login": "username",
  "pass": "password",
  "mail": "email@example.com",
  "sex": "1",
  "cherche1": "2",
  "year": "1995",
  "month": "5",
  "day": "15",
  "ip_adress": "192.168.1.1",
  "city": "1",
  "region": "1",
  "countryObj": "64"
}
```

**Используется в:**
- `js/auth-manager.js` → метод `register()`
- Форма регистрации

---

### 🚪 POST `/api/auth` - Выход
**Файл:** `api/auth.js`  
**Функционал:** Завершение сессии

**Request Body:**
```json
{
  "action": "logout",
  "session_id": "abc123xyz"
}
```

**Используется в:**
- `js/auth-manager.js` → метод `logout()`

---

## 2. Профиль пользователя

### 👤 POST `/api/user-profile` - Получение профиля
**Файл:** `api/user-profile.js`  
**Функционал:** Загрузка данных профиля пользователя

**Request Body:**
```json
{
  "session_id": "abc123xyz",
  "id": "12345"
}
```

**Куда идет запрос:**
- Внутренний API Vercel (PostgreSQL Neon)

**Response:**
```json
{
  "success": true,
  "result": {
    "id": "12345",
    "pseudo": "username",
    "email": "user@example.com",
    "age": "28",
    "city": "Paris",
    "photos": [...]
  }
}
```

**Используется в:**
- `js/auth-manager.js` → метод `getCurrentUserEmail()`
- `js/user-profile.js` → загрузка профиля

---

### 📸 POST `/index_api/user_edit_photos` - Фотографии пользователя
**Через:** `/api/spice-multi-test`  
**Функционал:** Получение списка фотографий текущего пользователя

**Query params:**
```
endpoint=/index_api/user_edit_photos
method=POST
session_id=abc123xyz
```

**Куда идет запрос:**
- `https://dev2018.de5a7.com/index_api/user_edit_photos?api_key=${API_KEY}&session_id=${SESSION_ID}`

**Используется в:**
- `js/main.js` → метод `loadPhotoVotes()`

---

## 3. Поиск и Discovery

### 🔍 POST `/index_api/search` - Поиск пользователей
**Через:** `/api/spice-multi-test`  
**Функционал:** Поиск пользователей с фильтрами и пагинацией

---

## 📖 ДЕТАЛЬНОЕ ОПИСАНИЕ РАБОТЫ SEARCH API

### 🎯 Визуальная схема потока данных

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ПОЛНЫЙ ПОТОК SEARCH ЗАПРОСА                           │
└─────────────────────────────────────────────────────────────────────────────┘

 FRONTEND (Browser)                VERCEL (Serverless)              SPICE API
┌──────────────────┐             ┌────────────────────┐         ┌─────────────┐
│  search-page.js  │             │ spice-multi-test.js│         │ Spice Server│
└────────┬─────────┘             └─────────┬──────────┘         └──────┬──────┘
         │                                  │                           │
         │ 1. Формирует параметры поиска   │                           │
         │    {nick, age_from, sex, ...}   │                           │
         │                                  │                           │
         │ 2. POST /api/spice-multi-test   │                           │
         │    ?endpoint=/index_api/search  │                           │
         │    &session_id=abc123           │                           │
         │    &page=1&pas=30&sex=2         │                           │
         ├────────────────────────────────>│                           │
         │                                  │                           │
         │   Headers:                       │                           │
         │   Content-Type: application/json│                           │
         │                                  │                           │
         │                                  │ 3. Извлекает параметры    │
         │                                  │    из query string        │
         │                                  │                           │
         │                                  │ 4. Добавляет api_key      │
         │                                  │    в query параметры      │
         │                                  │                           │
         │                                  │ 5. POST к Spice API       │
         │                                  │    URL: /index_api/search │
         │                                  │    ?api_key=XXX           │
         │                                  │    &session_id=abc123     │
         │                                  │    &page=1&pas=30&sex=2   │
         │                                  ├──────────────────────────>│
         │                                  │                           │
         │                                  │   Headers:                │
         │                                  │   Accept: application/json│
         │                                  │   ❌ БЕЗ Authorization!   │
         │                                  │                           │
         │                                  │                           │ 6. Обрабатывает
         │                                  │                           │    запрос
         │                                  │                           │
         │                                  │ 7. JSON Response          │
         │                                  │<──────────────────────────┤
         │                                  │    {                      │
         │                                  │      "connected": 1,      │
         │                                  │      "result": [...],     │
         │                                  │      "total": 156,        │
         │                                  │      "nb_pages": 6        │
         │                                  │    }                      │
         │                                  │                           │
         │ 8. Wrapped Response              │                           │
         │<─────────────────────────────────┤                           │
         │    {                             │                           │
         │      "success": true,            │                           │
         │      "data": {                   │                           │
         │        "connected": 1,           │                           │
         │        "result": [...]           │                           │
         │      }                           │                           │
         │    }                             │                           │
         │                                  │                           │
         │ 9. Отображает результаты         │                           │
         │    - Создает карточки            │                           │
         │    - Показывает пагинацию        │                           │
         │                                  │                           │
         ▼                                  ▼                           ▼
```

### 🔑 Ключевые особенности авторизации

```
❌ НЕ РАБОТАЕТ:
   Authorization: Basic base64(api_key:password)
   Authorization: Bearer api_key
   X-API-Key: api_key

✅ РАБОТАЕТ:
   URL Query Parameter: ?api_key=YOUR_KEY
```

---

### 🔄 Полный поток запроса (Frontend → Backend → Spice API)

#### **Шаг 1: Frontend инициирует поиск**
**Файл:** `js/search-page.js` → метод `performSearch()`

```javascript
// 1. Собираем параметры поиска
const searchParams = {
    nick: 'username',        // Поиск по имени пользователя
    age_from: 18,            // Минимальный возраст
    age_to: 35,              // Максимальный возраст
    sex: 2,                  // 1=мужчина, 2=женщина, 3=пара
    is_online: 1,            // Только онлайн пользователи
    page: 1,                 // Текущая страница (1-based для UI)
    pas: 30,                 // Результатов на страницу
    is_photo: 1,             // Только с фото
    profile_complete: 1,     // Полная информация профиля
    get_picture_430: 1       // Фото высокого разрешения
};

// 2. Формируем URL запроса к нашему прокси
const queryParams = new URLSearchParams({
    session_id: window.authManager.sessionId,
    get_picture_430: 1,
    ...searchParams
});

const fullUrl = `/api/spice-multi-test?endpoint=/index_api/search&method=POST&${queryParams.toString()}`;

// 3. Отправляем POST запрос
const response = await fetch(fullUrl);
const result = await response.json();
```

**Пример реального URL:**
```
/api/spice-multi-test?endpoint=/index_api/search&method=POST&session_id=abc123&page=1&pas=30&is_photo=1&sex=2&age_from=18&age_to=35&get_picture_430=1
```

---

#### **Шаг 2: Backend прокси обрабатывает запрос**
**Файл:** `api/spice-multi-test.js`

```javascript
export default async function handler(req, res) {
    const API_KEY = process.env.SPICE_API_KEY;
    const BASE_URL = 'https://dev2018.de5a7.com';
    
    // 1. Получаем параметры из query string
    const { endpoint, method } = req.query; // endpoint = '/index_api/search'
    
    // 2. Строим итоговый URL для Spice API
    let apiUrl = `${BASE_URL}${endpoint}`; // https://dev2018.de5a7.com/index_api/search
    const queryParams = new URLSearchParams();
    
    // 3. ✅ ГЛАВНОЕ: Добавляем api_key в query параметры
    queryParams.append('api_key', API_KEY);
    
    // 4. Копируем все остальные параметры из запроса
    Object.keys(req.query).forEach(key => {
        if (key !== 'endpoint' && key !== 'method') {
            queryParams.append(key, req.query[key]);
        }
    });
    // Теперь в queryParams: api_key, session_id, page, pas, sex, age_from, age_to, и т.д.
    
    // 5. Формируем финальный URL
    const finalUrl = `${apiUrl}?${queryParams.toString()}`;
    
    // 6. Настраиваем заголовки запроса
    let fetchOptions = {
        method: 'POST', // ✅ Метод POST
        headers: { 
            'Accept': 'application/json'
            // ❌ НЕТ Authorization заголовков!
            // ❌ НЕТ X-API-Key заголовков!
        }
    };
    
    // 7. Отправляем запрос в Spice API
    const apiResponse = await fetch(finalUrl, fetchOptions);
    const data = await apiResponse.json();
    
    // 8. Возвращаем результат клиенту
    res.status(200).json({
        success: true,
        data: data
    });
}
```

**Итоговый запрос к Spice API:**
```
POST https://dev2018.de5a7.com/index_api/search?api_key=YOUR_API_KEY&session_id=abc123&page=1&pas=30&is_photo=1&sex=2&age_from=18&age_to=35&get_picture_430=1

Headers:
  Accept: application/json

Body: (пусто)
```

---

#### **Шаг 3: Spice API возвращает результаты**

**Структура успешного ответа:**
```json
{
    "connected": 1,
    "result": [
        {
            "id_membre": 12345,
            "pseudo": "Marie",
            "age": 28,
            "sexe1": 2,
            "ville": "Paris",
            "is_online": 1,
            "photos_v2": [
                {
                    "sq_small": "https://...photo_80x80.jpg",
                    "sq_middle": "https://...photo_215x215.jpg",
                    "sq_430": "https://...photo_430x430.jpg",
                    "normal": "https://...photo_original.jpg"
                }
            ],
            "photos": [
                {
                    "url_small": "https://...photo_80x80.jpg",
                    "url_middle": "https://...photo_215x215.jpg",
                    "url_big": "https://...photo_original.jpg"
                }
            ]
        }
    ],
    "total": 156,
    "nb_pages": 6,
    "page": 1
}
```

---

#### **Шаг 4: Frontend обрабатывает результаты**
**Файл:** `js/search-page.js` → метод `displayResults()`

```javascript
if (result.success && result.data) {
    // Извлекаем результаты из разных возможных структур
    const searchResults = result.data.result || result.data.results || [];
    const total = result.data.total || searchResults.length;
    const totalPages = result.data.nb_pages || Math.ceil(total / 30);
    
    // Отображаем карточки пользователей
    searchResults.forEach(user => {
        const userCard = this.createUserCard(user);
        resultsContainer.appendChild(userCard);
    });
    
    // Обновляем пагинацию
    this.updatePagination();
}
```

---

### 🔧 ЗАГОЛОВКИ ЗАПРОСОВ ПО ЭТАПАМ

| Этап | Заголовки | Примечание |
|------|-----------|------------|
| **Frontend → Vercel** | `Content-Type: application/json` | Стандартный JSON запрос |
| **Vercel → Spice API** | `Accept: application/json` | ❌ БЕЗ Authorization! |
| **Авторизация Spice API** | В URL: `?api_key=${API_KEY}` | ✅ ТОЛЬКО через query параметр |

---

### 📋 ДОСТУПНЫЕ ПАРАМЕТРЫ ПОИСКА

| Параметр | Тип | Описание | Пример |
|----------|-----|----------|---------|
| `session_id` | string | ID сессии пользователя (обязательно) | `abc123xyz` |
| `api_key` | string | API ключ (автоматически добавляется прокси) | `your_key` |
| `page` | integer | Номер страницы (0-based в API) | `0`, `1`, `2` |
| `pas` | integer | Количество результатов на страницу | `30` |
| `nick` | string | Поиск по username | `Marie` |
| `nom` | string | Поиск по имени | `Marie` |
| `sex` | integer | Пол: 1=мужчина, 2=женщина, 3=пара | `2` |
| `age_from` | integer | Минимальный возраст | `18` |
| `age_to` | integer | Максимальный возраст | `65` |
| `is_online` | integer | Только онлайн: 0 или 1 | `1` |
| `is_photo` | integer | Только с фото: 0 или 1 | `1` |
| `id_ville` | integer | ID города | `12345` |
| `profile_complete` | integer | Полная информация профиля | `1` |
| `get_picture_430` | integer | Получить photos_v2 (высокое разрешение) | `1` |

---

### ⚠️ ВАЖНЫЕ МОМЕНТЫ

1. **Метод авторизации:**
   - ✅ `api_key` ТОЛЬКО в query параметрах URL
   - ❌ НЕ используйте `Authorization` заголовки
   - ❌ НЕ используйте `X-API-Key` заголовки

2. **Content-Type:**
   - Frontend → Vercel: `Content-Type: application/json`
   - Vercel → Spice: `Accept: application/json` (тело пустое для поиска)

3. **Пагинация:**
   - Frontend использует 1-based (page=1, 2, 3...)
   - Некоторые части API используют 0-based (page=0, 1, 2...)
   - Проверяйте документацию для конкретного endpoint

4. **Фотографии:**
   - `get_picture_430=1` → возвращает `photos_v2` (новый формат)
   - Без параметра → возвращает `photos` (старый формат)
   - Приоритет: `photos_v2` > `photos` > заглушка

---

### 📍 Используется в файлах:

- `js/search-page.js` → Страница поиска пользователей
- `js/matching-system-v2.js` → метод `loadTinderProfiles()`
- `js/dashboard.js` → метод `callSearchAPI()`
- `api/admin-users.js` → Административная панель
- `app.js` → функция `searchUsers()`

---

**Куда идет запрос:**
- `https://dev2018.de5a7.com/index_api/search?api_key=${API_KEY}&session_id=${SESSION_ID}&page=0&pas=30`

---

### 💡 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

#### Пример 1: Простой поиск всех пользователей

```javascript
const searchParams = new URLSearchParams({
    session_id: 'your_session_id',
    page: 1,
    pas: 30,
    is_photo: 1
});

const response = await fetch(
    `/api/spice-multi-test?endpoint=/index_api/search&method=POST&${searchParams.toString()}`
);
const result = await response.json();

console.log(`Найдено пользователей: ${result.data.total}`);
console.log(`Страниц: ${result.data.nb_pages}`);
```

#### Пример 2: Поиск женщин 25-35 лет онлайн

```javascript
const searchParams = new URLSearchParams({
    session_id: 'your_session_id',
    sex: 2,              // Женщины
    age_from: 25,
    age_to: 35,
    is_online: 1,        // Только онлайн
    is_photo: 1,         // С фото
    get_picture_430: 1,  // Высокое разрешение
    page: 1,
    pas: 30
});

const response = await fetch(
    `/api/spice-multi-test?endpoint=/index_api/search&method=POST&${searchParams.toString()}`
);
const result = await response.json();
```

#### Пример 3: Поиск по имени пользователя

```javascript
const searchParams = new URLSearchParams({
    session_id: 'your_session_id',
    nick: 'Marie',       // Поиск по username
    page: 1,
    pas: 30,
    get_picture_430: 1
});

const response = await fetch(
    `/api/spice-multi-test?endpoint=/index_api/search&method=POST&${searchParams.toString()}`
);
const result = await response.json();
```

#### Пример 4: Обработка результатов с фотографиями

```javascript
if (result.success && result.data.result) {
    result.data.result.forEach(user => {
        // Приоритет 1: photos_v2 (если был параметр get_picture_430=1)
        let photoUrl = null;
        
        if (user.photos_v2 && user.photos_v2.length > 0) {
            const photo = user.photos_v2[0];
            photoUrl = photo.sq_middle;  // 215x215px
            // или photo.sq_430 для 430x430px
            // или photo.normal для оригинала
        }
        // Приоритет 2: photos (старый формат)
        else if (user.photos && user.photos.length > 0) {
            const photo = user.photos[0];
            photoUrl = photo.url_middle;  // 215x215px
        }
        
        console.log(`${user.pseudo}, ${user.age} лет, фото: ${photoUrl}`);
    });
}
```

---

### 🐛 ТИПИЧНЫЕ ОШИБКИ И РЕШЕНИЯ

#### Ошибка 1: 401 Unauthorized

**Проблема:**
```json
{
  "error": "Unauthorized",
  "status": 401
}
```

**Причина:** API ключ не передается или неверный

**Решение:**
- ✅ Убедитесь что `SPICE_API_KEY` настроен в `.env` или Vercel Environment Variables
- ✅ Проверьте что прокси `spice-multi-test.js` добавляет `api_key` в query параметры
- ❌ НЕ пытайтесь добавить api_key в Authorization заголовок

---

#### Ошибка 2: Пустые результаты

**Проблема:**
```json
{
  "success": true,
  "data": {
    "result": [],
    "total": 0
  }
}
```

**Причина:** Слишком строгие фильтры или нет пользователей

**Решение:**
- Уберите некоторые фильтры (особенно `is_online`, `id_ville`)
- Расширьте диапазон возраста
- Проверьте что `sex` параметр правильный (1=мужчина, 2=женщина, 3=пара)

---

#### Ошибка 3: Фотографии не загружаются

**Проблема:** В ответе есть пользователи, но нет `photos_v2` или `photos`

**Причина:** Не указан параметр `get_picture_430`

**Решение:**
```javascript
// ✅ Правильно - с фотографиями
const params = new URLSearchParams({
    session_id: sessionId,
    get_picture_430: 1,  // ← Этот параметр обязателен!
    page: 1
});

// ❌ Неправильно - без фотографий
const params = new URLSearchParams({
    session_id: sessionId,
    page: 1
});
```

---

### 🔧 ОТЛАДКА ЗАПРОСОВ

Для отладки можно добавить логирование в `api/spice-multi-test.js`:

```javascript
// Раскомментируйте эти строки для отладки
console.log('📡 URL запроса:', finalUrl.replace(API_KEY, 'HIDDEN_KEY'));
console.log('📋 Query params:', Object.fromEntries(queryParams.entries()));
console.log('📊 Response data:', data);
```

Или в браузере:

```javascript
// В search-page.js
console.log('[SEARCH] Request URL:', fullUrl);
console.log('[SEARCH] Search params:', searchParams);
console.log('[SEARCH] API Response:', result);
```

---

---

### 🏆 POST `/index_api/topmembers` - Топ участники
**Через:** `/api/spice-multi-test`  
**Функционал:** Получение топовых участников по полу

**Query params:**
```
endpoint=/index_api/topmembers
method=POST
session_id=abc123xyz
sex=2
age_range=18-65
page=0
is_photo=1
```

**Куда идет запрос:**
- `https://dev2018.de5a7.com/index_api/topmembers?api_key=${API_KEY}&session_id=${SESSION_ID}&sex=2`

**Используется в:**
- `js/main.js` → метод `loadTopMembers()`
- Главная страница - секция "Top Members"

---

### 🌍 POST `/index_api/landing_module/profils_global` - Глобальные профили
**Через:** `/api/spice-proxy-simple.js`  
**Функционал:** Получение профилей для лендинга

**Query params:**
```
api_key=${API_KEY}
force_pays=64
```

**Куда идет запрос:**
- `https://dev2018.de5a7.com/index_api/landing_module/profils_global?api_key=${API_KEY}&force_pays=64`

**Используется в:**
- Лендинговая страница
- Демонстрация профилей без авторизации

---

## 4. Матчинг (Tinder-подобная система)

### ❤️ GET `/index_api/match` - Лайк пользователя
**Через:** Прямой вызов с `api_key`  
**Функционал:** Отправка лайка пользователю

**Query params:**
```
api_key=${API_KEY}
session_id=abc123xyz
action=set_like
id_user=54321
```

**Куда идет запрос:**
- `https://dev2018.de5a7.com/index_api/match?api_key=${API_KEY}&session_id=${SESSION_ID}&action=set_like&id_user=54321`

**Response:**
```json
{
  "result": "match"  // если взаимный лайк
}
```

**Используется в:**
- `js/matching-system-v2.js` → метод `handleLike()`
- Tinder-подобный интерфейс

---

### 👎 GET `/index_api/match` - Дизлайк пользователя
**Через:** Прямой вызов с `api_key`  
**Функционал:** Отправка дизлайка пользователю

**Query params:**
```
api_key=${API_KEY}
session_id=abc123xyz
action=set_dislike
id_user=54321
```

**Используется в:**
- `js/matching-system-v2.js` → метод `handleDislike()`

---

### 💑 GET `/api/database` - Получение матчей
**Файл:** `api/database.js`  
**Функционал:** Загрузка всех матчей пользователя из БД

**Query params:**
```
action=get_matches
user_id=12345
limit=50
```

**Куда идет запрос:**
- PostgreSQL Neon (локальная БД)

**Используется в:**
- `js/matching-system-v2.js` → метод `loadMyMatches()`
- Страница "My Matches"

---

## 5. Сообщения

### 💬 POST `/api/messages` - Сохранение сообщения
**Файл:** `api/messages.js`  
**Функционал:** Сохранение нового сообщения в БД

**Request Body:**
```json
{
  "action": "save_message",
  "sender_id": "12345",
  "recipient_id": "54321",
  "message_text": "Hello!",
  "session_id": "abc123xyz"
}
```

**Куда идет запрос:**
- PostgreSQL Neon → таблица `user_messages`

**Используется в:**
- `js/messages-extension.js` → отправка сообщений
- Чат

---

### 📨 GET `/api/messages` - Получение сообщений
**Файл:** `api/messages.js`  
**Функционал:** Загрузка истории сообщений между двумя пользователями

**Query params:**
```
action=get_messages
user_id=12345
contact_id=54321
session_id=abc123xyz
```

**Куда идет запрос:**
- PostgreSQL Neon → таблица `user_messages` + `gift_transactions`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "sender_id": "12345",
      "recipient_id": "54321",
      "message_text": "Hello!",
      "created_at": "2024-01-15T10:30:00Z",
      "is_own": true
    }
  ]
}
```

**Используется в:**
- `js/messages-extension.js` → загрузка чата

---

## 6. Контакты и друзья

### 👥 GET `/ajax_api/load_contacts` - Список контактов
**Через:** `/api/spice-multi-test` или `/api/contacts`  
**Функционал:** Загрузка списка друзей и контактов

**Query params:**
```
endpoint=/ajax_api/load_contacts
method=GET
session_id=abc123xyz
filter=3  // 3 = friends only
```

**Куда идет запрос:**
- `https://dev2018.de5a7.com/ajax_api/load_contacts?api_key=${API_KEY}&session_id=${SESSION_ID}&filter=3`

**Используется в:**
- `js/main.js` → метод `loadOnlineFriends()`
- Секция "Friends Online"

---

### ➕ POST `/ajax_api/add_friend` - Добавить в друзья
**Через:** `/api/contacts`  
**Файл:** `api/contacts.js`  
**Функционал:** Отправка запроса в друзья

**Query params:**
```
action=add_friend
session_id=abc123xyz
user_id=54321
```

**Куда идет запрос:**
- `https://dev2018.de5a7.com/ajax_api/add_friend?api_key=${API_KEY}&session_id=${SESSION_ID}&id_user=54321`

**Используется в:**
- Профиль пользователя
- Кнопка "Add Friend"

---

### ➕ POST `/ajax_api/add_contact` - Добавить в контакты
**Через:** `/api/contacts`  
**Функционал:** Добавление пользователя в контакты

**Используется в:**
- Профиль пользователя

---

## 7. Подарки

### 🎁 POST `/api/database` - Покупка подарка
**Файл:** `api/database.js`  
**Функционал:** Покупка и отправка подарка пользователю

**Request Body:**
```json
{
  "action": "purchase_gift",
  "user_id": "12345",
  "session_id": "abc123xyz",
  "gift_id": 5,
  "recipient_user_id": "54321",
  "recipient_session_id": "xyz789",
  "anonymous": false
}
```

**Куда идет запрос:**
- PostgreSQL Neon → таблицы `gift_transactions`, `user_gifts`, `wallets`

**Используется в:**
- `js/gifts-modal.js` → покупка подарка
- Модальное окно подарков

---

### 📥 POST `/api/database` - Полученные подарки
**Файл:** `api/database.js`  
**Функционал:** Загрузка всех полученных подарков

**Request Body:**
```json
{
  "action": "get_received_gifts",
  "session_id": "abc123xyz",
  "user_id": "12345"
}
```

**Куда идет запрос:**
- PostgreSQL Neon → таблица `user_gifts`

**Используется в:**
- `js/gifts.js` → метод `loadGiftsData()`
- Страница подарков - инвентарь

---

### 📤 POST `/api/database` - Отправленные подарки
**Файл:** `api/database.js`  
**Функционал:** Загрузка всех отправленных подарков

**Request Body:**
```json
{
  "action": "get_sent_gifts",
  "session_id": "abc123xyz",
  "user_id": "12345"
}
```

**Используется в:**
- `js/gifts.js` → метод `loadGiftsData()`
- Страница подарков - история

---

### 💰 POST `/api/database` - Монетизация подарков
**Файл:** `api/database.js`  
**Функционал:** Конвертация подарков в деньги (10% от стоимости)

**Request Body:**
```json
{
  "action": "monetize_gifts",
  "session_id": "abc123xyz",
  "user_id": "12345",
  "gift_ids": [1, 2, 3],
  "currency": "EUR"
}
```

**Куда идет запрос:**
- PostgreSQL Neon → обновление статуса подарков + создание транзакции

**Используется в:**
- `js/gifts.js` → метод `confirmMonetization()`
- Страница подарков - монетизация

---

## 8. Кошелек и транзакции

### 💳 POST `/api/wallet-transactions` - Получить баланс
**Файл:** `api/wallet-transactions.js`  
**Функционал:** Загрузка баланса кошелька

**Request Body:**
```json
{
  "action": "get_wallet",
  "user_id": "12345",
  "session_id": "abc123xyz"
}
```

**Куда идет запрос:**
- PostgreSQL Neon → таблица `wallets`

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 150,
    "user_id": "12345"
  }
}
```

**Используется в:**
- `js/wallet.js` → метод `loadWalletData()`
- Страница кошелька

---

### 📊 POST `/api/wallet-transactions` - История транзакций
**Файл:** `api/wallet-transactions.js`  
**Функционал:** Загрузка истории транзакций кошелька

**Request Body:**
```json
{
  "action": "get_wallet_transactions",
  "user_id": "12345",
  "session_id": "abc123xyz",
  "limit": 5
}
```

**Куда идет запрос:**
- PostgreSQL Neon → таблица `wallet_transactions`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "transaction_type": "deposit",
      "amount": 20.00,
      "credits": 100,
      "currency": "EUR",
      "description": "Wallet top-up",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Используется в:**
- `js/wallet.js` → метод `loadRecentTransactions()`

---

### ➕ POST `/api/wallet-transactions` - Добавить транзакцию
**Файл:** `api/wallet-transactions.js`  
**Функционал:** Создание новой транзакции (пополнение/списание)

**Request Body:**
```json
{
  "action": "add_transaction",
  "user_id": "12345",
  "session_id": "abc123xyz",
  "transaction_type": "deposit",
  "amount": 20.00,
  "credits": 100,
  "currency": "EUR",
  "description": "credits_12345_1705315800000",
  "payment_method": "card",
  "payment_reference": "txn_abc123",
  "status": "completed"
}
```

**Куда идет запрос:**
- PostgreSQL Neon → таблицы `wallet_transactions` + `wallets` (обновление баланса)

**Используется в:**
- `api/networx-payment.js` → после успешного платежа
- Webhook обработчик платежей

---

## 9. Платежи (Networx Payment Gateway)

### 💰 POST `/api/networx-payment` - Создание платежного токена
**Файл:** `api/networx-payment.js`  
**Функционал:** Создание платежной сессии Networx

**Request Body:**
```json
{
  "action": "create_payment_token",
  "amount": 20.00,
  "currency": "EUR",
  "credits": 100,
  "session_id": "abc123xyz",
  "user_id": "12345",
  "billing_data": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "address": "123 Main St",
    "city": "Paris",
    "country": "FR",
    "postalCode": "75001"
  }
}
```

**Куда идет запрос:**
- `https://checkout.networxpay.com/ctp/api/checkouts` (Networx API)

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "chk_abc123xyz",
    "payment_url": "https://checkout.networxpay.com/...",
    "order_id": "credits_12345_1705315800000",
    "amount": 20.00,
    "currency": "EUR",
    "credits": 100
  }
}
```

**Используется в:**
- `js/wallet.js` → метод `initializePayment()`
- Процесс пополнения кошелька

---

### 🔔 POST `/api/networx-payment` - Webhook (без action)
**Файл:** `api/networx-payment.js`  
**Функционал:** Прием уведомлений о статусе платежа от Networx

**Request Body (от Networx):**
```json
{
  "transaction": {
    "uid": "txn_abc123",
    "status": "successful",
    "amount": 2000,  // в центах
    "currency": "EUR",
    "tracking_id": "credits_12345_1705315800000"
  }
}
```

**Куда идет запрос:**
- Внутренняя обработка + вызов `/api/wallet-transactions` для добавления кредитов

**Используется в:**
- Автоматическая обработка платежей
- Networx отправляет webhook после успешной оплаты

---

## 10. Активность и статистика

### 🌐 GET `/ajax_api/online` - Статус онлайн
**Через:** `/api/spice-multi-test`  
**Функционал:** Проверка статуса пользователя и количества новых сообщений

**Query params:**
```
endpoint=/ajax_api/online
method=GET
session_id=abc123xyz
```

**Куда идет запрос:**
- `https://dev2018.de5a7.com/ajax_api/online?api_key=${API_KEY}&session_id=${SESSION_ID}`

**Response:**
```json
{
  "result": {
    "connected": "1",
    "nb_new_message": 3
  }
}
```

**Используется в:**
- `js/main.js` → метод `loadQuickStats()`
- `js/auth-manager.js` → метод `verifySession()`
- Обновляется каждые 30 секунд

---

### 📰 POST `/index_api/wall` - Лента активности
**Через:** `/api/spice-multi-test`  
**Функционал:** Загрузка ленты активности пользователей

**Query params:**
```
endpoint=/index_api/wall
method=POST
session_id=abc123xyz
```

**Куда идет запрос:**
- `https://dev2018.de5a7.com/index_api/wall?api_key=${API_KEY}&session_id=${SESSION_ID}`

**Response:**
```json
{
  "result": {
    "1": {
      "pseudo": "Alice",
      "action": "con",
      "date_action": "2024-01-15T10:30:00Z",
      "zone_name": "Paris"
    }
  }
}
```

**Используется в:**
- `js/main.js` → метод `loadActivityFeed()`
- Главная страница - лента активности

---

### 🎬 GET `/ajax_api/getActivities` - Дополнительные активности
**Через:** `/api/spice-multi-test`  
**Функционал:** Получение новых участников, обновлений профилей, дружбы

**Query params:**
```
endpoint=/ajax_api/getActivities
method=GET
session_id=abc123xyz
```

**Куда идет запрос:**
- `https://dev2018.de5a7.com/ajax_api/getActivities?api_key=${API_KEY}&session_id=${SESSION_ID}`

**Response:**
```json
{
  "wall_online": { "pseudo": "Bob", "date_cnx": "...", "photos": [...] },
  "wall_change": { "pseudo": "Alice", "date_modification": "...", "photos": [...] },
  "wall_friends": { "pseudo1": "Bob", "pseudo2": "Charlie", "date": "..." }
}
```

**Используется в:**
- `js/main.js` → метод `loadActivityFeed()`
- Дополнение к основной ленте

---

### 👀 POST `/index_api/guest/get/visites` - Посетители профиля
**Через:** `/api/spice-multi-test`  
**Функционал:** Список пользователей, посетивших профиль

**Query params:**
```
endpoint=/index_api/guest/get/visites
method=POST
session_id=abc123xyz
page=0
```

**Куда идет запрос:**
- `https://dev2018.de5a7.com/index_api/guest/get/visites?api_key=${API_KEY}&session_id=${SESSION_ID}&page=0`

**Используется в:**
- `js/main.js` → метод `loadRecentVisitors()`
- Секция "Recent Visitors"

---

## 11. Дополнительные endpoint'ы

### 🔑 GET `/api/get-api-key` - Получение API ключа
**Файл:** `api/get-api-key.js`  
**Функционал:** Получение конфигурации API для клиентской части

**Response:**
```json
{
  "apiKey": "HIDDEN",
  "baseUrl": "https://dev2018.de5a7.com"
}
```

**Используется в:**
- `js/matching-system-v2.js` → для прямых запросов к Match API

---

### 🗄️ GET `/api/database` - Универсальный endpoint БД
**Файл:** `api/database.js`  
**Функционал:** Множество операций с локальной БД PostgreSQL

**Основные actions:**
- `init_db` - инициализация таблиц
- `get_progress` - прогресс матчинга
- `save_progress` - сохранение прогресса
- `mark_viewed` - отметить профиль как просмотренный
- `get_viewed` - список просмотренных профилей
- `get_matches` - список матчей
- `get_wallet` - баланс кошелька
- `get_notifications` - уведомления о подарках
- `purchase_gift` - покупка подарка
- `monetize_gifts` - монетизация подарков

**Куда идет запрос:**
- PostgreSQL Neon (облачная БД)

---

### 🌍 GET `https://api.ipify.org` - Получение IP адреса
**Функционал:** Получение IP пользователя для регистрации

**Response:**
```json
{
  "ip": "192.168.1.1"
}
```

**Используется в:**
- `js/auth-manager.js` → метод `getUserIP()`
- При регистрации

---

### 🔄 GET `/api/spice-multi-test` - Универсальный прокси
**Файл:** `api/spice-multi-test.js`  
**Функционал:** Прокси для всех запросов к Spice API

**Query params:**
```
endpoint=/ajax_api/online
method=GET
session_id=abc123xyz
[дополнительные параметры]
```

**Куда идет запрос:**
- Перенаправляет на соответствующий endpoint Spice API
- Добавляет `api_key` автоматически

**Используется в:**
- Почти все запросы к Spice API идут через этот прокси
- Скрывает API ключ от клиента

---

## 📊 Сводная таблица по функционалу

| Функционал | Основной endpoint | Метод | Куда идет |
|-----------|------------------|-------|-----------|
| **Авторизация** | `/api/auth` | POST | Vercel API |
| **Регистрация** | `/api/auth` | POST | Vercel API |
| **Профиль** | `/api/user-profile` | POST | Neon DB |
| **Поиск** | `/index_api/search` | POST | Spice API |
| **Матчинг (лайк)** | `/index_api/match` | GET | Spice API |
| **Сообщения (сохранение)** | `/api/messages` | POST | Neon DB |
| **Сообщения (чтение)** | `/api/messages` | GET | Neon DB |
| **Друзья** | `/ajax_api/load_contacts` | GET | Spice API |
| **Подарки (покупка)** | `/api/database` | POST | Neon DB |
| **Подарки (получение)** | `/api/database` | POST | Neon DB |
| **Кошелек** | `/api/wallet-transactions` | POST | Neon DB |
| **Платеж (создание)** | `/api/networx-payment` | POST | Networx API |
| **Платеж (webhook)** | `/api/networx-payment` | POST | Vercel → Neon DB |
| **Активность** | `/index_api/wall` | POST | Spice API |
| **Онлайн статус** | `/ajax_api/online` | GET | Spice API |
| **Топ участники** | `/index_api/topmembers` | POST | Spice API |
| **Посетители** | `/index_api/guest/get/visites` | POST | Spice API |

---

## 🔐 Безопасность

### Environment Variables (Vercel)
Все конфиденциальные данные хранятся в Vercel Environment Variables:

#### ✅ SPICE_API_KEY (обязательно)
- **НЕ передается в клиентский код**
- Хранится в `process.env.SPICE_API_KEY` на Vercel
- Добавляется автоматически прокси-функциями
- Используется во всех запросах к Spice API

#### ⚙️ SPICE_BASE_URL (опционально)
- Хранится в `process.env.SPICE_BASE_URL` на Vercel
- Если не задано, используется fallback: `'https://dev2018.de5a7.com'`
- Позволяет переключаться между разными API серверами
- Пример использования:
  ```javascript
  const BASE_URL = process.env.SPICE_BASE_URL || 'https://dev2018.de5a7.com';
  ```

#### 💾 POSTGRES_URL (для БД)
- Строка подключения к PostgreSQL Neon
- Используется для локальной базы данных

#### 💳 NETWORX_SHOP_ID и NETWORX_SECRET_KEY
- Credentials для платежного шлюза Networx
- Используются в `api/networx-payment.js`

### Session ID
- Хранится в `localStorage` как `lavrilo_session`
- Передается в каждом запросе
- Проверяется на сервере

### User ID
- Извлекается из session на сервере
- НЕ доверяется клиентскому значению для критических операций

---

## 📝 Примечания

1. **Все запросы к Spice API** идут через прокси `/api/spice-multi-test` или специализированные endpoint'ы
2. **Локальная БД (Neon PostgreSQL)** используется для:
   - Сообщений
   - Матчей
   - Подарков
   - Кошелька
   - Прогресса матчинга
3. **Платежи** обрабатываются через Networx Payment Gateway
4. **API ключ** ВСЕГДА передается в query параметрах, НЕ в headers
5. **SPICE_BASE_URL** используется в следующих файлах:
   - `api/auth.js` - авторизация
   - `api/user-profile.js` - профиль
   - `api/spice-proxy-simple.js` - простой прокси
   - `api/spice-multi-test.js` - универсальный прокси
   - `api/discovery-preferences.js` - настройки поиска
   - `api/contacts.js` - контакты
   - `api/admin-users.js` - админка
   - `api/get-api-key.js` - получение конфигурации

### Примеры использования SPICE_BASE_URL в коде:

```javascript
// api/spice-multi-test.js
const BASE_URL = process.env.SPICE_BASE_URL || 'https://dev2018.de5a7.com';
const apiUrl = `${BASE_URL}${endpoint}?${queryParams}`;

// api/get-api-key.js  
const BASE_URL = process.env.SPICE_BASE_URL || 'https://dev2018.de5a7.com';
res.json({
  apiKey: API_KEY,
  baseUrl: BASE_URL  // Передается клиенту для прямых запросов
});
```

---

**Дата создания:** 5 ноября 2025  
**Версия:** 1.0  
**Статус:** Актуально ✅

