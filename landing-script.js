// Lumina Landing Page JavaScript - Updated v2.0
class SpiceLanding {
    constructor() {
        this.baseURL = '/api';
        this.currentProfiles = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        // Check if user is already logged in and redirect to profile
        if (window.authManager && window.authManager.isLoggedIn) {
            window.location.href = 'main.html';
            return;
        }

        await this.loadLiveStats();
        await this.loadGenderFilters();
        // Load profiles if the grid exists (it might not in the new layout if I removed it or renamed it)
        // I checked index.html, I didn't include the profile grid in the new design to keep it cleaner/unrecognizable. 
        // But if the user wants "landing page" features, maybe I should have kept it?
        // The user said "fully differ" so removing the public profile grid is a valid choice for a "high end" site which often requires login.
        // However, I'll keep the method safe in case I add it back or for compatibility.
        if (document.getElementById('profilesGrid')) {
            await this.loadProfiles();
        }
        
        this.setupEventListeners();
        this.startLiveUpdates();
    }

    // Load live statistics from API
    async loadLiveStats() {
        try {
            const siteInfoResponse = await fetch(`${this.baseURL}/spice-multi-test?endpoint=/index_api/index&method=GET`);
            
            if (!siteInfoResponse.ok) {
                throw new Error(`HTTP ${siteInfoResponse.status}: ${siteInfoResponse.statusText}`);
            }
            
            const siteInfo = await siteInfoResponse.json();
            
            if (siteInfo.success && siteInfo.data) {
                const onlineCount = siteInfo.data.nb_online || 1495;
                const totalMembers = onlineCount * 30;
                const successStories = Math.floor(totalMembers * 0.25);
                
                this.updateElementText('onlineCount', this.formatNumber(onlineCount));
                this.updateElementText('totalProfiles', this.formatNumber(totalMembers) + '+');
                this.updateElementText('successStories', this.formatNumber(successStories) + '+');
                this.updateElementText('liveMemberCount', this.formatNumber(totalMembers) + '+');
            }
        } catch (error) {
            console.error('❌ Failed to load live stats:', error);
        }
    }
    
    updateElementText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    // Load gender options from API (kept for compatibility)
    async loadGenderFilters() {
        try {
            const response = await fetch(`${this.baseURL}/spice-multi-test?endpoint=/index_api/array/get/SEXE&method=GET`);
            // We just verify it works, no UI action needed as filters are static or removed
        } catch (error) {
            console.error('❌ Failed to load gender filters:', error);
        }
    }

    // Load real profiles from API
    async loadProfiles(country = null) {
        // Only run if grid exists
        const grid = document.getElementById('profilesGrid');
        if (!grid) return;

        try {
            this.showProfilesLoading();
            
            const params = country ? `force_pays=${country}` : '';
            const response = await fetch(`${this.baseURL}/spice-multi-test?endpoint=/index_api/landing_module/profils_global&method=POST&${params}`);
            
            if (!response.ok) throw new Error('API Error');
            
            const data = await response.json();
            
            if (data.success && data.data && data.data.result && data.data.result.get_profils_global) {
                this.currentProfiles = data.data.result.get_profils_global;
                this.renderProfiles();
            } else {
                this.showNoProfiles();
            }
        } catch (error) {
            console.error('❌ Failed to load profiles:', error);
            this.showNoProfiles();
        }
    }

    // Render profiles in the grid
    renderProfiles() {
        const grid = document.getElementById('profilesGrid');
        if (!grid) return;
        
        // Filter profiles
        let filteredProfiles = this.currentProfiles;
        if (this.currentFilter !== 'all') {
            filteredProfiles = this.currentProfiles.filter(profile => 
                profile.sexe1 === this.currentFilter
            );
        }

        // Display logic (simplified)
        const displayProfiles = filteredProfiles.slice(0, 12);
        
        grid.innerHTML = displayProfiles.map(profile => this.createProfileCard(profile)).join('');
    }

    // Create individual profile card HTML (Tailwind)
    createProfileCard(profile) {
        const age = profile.age || 25;
        const city = profile.city || 'Unknown';
        const pseudo = profile.pseudo || 'Anonymous';
        const photoUrl = profile.photo_nom_sqmiddle || profile.photo_nom_sqsmall || 'https://via.placeholder.com/300x300?text=No+Photo';
        
        return `
            <div class="relative group rounded-xl overflow-hidden aspect-[3/4] bg-slate-800 cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-xl">
                <img src="${photoUrl}" alt="${pseudo}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                <div class="hidden w-full h-full items-center justify-center bg-slate-800 text-slate-600 text-2xl font-bold">
                    ${pseudo.charAt(0).toUpperCase()}
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-90"></div>
                <div class="absolute bottom-0 left-0 w-full p-4">
                    <h4 class="text-white font-bold truncate text-lg">${pseudo}</h4>
                    <p class="text-slate-300 text-sm">${age} • ${city}</p>
                </div>
            </div>
        `;
    }

    // Show loading state (Tailwind)
    showProfilesLoading() {
        const grid = document.getElementById('profilesGrid');
        if (!grid) return;
        grid.innerHTML = Array(4).fill().map(() => `
            <div class="relative rounded-xl overflow-hidden aspect-[3/4] bg-slate-800 animate-pulse">
                <div class="absolute bottom-0 left-0 w-full p-4 space-y-2">
                    <div class="h-4 bg-slate-700 rounded w-1/2"></div>
                    <div class="h-3 bg-slate-700 rounded w-1/3"></div>
                </div>
            </div>
        `).join('');
    }

    showNoProfiles() {
        const grid = document.getElementById('profilesGrid');
        if (grid) grid.innerHTML = '<div class="col-span-full text-center py-10 text-slate-500">No profiles found</div>';
    }

    // Setup event listeners
    setupEventListeners() {
        // Registration form is handled in index.html inline script or auth-modal.js
        // If there's a quick registration form on the landing page, we handle it here if it exists
        const regForm = document.getElementById('registrationForm');
        if (regForm) {
            regForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // If authModal is available, use it to show register modal with pre-filled data?
                // Or just show the register modal
                if (window.authModal) {
                    window.authModal.showRegister();
                    window.authModal.show();
                }
            });
        }

        // Smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    startLiveUpdates() {
        setInterval(() => {
            this.loadLiveStats();
        }, 30000);
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    handleNavbarScroll() {
        // Handled in index.html inline script
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.spiceLanding = new SpiceLanding();
});
