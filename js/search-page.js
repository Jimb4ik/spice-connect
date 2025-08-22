class SearchManager {
    constructor() {
        this.authManager = new AuthManager();
        this.currentPage = 1;
        this.isLoading = false;
        this.init();
    }

    async init() {
        console.log('[SEARCH] Initializing search manager');
        
        // Wait for auth to be ready
        await this.authManager.waitForAuth();
        
        if (!this.authManager.isLoggedIn) {
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
            
            const response = await fetch('/api/spice-multi-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint: '/index_api/search',
                    method: 'POST',
                    data: {
                        session_id: this.authManager.sessionId,
                        id: this.authManager.currentUser.id,
                        ...searchParams
                    }
                })
            });

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
        
        // Only with photos
        const withPhotos = document.getElementById('withPhotos')?.checked;
        if (withPhotos) {
            params.is_photo = 1;
        }
        
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
        card.className = 'user-card';
        
        // Generate avatar
        const avatarHtml = user.photo_profil_url ? 
            `<img src="${user.photo_profil_url}" alt="${user.pseudo}" class="user-avatar">` :
            `<div class="user-avatar avatar-placeholder">${user.pseudo ? user.pseudo.charAt(0).toUpperCase() : 'U'}</div>`;
        
        // Calculate age
        const age = user.age || (user.year ? new Date().getFullYear() - user.year : '');
        
        // Online status
        const onlineStatus = user.connected == 1 ? 
            '<span class="online-indicator">🟢 Online</span>' : '';
        
        card.innerHTML = `
            ${avatarHtml}
            <div class="user-info">
                <h4 class="user-name">${user.pseudo || 'Anonymous'}</h4>
                ${age ? `<p class="user-age">${age} years old</p>` : ''}
                ${user.ville ? `<p class="user-location">📍 ${user.ville}</p>` : ''}
                ${onlineStatus}
                ${user.description ? `<p class="user-description">${user.description.substring(0, 100)}${user.description.length > 100 ? '...' : ''}</p>` : ''}
            </div>
            <div class="user-actions">
                <button class="app-btn app-btn-primary app-btn-sm" onclick="searchManager.viewProfile(${user.id})">
                    View Profile
                </button>
                <button class="app-btn app-btn-outline app-btn-sm" onclick="searchManager.sendMessage(${user.id})">
                    Message
                </button>
            </div>
        `;
        
        return card;
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
    searchManager = new SearchManager();
});
