# 🚀 Настройка API в Vercel Environment Variables

## Где добавить ваш Spice API ключ

### 1. Перейдите в настройки проекта Vercel

1. Откройте https://vercel.com/dashboard
2. Найдите ваш проект **SpiceConnect**
3. Нажмите на проект
4. Перейдите в **Settings** (⚙️)
5. Выберите **Environment Variables** в левом меню

### 2. Добавьте переменные окружения

Добавьте эти **2 переменные**:

#### ✅ Переменная 1: SPICE_API_KEY
- **Name**: `SPICE_API_KEY`
- **Value**: `ваш_реальный_api_ключ_от_spice`
- **Environment**: `Production`, `Preview`, `Development` (выберите все)

#### ✅ Переменная 2: SPICE_BASE_URL (опционально)
- **Name**: `SPICE_BASE_URL` 
- **Value**: `https://api.jetsetrdv.com` (или другой URL если нужен)
- **Environment**: `Production`, `Preview`, `Development` (выберите все)

### 3. Сохранить и редеплоить

1. Нажмите **Save** для каждой переменной
2. Перейдите в **Deployments**
3. Нажмите на последний деплой и выберите **Redeploy**
4. Или сделайте новый commit в GitHub - автоматически задеплоится

## 🔧 Исправленные проблемы

### ✅ Что было исправлено:

1. **Правильные endpoints**: Теперь используются `/index_api/...` и `/ajax_api/...`
2. **Корректная авторизация**: API ключ передается в параметрах
3. **Session-based API**: После логина получаем `session_id` для поиска
4. **Правильная структура данных**: Соответствует реальному Spice API V2

### 🚀 Как работает сейчас:

1. **Регистрация**: `POST /index_api/subscribe` с правильными параметрами
2. **Вход**: `POST /index_api/login` → получаем `session_id`
3. **Поиск**: `POST /index_api/search` с `session_id`
4. **Сообщения**: `GET /ajax_api/send_message` с API ключом в параметрах

## 🎯 URL приложения

После настройки API ключа:
- **Live**: https://spiceconnect.vercel.app/
- **API работает**: через serverless функцию `/api/spice-proxy`
- **Реальные пользователи**: теперь загружаются из Spice API

## 🆘 Если что-то не работает:

1. **Проверьте API ключ** в Environment Variables
2. **Посмотрите логи** в Vercel → Functions → Errors
3. **Перезадеплойте** после изменений в переменных
4. **Откройте Network tab** в браузере и посмотрите на запросы к `/api/spice-proxy` 