// Cache Buster - автоматическое обновление версий файлов
class CacheBuster {
    constructor() {
        this.version = '1.0.17'; // Увеличивайте при каждом обновлении
        this.init();
        this.registerServiceWorker();
    }

    init() {
        // Проверяем версию в localStorage
        const storedVersion = localStorage.getItem('app_version');
        
        if (storedVersion !== this.version) {
            console.log(`🔄 Обновление с версии ${storedVersion} до ${this.version}`);
            this.clearCache();
            this.updateVersion();
            this.reloadIfNeeded();
        }
    }

    clearCache() {
        // Очищаем localStorage (кроме важных данных)
        const importantKeys = ['user_token', 'user_data', 'auth_token', 'tokenLogin'];
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && !importantKeys.includes(key)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Очищаем sessionStorage
        sessionStorage.clear();
        
        console.log('🧹 Кеш очищен');
    }

    updateVersion() {
        localStorage.setItem('app_version', this.version);
        localStorage.setItem('last_update', new Date().toISOString());
    }

    reloadIfNeeded() {
        // Автоматически обновляем через 2 секунды
        console.log('🔄 Автоматическое обновление через 2 секунды...');
        setTimeout(() => {
            this.forceReload();
        }, 2000);
    }

    forceReload() {
        // Принудительная перезагрузка с очисткой кеша
        window.location.reload(true);
    }


    // Регистрация Service Worker
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('[SW] Service Worker registered successfully:', registration);
                
                // Слушаем обновления
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[SW] New Service Worker available');
                            // Автоматически обновляем без уведомлений
                            setTimeout(() => this.forceReload(), 1000);
                        }
                    });
                });
            } catch (error) {
                console.log('[SW] Service Worker registration failed:', error);
            }
        }
    }

    // Метод для разработчиков - увеличить версию
    static bumpVersion() {
        const script = document.querySelector('script[src*="cache-buster"]');
        if (script) {
            const currentVersion = new CacheBuster().version;
            const versionParts = currentVersion.split('.');
            versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
            const newVersion = versionParts.join('.');
            console.log(`Обновите версию в cache-buster.js с ${currentVersion} на ${newVersion}`);
        }
    }
}

// Инициализируем cache buster
const cacheBuster = new CacheBuster();

// Экспортируем для использования в других файлах
window.cacheBuster = cacheBuster;
