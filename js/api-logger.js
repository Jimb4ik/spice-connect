/**
 * API Logger - перехватывает все fetch запросы и логирует их
 * Для отладки и понимания какие URL срабатывают
 */

class APILogger {
    constructor() {
        this.logs = [];
        this.enabled = true;
        this.setupFetchInterceptor();
        console.log('%c[API-LOGGER] 🚀 Инициализирован', 'color: #00ff00; font-weight: bold');
    }

    setupFetchInterceptor() {
        // Сохраняем оригинальный fetch
        const originalFetch = window.fetch;
        const self = this;

        // Перехватываем все fetch запросы
        window.fetch = async function(...args) {
            const [url, options = {}] = args;
            const method = options.method || 'GET';
            const startTime = Date.now();

            if (self.enabled) {
                // Логируем запрос
                console.groupCollapsed(
                    `%c${method}%c ${self.getShortUrl(url)}`,
                    'color: #00aaff; font-weight: bold; padding: 2px 4px; background: #001a33; border-radius: 3px',
                    'color: #666; font-weight: normal'
                );
                console.log('📤 URL:', url);
                console.log('🔧 Method:', method);
                
                if (options.headers) {
                    console.log('📋 Headers:', options.headers);
                }
                
                if (options.body) {
                    try {
                        const bodyData = JSON.parse(options.body);
                        console.log('📦 Body:', bodyData);
                    } catch (e) {
                        console.log('📦 Body (raw):', options.body);
                    }
                }
                console.groupEnd();
            }

            try {
                // Выполняем оригинальный fetch
                const response = await originalFetch.apply(this, args);
                const endTime = Date.now();
                const duration = endTime - startTime;

                // Клонируем response для чтения
                const clonedResponse = response.clone();

                if (self.enabled) {
                    // Логируем ответ
                    const statusColor = response.ok ? '#00ff00' : '#ff0000';
                    console.groupCollapsed(
                        `%c${response.status}%c ${self.getShortUrl(url)} %c${duration}ms`,
                        `color: ${statusColor}; font-weight: bold; padding: 2px 4px; background: #002200; border-radius: 3px`,
                        'color: #666',
                        'color: #888; font-style: italic'
                    );
                    console.log('✅ Status:', response.status, response.statusText);
                    console.log('⏱️ Duration:', duration + 'ms');
                    
                    // Пытаемся прочитать JSON ответ
                    try {
                        const data = await clonedResponse.json();
                        console.log('📥 Response:', data);
                    } catch (e) {
                        console.log('📥 Response: (not JSON)');
                    }
                    console.groupEnd();
                }

                // Сохраняем в историю
                self.logs.push({
                    url,
                    method,
                    status: response.status,
                    duration,
                    timestamp: new Date().toISOString()
                });

                return response;

            } catch (error) {
                const endTime = Date.now();
                const duration = endTime - startTime;

                if (self.enabled) {
                    console.groupCollapsed(
                        `%c❌ ERROR%c ${self.getShortUrl(url)} %c${duration}ms`,
                        'color: #ff0000; font-weight: bold; padding: 2px 4px; background: #330000; border-radius: 3px',
                        'color: #666',
                        'color: #888; font-style: italic'
                    );
                    console.error('💥 Error:', error);
                    console.log('⏱️ Duration:', duration + 'ms');
                    console.groupEnd();
                }

                // Сохраняем ошибку в историю
                self.logs.push({
                    url,
                    method,
                    status: 'ERROR',
                    error: error.message,
                    duration,
                    timestamp: new Date().toISOString()
                });

                throw error;
            }
        };
    }

    getShortUrl(url) {
        if (typeof url !== 'string') {
            url = url.toString();
        }
        
        // Убираем домен если это относительный путь
        if (url.startsWith('http')) {
            try {
                const urlObj = new URL(url);
                return urlObj.pathname + urlObj.search;
            } catch (e) {
                return url;
            }
        }
        
        // Сокращаем длинные URL
        if (url.length > 80) {
            return url.substring(0, 77) + '...';
        }
        
        return url;
    }

    // Включить/выключить логирование
    toggle() {
        this.enabled = !this.enabled;
        console.log(
            `%c[API-LOGGER] ${this.enabled ? '✅ Включен' : '❌ Выключен'}`,
            `color: ${this.enabled ? '#00ff00' : '#ff0000'}; font-weight: bold`
        );
    }

    // Показать историю запросов
    showHistory(limit = 20) {
        console.log(`%c[API-LOGGER] 📊 История последних ${limit} запросов:`, 'color: #00aaff; font-weight: bold');
        console.table(this.logs.slice(-limit));
    }

    // Очистить историю
    clearHistory() {
        this.logs = [];
        console.log('%c[API-LOGGER] 🗑️ История очищена', 'color: #ffaa00; font-weight: bold');
    }

    // Фильтр по URL
    filterByUrl(pattern) {
        const filtered = this.logs.filter(log => log.url.includes(pattern));
        console.log(`%c[API-LOGGER] 🔍 Найдено ${filtered.length} запросов с "${pattern}":`, 'color: #00aaff; font-weight: bold');
        console.table(filtered);
    }

    // Статистика
    showStats() {
        const stats = {
            total: this.logs.length,
            success: this.logs.filter(l => l.status >= 200 && l.status < 300).length,
            errors: this.logs.filter(l => l.status === 'ERROR' || l.status >= 400).length,
            avgDuration: Math.round(this.logs.reduce((sum, l) => sum + l.duration, 0) / this.logs.length)
        };

        console.log('%c[API-LOGGER] 📈 Статистика:', 'color: #00aaff; font-weight: bold');
        console.table(stats);
    }
}

// Создаем глобальный экземпляр
window.apiLogger = new APILogger();

// Добавляем справку в консоль
console.log(`
%c╔════════════════════════════════════════╗
║      🔍 API LOGGER - Команды           ║
╚════════════════════════════════════════╝%c

Доступные команды:
  
  apiLogger.toggle()              - Включить/выключить логирование
  apiLogger.showHistory()         - Показать историю запросов
  apiLogger.showHistory(50)       - Показать последние 50 запросов
  apiLogger.clearHistory()        - Очистить историю
  apiLogger.filterByUrl('api')    - Фильтр по URL
  apiLogger.showStats()           - Показать статистику

Все fetch запросы автоматически логируются! 🚀
`, 
'color: #00aaff; font-weight: bold', 
'color: #666'
);

console.log('[API-LOGGER] ✅ Готов к работе! Все fetch запросы будут логироваться.');

