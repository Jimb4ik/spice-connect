class SearchManager {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalResults = 0;
        this.isLoading = false;
        this.lastSearchParams = null;
        this.init();
    }

    async init() {
        console.log('[SEARCH] Initializing search manager');
        
        // Check authentication
        if (!window.authManager || !window.authManager.isLoggedIn) {
            console.log('[SEARCH] User not logged in, redirecting');
            window.location.href = 'index.html';
            return;
        }

        this.setupEventListeners();
        this.loadInitialResults();
    }

    setupEventListeners() {
        const searchBtn = document.getElementById('searchBtn');
        const clearBtn = document.getElementById('clearFilters');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearFilters());
        }

        // Enter key in search inputs
        const searchInputs = document.querySelectorAll('#searchName, #searchLocation');
        searchInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        });
    }

    async loadInitialResults() {
        console.log('[SEARCH] Loading initial results');
        // Сначала попробуем поиск без фильтров для тестирования
        await this.testBasicSearch();
        // Затем выполним обычный поиск
        await this.performSearch();
    }
    
    async testBasicSearch() {
        console.log('[SEARCH] Testing basic search without filters...');
        
        try {
            const basicParams = new URLSearchParams({
                session_id: window.authManager.sessionId,
                page: 1
            });
            
            const testUrl = `/api/spice-multi-test?endpoint=/index_api/search&method=POST&${basicParams.toString()}`;
            console.log('[SEARCH] Basic test URL:', testUrl);
            
            const response = await fetch(testUrl);
            const result = await response.json();
            
            console.log('[SEARCH] Basic test result:', {
                success: result.success,
                dataExists: !!result.data,
                resultCount: result.data?.result?.length || 0,
                sampleResult: result.data?.result?.[0] || 'no results'
            });
            
        } catch (error) {
            console.error('[SEARCH] Basic test failed:', error);
        }
    }

    async performSearch(isNewSearch = true) {
        if (this.isLoading) return;
        
        // Если это новый поиск (не пагинация), сбрасываем на первую страницу
        if (isNewSearch) {
            this.currentPage = 1;
        }
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            let searchParams = this.getSearchParams();
            console.log('[SEARCH] Initial search params:', searchParams);
            
            // Обрабатываем поиск по локации если указан
            if (searchParams._location_name) {
                const locationName = searchParams._location_name;
                delete searchParams._location_name; // Удаляем временный параметр
                
                console.log('[SEARCH] Resolving location:', locationName);
                const cityId = await this.getCityId(locationName);
                if (cityId) {
                    searchParams.id_ville = cityId;
                    console.log('[SEARCH] Using city ID:', cityId);
                } else {
                    console.log('[SEARCH] City not found, skipping location filter');
                }
            }
            
            // Build query string for search API
            const queryParams = new URLSearchParams({
                session_id: window.authManager.sessionId,
                get_picture_430: 1, // Добавляем параметр для получения photos_v2
                ...searchParams
            });
            
            const fullUrl = `/api/spice-multi-test?endpoint=/index_api/search&method=POST&${queryParams.toString()}`;
            console.log('[SEARCH] Full request URL:', fullUrl);
            console.log('[SEARCH] Query params object:', Object.fromEntries(queryParams.entries()));
            
            const response = await fetch(fullUrl);

            const result = await response.json();
            console.log('[SEARCH] Full search result:', JSON.stringify(result, null, 2));
            
            // Детальная диагностика ответа
            console.log('[SEARCH] Response analysis:', {
                success: result.success,
                hasData: !!result.data,
                hasResult: !!(result.data && result.data.result),
                resultLength: result.data?.result?.length || 0,
                total: result.data?.total,
                dataKeys: result.data ? Object.keys(result.data) : 'no data'
            });

            if (result.success && result.data) {
                // Проверяем разные возможные структуры ответа
                const searchResults = result.data.result || result.data.results || result.data || [];
                const total = result.data.total || result.data.nb_total || searchResults.length || 0;
                const totalPages = result.data.nb_pages || Math.ceil(total / 30) || 1;
                
                console.log('[SEARCH] Extracted results:', { 
                    searchResults, 
                    total, 
                    totalPages,
                    currentPage: this.currentPage,
                    length: searchResults.length 
                });
                
                // Сохраняем данные пагинации
                this.totalResults = total;
                this.totalPages = totalPages;
                this.lastSearchParams = searchParams;
                
                this.displayResults(searchResults, total);
                this.updatePagination();
            } else {
                console.error('[SEARCH] Search failed:', result);
                this.showError('Search failed. Please try again.');
            }
        } catch (error) {
            console.error('[SEARCH] Search error:', error);
            this.showError('An error occurred while searching. Please try again.');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    getSearchParams() {
        const params = {};
        
        // Name search - используем только nick для поиска по username
        const searchName = document.getElementById('searchName')?.value?.trim();
        if (searchName) {
            params.nick = searchName;  // Поиск по username
            // НЕ используем nom одновременно с nick - это может конфликтовать
        }
        
        // Location search - будет обработан асинхронно в performSearch
        const searchLocation = document.getElementById('searchLocation')?.value?.trim();
        if (searchLocation) {
            params._location_name = searchLocation; // Временный параметр для обработки
        }
        
        // Age range
        const ageMin = document.getElementById('ageMin')?.value;
        const ageMax = document.getElementById('ageMax')?.value;
        if (ageMin) params.age_from = parseInt(ageMin);
        if (ageMax) params.age_to = parseInt(ageMax);
        
        // Gender
        const gender = document.getElementById('searchGender')?.value;
        if (gender) {
            switch (gender) {
                case 'male':
                    params.sex = 1;
                    break;
                case 'female':
                    params.sex = 2;
                    break;
                case 'couple':
                    params.sex = 3;
                    break;
            }
        }
        
        // Online only
        const onlineOnly = document.getElementById('onlineOnly')?.checked;
        if (onlineOnly) {
            params.is_online = 1;
        }
        
        // Page
        params.page = this.currentPage;
        
        // Устанавливаем 30 профилей на страницу для пагинации
        params.pas = 30;
        
        // Запрашиваем только пользователей с фото для лучшего UX
        params.is_photo = 1;
        
        // Запрашиваем полную информацию профилей
        params.profile_complete = 1;
        
        // Запрашиваем фото в высоком разрешении
        params.get_picture_430 = 1;
        
        return params;
    }

    displayResults(results, total) {
        console.log('[SEARCH] displayResults called with:', { results, total, resultsLength: results?.length });
        
        // Диагностика DOM элементов
        console.log('[SEARCH] Available elements:', {
            searchGrid: !!document.getElementById('searchGrid'),
            searchResults: !!document.getElementById('searchResults'),
            resultsCount: !!document.getElementById('resultsCount'),
            noResults: !!document.getElementById('noResults')
        });
        
        // Используем существующий контейнер из HTML
        const container = document.getElementById('searchResults') || document.querySelector('.search-results');
        const resultsCountEl = document.getElementById('resultsCount') || document.querySelector('.results-count');
        
        if (!container) {
            console.error('[SEARCH] Container not found!');
            console.log('[SEARCH] All elements with class search-results:', document.querySelectorAll('.search-results'));
            console.log('[SEARCH] All elements with id containing "search":', document.querySelectorAll('[id*="search"]'));
            return;
        }
        
        console.log('[SEARCH] Using container:', container.id || container.className);
        
        if (!results || results.length === 0) {
            console.log('[SEARCH] No results to display');
            container.innerHTML = '';
            if (resultsCountEl) resultsCountEl.textContent = '0 results';
            
            // Показываем блок "No results"
            const noResultsDiv = document.getElementById('noResults');
            if (noResultsDiv) {
                noResultsDiv.style.display = 'block';
            }
            return;
        }
        
        console.log('[SEARCH] Displaying results:', results.length);
        
        // Скрываем блок "No results"
        const noResultsDiv = document.getElementById('noResults');
        if (noResultsDiv) {
            noResultsDiv.style.display = 'none';
        }
        
        // Update results count
        if (resultsCountEl) {
            const startResult = (this.currentPage - 1) * 30 + 1;
            const endResult = Math.min(this.currentPage * 30, this.totalResults);
            resultsCountEl.textContent = `${startResult}-${endResult} of ${this.totalResults} results`;
        }
        
        // Найдем или создадим контейнер для результатов
        let resultsContainer = container.querySelector('.search-grid') || container.querySelector('#searchGrid');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.className = 'search-grid';
            resultsContainer.id = 'searchGrid';
            container.appendChild(resultsContainer);
        }
        
        // Clear results container and add results
        resultsContainer.innerHTML = '';
        
        results.forEach(user => {
            const userCard = this.createUserCard(user);
            resultsContainer.appendChild(userCard);
        });
        
        console.log('[SEARCH] Results displayed successfully in:', resultsContainer.className);
    }

    createUserCard(user) {
        const card = document.createElement('div');
        card.className = 'user-card simple-card';
        
        // Extract photo URL according to API documentation (MembreBlock structure)
        let photoUrl = null;
        
        // Приоритет 1: photos_v2 (PhotoBlockV2) - более новый формат
        if (user.photos_v2 && Array.isArray(user.photos_v2) && user.photos_v2.length > 0) {
            const photo = user.photos_v2[0];
            // Используем sq_middle (215x215px) для карточек поиска
            photoUrl = photo.sq_middle || photo.sq_430 || photo.normal || photo.sq_small;
        }
        // Приоритет 2: photos (PhotoBlock) - старый формат
        else if (user.photos && Array.isArray(user.photos) && user.photos.length > 0) {
            const photo = user.photos[0];
            // Используем url_middle (215x215px) для карточек поиска
            photoUrl = photo.url_middle || photo.url_big || photo.url_small;
        }
        
        console.log('[SEARCH] User photo data:', {
            pseudo: user.pseudo,
            photos_v2: user.photos_v2,
            photos: user.photos,
            selectedUrl: photoUrl
        });
        
        // Generate avatar - только фото или заглушка
        const avatarHtml = photoUrl ? 
            `<img src="${photoUrl}" alt="${user.pseudo}" class="user-avatar-simple" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
             <div class="user-avatar-placeholder" style="display: none;">${user.pseudo ? user.pseudo.charAt(0).toUpperCase() : 'U'}</div>` :
            `<div class="user-avatar-placeholder">${user.pseudo ? user.pseudo.charAt(0).toUpperCase() : 'U'}</div>`;
        
        // Добавляем больше информации благодаря profile_complete=1
        const age = user.age ? `, ${user.age}` : '';
        const location = user.ville || user.region || user.pays || '';
        const locationText = location ? `📍 ${location}` : '';
        
        card.innerHTML = `
            <div class="user-photo-container">
                ${avatarHtml}
            </div>
            <div class="user-info">
                <div class="user-nickname">
                    ${user.pseudo || 'Anonymous'}${age}
                </div>
                ${locationText ? `<div class="user-location">${locationText}</div>` : ''}
                ${user.description ? `<div class="user-description">${user.description.substring(0, 100)}${user.description.length > 100 ? '...' : ''}</div>` : ''}
            </div>
        `;
        
        return card;
    }
    
    calculateAge(birthDate) {
        if (!birthDate) return '';
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    async viewProfile(userId) {
        console.log('[SEARCH] Viewing profile:', userId);
        window.location.href = `user-profile.html?id=${userId}`;
    }

    async sendMessage(userId) {
        console.log('[SEARCH] Sending message to:', userId);
        
        try {
            // Add contact first
            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'add_contact',
                    session_id: this.authManager.sessionId,
                    id: this.authManager.currentUser.id,
                    contact_id: userId
                })
            });

            const result = await response.json();
            
            if (result.success) {
                // Redirect to messages
                window.location.href = `messages.html?contact=${userId}`;
            } else {
                console.error('[SEARCH] Failed to add contact:', result);
                alert('Failed to start conversation. Please try again.');
            }
        } catch (error) {
            console.error('[SEARCH] Error adding contact:', error);
            alert('An error occurred. Please try again.');
        }
    }

    clearFilters() {
        document.getElementById('searchName').value = '';
        document.getElementById('searchLocation').value = '';
        document.getElementById('ageMin').value = '18';
        document.getElementById('ageMax').value = '80';
        document.getElementById('searchGender').value = '';
        document.getElementById('withPhotos').checked = false;
        document.getElementById('onlineOnly').checked = false;
        
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalResults = 0;
        this.lastSearchParams = null;
        this.performSearch();
    }

    showLoading() {
        const container = document.getElementById('searchResults') || document.querySelector('.search-results');
        if (container) {
            // Скрываем блок "No results"
            const noResultsDiv = document.getElementById('noResults');
            if (noResultsDiv) {
                noResultsDiv.style.display = 'none';
            }
            
            // Показываем индикатор загрузки
            let loadingContainer = container.querySelector('.search-grid') || container.querySelector('#searchGrid');
            if (!loadingContainer) {
                loadingContainer = document.createElement('div');
                loadingContainer.className = 'search-grid';
                loadingContainer.id = 'searchGrid';
                container.appendChild(loadingContainer);
            }
            
            loadingContainer.innerHTML = `
                <div class="search-status loading-status">
                    <div class="loading-spinner"></div>
                    <h3>Searching...</h3>
                    <p>Finding profiles that match your criteria</p>
                </div>
            `;
        }
    }

    hideLoading() {
        // Индикатор загрузки будет заменен результатами в displayResults()
        console.log('[SEARCH] Hiding loading indicator');
    }

    showError(message) {
        const container = document.getElementById('searchResults');
        if (container) {
            container.innerHTML = `
                <div class="search-status no-results">
                    <div class="status-icon">⚠️</div>
                    <h3>Search Error</h3>
                    <p>${message}</p>
                    <button class="app-btn app-btn-primary" onclick="searchManager.performSearch()">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    updatePagination() {
        // Найдем или создадим контейнер пагинации
        let paginationContainer = document.getElementById('searchPagination');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'searchPagination';
            paginationContainer.className = 'search-pagination';
            
            const searchResults = document.getElementById('searchResults');
            if (searchResults) {
                searchResults.appendChild(paginationContainer);
            }
        }

        // Если только одна страница, скрываем пагинацию
        if (this.totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';
        
        let paginationHTML = '<div class="pagination-controls">';
        
        // Кнопка "Предыдущая"
        if (this.currentPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="searchManager.goToPage(${this.currentPage - 1})">← Previous</button>`;
        }
        
        // Номера страниц
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="searchManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === this.currentPage ? 'active' : '';
            paginationHTML += `<button class="pagination-btn ${activeClass}" onclick="searchManager.goToPage(${i})">${i}</button>`;
        }
        
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="searchManager.goToPage(${this.totalPages})">${this.totalPages}</button>`;
        }
        
        // Кнопка "Следующая"
        if (this.currentPage < this.totalPages) {
            paginationHTML += `<button class="pagination-btn" onclick="searchManager.goToPage(${this.currentPage + 1})">Next →</button>`;
        }
        
        paginationHTML += '</div>';
        paginationHTML += `<div class="pagination-info">Page ${this.currentPage} of ${this.totalPages}</div>`;
        
        paginationContainer.innerHTML = paginationHTML;
    }

    async goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage || this.isLoading) {
            return;
        }
        
        this.currentPage = page;
        
        // Используем последние параметры поиска
        if (this.lastSearchParams) {
            await this.performSearch(false); // false = это пагинация, не новый поиск
        }
    }

    async getCityId(cityName) {
        try {
            const queryParams = new URLSearchParams({
                session_id: window.authManager.sessionId,
                q: cityName,
                territory: 'city'
            });
            
            const fullUrl = `/api/spice-multi-test?endpoint=/ajax_api/getRegionsAutocomp&method=GET&${queryParams.toString()}`;
            console.log('[SEARCH] Getting city ID for:', cityName, fullUrl);
            
            const response = await fetch(fullUrl);
            const result = await response.json();
            
            console.log('[SEARCH] City lookup result:', result);
            
            if (result.success && result.data && result.data.result && result.data.result.length > 0) {
                const firstCity = result.data.result[0];
                const cityId = firstCity.id_ville || firstCity.id;
                console.log('[SEARCH] Found city ID:', cityId, 'for', firstCity.nom_ville || firstCity.name);
                return cityId;
            }
            
            return null;
        } catch (error) {
            console.error('[SEARCH] Error getting city ID:', error);
            return null;
        }
    }
}

// Initialize when page loads
let searchManager;
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth manager to be ready
    function initSearchManager(attempt = 1, maxAttempts = 10) {
        if (window.authManager && window.authManager.isLoggedIn) {
            console.log('[SEARCH] AuthManager ready, creating SearchManager instance');
            searchManager = new SearchManager();
        } else if (attempt < maxAttempts) {
            console.log(`[SEARCH] AuthManager not ready, retrying... (${attempt}/${maxAttempts})`);
            setTimeout(() => initSearchManager(attempt + 1, maxAttempts), 500);
        } else {
            console.error('[SEARCH] Failed to initialize SearchManager - AuthManager not ready');
            window.location.href = 'index.html';
        }
    }
    
    // Start initialization
    setTimeout(() => initSearchManager(), 100);
});
