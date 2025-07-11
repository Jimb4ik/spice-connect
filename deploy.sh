#!/bin/bash

# 🚀 Скрипт автоматического деплоя SpiceConnect на Vercel
# Использование: chmod +x deploy.sh && ./deploy.sh

set -e

echo "🚀 Деплой SpiceConnect на Vercel"
echo "=================================="

# Проверка наличия необходимых инструментов
check_dependencies() {
    echo "🔍 Проверка зависимостей..."
    
    if ! command -v git &> /dev/null; then
        echo "❌ Git не установлен. Установите Git и попробуйте снова."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo "⚠️  Node.js не установлен. Рекомендуется установить для лучшей совместимости."
    fi
    
    echo "✅ Зависимости проверены"
}

# Инициализация Git репозитория
init_git() {
    if [ ! -d ".git" ]; then
        echo "📦 Инициализация Git репозитория..."
        git init
        git add .
        git commit -m "Initial commit: SpiceConnect MVP"
        echo "✅ Git репозиторий инициализирован"
    else
        echo "📦 Git репозиторий уже существует"
        echo "📝 Добавление изменений..."
        git add .
        
        if git diff --staged --quiet; then
            echo "ℹ️  Нет изменений для коммита"
        else
            echo "💾 Создание коммита..."
            git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')"
            echo "✅ Изменения зафиксированы"
        fi
    fi
}

# Проверка установки Vercel CLI
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        echo "⚠️  Vercel CLI не установлен"
        read -p "Установить Vercel CLI? (y/n): " install_vercel
        
        if [ "$install_vercel" = "y" ] || [ "$install_vercel" = "Y" ]; then
            echo "📥 Установка Vercel CLI..."
            npm install -g vercel
            echo "✅ Vercel CLI установлен"
        else
            echo "❌ Vercel CLI необходим для деплоя. Установите его и попробуйте снова."
            echo "💡 Команда для установки: npm install -g vercel"
            exit 1
        fi
    else
        echo "✅ Vercel CLI найден"
    fi
}

# Авторизация в Vercel
vercel_login() {
    echo "🔐 Проверка авторизации в Vercel..."
    
    if ! vercel whoami &> /dev/null; then
        echo "🔑 Необходима авторизация в Vercel"
        vercel login
    else
        echo "✅ Уже авторизован в Vercel"
    fi
}

# Деплой проекта
deploy_project() {
    echo "🚀 Запуск деплоя..."
    echo "📋 Конфигурация проекта:"
    echo "   - Название: spiceconnect"
    echo "   - Тип: Static Site"
    echo "   - Файлы: $(ls -1 | grep -E '\.(html|css|js|json|md)$' | wc -l) файлов"
    
    # Запуск деплоя
    vercel --prod --yes --name spiceconnect
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Деплой успешно завершен!"
        echo "=================================="
        echo "📱 Ваше приложение доступно по адресу:"
        echo "🌐 https://spiceconnect.vercel.app"
        echo ""
        echo "📊 Что дальше:"
        echo "   1. Протестируйте все функции"
        echo "   2. Настройте собственный домен (опционально)"
        echo "   3. Добавьте API ключи в Environment Variables"
        echo "   4. Включите аналитику Vercel"
        echo ""
        echo "🛠  Полезные команды:"
        echo "   - vercel --logs: просмотр логов"
        echo "   - vercel domains: управление доменами"
        echo "   - vercel env: управление переменными окружения"
    else
        echo "❌ Ошибка при деплое. Проверьте логи выше."
        exit 1
    fi
}

# Главная функция
main() {
    echo "Добро пожаловать в автоматический деплой SpiceConnect!"
    echo ""
    
    # Проверка зависимостей
    check_dependencies
    
    # Подготовка Git
    init_git
    
    # Проверка Vercel CLI
    check_vercel_cli
    
    # Авторизация
    vercel_login
    
    # Деплой
    deploy_project
    
    echo ""
    echo "🎯 Рекомендации после деплоя:"
    echo "   1. Откройте https://spiceconnect.vercel.app"
    echo "   2. Протестируйте авторизацию"
    echo "   3. Проверьте поиск пользователей"
    echo "   4. Протестируйте сообщения"
    echo "   5. Проверьте работу на мобильных устройствах"
    echo ""
    echo "📚 Документация:"
    echo "   - README.md: подробная документация"
    echo "   - DEPLOYMENT.md: инструкции по деплою"
    echo "   - QUICKSTART.md: быстрый старт"
    echo ""
    echo "🆘 Поддержка:"
    echo "   - Если что-то не работает, проверьте консоль браузера"
    echo "   - Для настройки API ключей см. DEPLOYMENT.md"
    echo ""
    echo "✨ Спасибо за использование SpiceConnect!"
}

# Запуск скрипта
main "$@" 