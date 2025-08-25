class SearchManager {
    constructor() {
        this.currentPage = 1;
        this.isLoading = false;
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
        await this.performSearch();
    }

    async performSearch() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const searchParams = this.getSearchParams();
            console.log('[SEARCH] Search params:', searchParams);
            
            // Build query string for search API
            const queryParams = new URLSearchParams({
                session_id: window.authManager.sessionId,
                get_picture_430: 1, // Добавляем параметр для получения photos_v2
                ...searchParams
            });
            
            const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/search&method=POST&${queryParams.toString()}`);

            const result = await response.json();
            console.log('[SEARCH] Search result:', result);

            if (result.success && result.data && result.data.result) {
                this.displayResults(result.data.result, result.data.total || 0);
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
        
        // Name search
        const searchName = document.getElementById('searchName')?.value?.trim();
        if (searchName) {
            params.nick = searchName;
        }
        
        // Location search
        const searchLocation = document.getElementById('searchLocation')?.value?.trim();
        if (searchLocation) {
            // For now, just search by name if location is provided
            // In a real implementation, you'd need to resolve location to id_ville
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
        
        // Only with photos - по умолчанию показываем только пользователей с фото
        params.is_photo = 1;
        
        // Online only
        const onlineOnly = document.getElementById('onlineOnly')?.checked;
        if (onlineOnly) {
            params.is_online = 1;
        }
        
        // Page
        params.page = this.currentPage;
        
        return params;
    }

    displayResults(results, total) {
        const container = document.getElementById('searchResults');
        const statusDiv = document.querySelector('.search-status');
        
        if (!container) return;
        
        if (!results || results.length === 0) {
            container.innerHTML = `
                <div class="search-status no-results">
                    <div class="status-icon">🔍</div>
                    <h3>No results found</h3>
                    <p>Try adjusting your search filters</p>
                    <button class="app-btn app-btn-primary" onclick="window.location.href='discover.html'">
                        Browse All Profiles
                    </button>
                </div>
            `;
            return;
        }
        
        // Update status
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="status-icon">✨</div>
                <h3>Found ${total} profiles</h3>
                <p>Showing ${results.length} results</p>
            `;
        }
        
        // Create results grid
        const resultsGrid = document.createElement('div');
        resultsGrid.className = 'results-grid';
        
        results.forEach(user => {
            const userCard = this.createUserCard(user);
            resultsGrid.appendChild(userCard);
        });
        
        container.innerHTML = '';
        if (statusDiv) container.appendChild(statusDiv);
        container.appendChild(resultsGrid);
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
        
        // Только фото и ник - никаких кнопок и дополнительной информации
        card.innerHTML = `
            <div class="user-photo-container">
                ${avatarHtml}
            </div>
            <div class="user-nickname">
                ${user.pseudo || 'Anonymous'}
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
        this.performSearch();
    }

    showLoading() {
        const container = document.getElementById('searchResults');
        if (container) {
            container.innerHTML = `
                <div class="search-status">
                    <div class="loading-spinner"></div>
                    <h3>Searching...</h3>
                    <p>Finding profiles that match your criteria</p>
                </div>
            `;
        }
    }

    hideLoading() {
        // Loading will be replaced by results
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
