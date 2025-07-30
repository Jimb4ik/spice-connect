// SpiceConnect Landing Page JavaScript - Updated v2.0
class SpiceLanding {
    constructor() {
        this.baseURL = '/api';
        this.currentProfiles = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        await this.loadLiveStats();
        await this.loadGenderFilters();
        await this.loadProfiles();
        this.setupEventListeners();
        this.startLiveUpdates();
    }

    // Load live statistics from API
    async loadLiveStats() {
        try {
            console.log('🔄 Loading live stats...');
            
            // Get site info and online count
            const siteInfoResponse = await fetch(`${this.baseURL}/spice-multi-test?endpoint=/index_api/index&method=GET`);
            
            if (!siteInfoResponse.ok) {
                throw new Error(`HTTP ${siteInfoResponse.status}: ${siteInfoResponse.statusText}`);
            }
            
            const siteInfo = await siteInfoResponse.json();
            
            if (siteInfo.success && siteInfo.data) {
                const onlineCount = siteInfo.data.nb_online || 1495;
                document.getElementById('onlineCount').textContent = this.formatNumber(onlineCount);
                document.getElementById('liveMemberCount').textContent = this.formatNumber(onlineCount * 30) + '+';
                
                console.log('✅ Live stats loaded:', { online: onlineCount });
            }
        } catch (error) {
            console.error('❌ Failed to load live stats:', error);
            // Show error instead of fallback
            document.getElementById('onlineCount').textContent = 'ERROR';
            document.getElementById('liveMemberCount').textContent = 'API ERROR';
            alert('API Error in loadLiveStats: ' + error.message);
        }
    }

    // Animate stats with demo data
    animateStats() {
        const baseOnline = 1485;
        const variation = Math.floor(Math.random() * 100);
        const finalOnline = baseOnline + variation;
        
        document.getElementById('onlineCount').textContent = this.formatNumber(finalOnline);
        document.getElementById('liveMemberCount').textContent = this.formatNumber(finalOnline * 30) + '+';
        
        // Update stats periodically
        setInterval(() => {
            const newVariation = Math.floor(Math.random() * 200) - 100;
            const newOnline = Math.max(1200, baseOnline + newVariation);
            document.getElementById('onlineCount').textContent = this.formatNumber(newOnline);
        }, 15000);
    }

    // Load gender options from API
    async loadGenderFilters() {
        try {
            console.log('🔄 Loading gender filters...');
            
            const response = await fetch(`${this.baseURL}/spice-multi-test?endpoint=/index_api/array/get/SEXE&method=GET`);
            const data = await response.json();
            
            if (data.success && data.data && data.data.result && data.data.result.sexe) {
                console.log('✅ Gender filters loaded:', data.data.result.sexe);
                // Gender filters are already in HTML, this confirms API works
            }
        } catch (error) {
            console.error('❌ Failed to load gender filters:', error);
        }
    }

    // Load real profiles from API
    async loadProfiles(country = null) {
        try {
            console.log('🔄 Loading profiles...');
            
            // Show loading state
            this.showProfilesLoading();
            
            const params = country ? `force_pays=${country}` : '';
            const response = await fetch(`${this.baseURL}/spice-multi-test?endpoint=/index_api/landing_module/profils_global&method=POST&${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.data && data.data.result && data.data.result.get_profils_global) {
                this.currentProfiles = data.data.result.get_profils_global;
                console.log('✅ Profiles loaded:', this.currentProfiles.length);
                this.renderProfiles();
            } else {
                console.warn('⚠️ No profiles data received');
                this.showNoProfiles();
            }
        } catch (error) {
            console.error('❌ Failed to load profiles:', error);
            // Show error instead of fallback
            alert('API Error in loadProfiles: ' + error.message);
            this.showNoProfiles();
        }
    }

    // Load demo profiles as fallback
    loadDemoProfiles() {
        console.log('🔄 Loading demo profiles...');
        
        this.currentProfiles = [
            {
                id: "demo1",
                pseudo: "Sophie_Paris",
                sexe1: "2",
                age: "28",
                city: "Paris",
                photo_nom_sqmiddle: "https://images.unsplash.com/photo-1494790108755-2616b9881088?w=300&h=300&fit=crop&crop=face"
            },
            {
                id: "demo2", 
                pseudo: "Alex_Lyon",
                sexe1: "1",
                age: "32",
                city: "Lyon",
                photo_nom_sqmiddle: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face"
            },
            {
                id: "demo3",
                pseudo: "Emma_Nice",
                sexe1: "2", 
                age: "26",
                city: "Nice",
                photo_nom_sqmiddle: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face"
            },
            {
                id: "demo4",
                pseudo: "Lucas_Bordeaux",
                sexe1: "1",
                age: "29", 
                city: "Bordeaux",
                photo_nom_sqmiddle: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face"
            },
            {
                id: "demo5",
                pseudo: "Chloe_Marseille", 
                sexe1: "2",
                age: "31",
                city: "Marseille",
                photo_nom_sqmiddle: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face"
            },
            {
                id: "demo6",
                pseudo: "Thomas_Toulouse",
                sexe1: "1",
                age: "27",
                city: "Toulouse", 
                photo_nom_sqmiddle: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face"
            }
        ];
        
        console.log('✅ Demo profiles loaded:', this.currentProfiles.length);
        this.renderProfiles();
    }

    // Render profiles in the grid
    renderProfiles() {
        const grid = document.getElementById('profilesGrid');
        
        // Filter profiles based on current filter
        let filteredProfiles = this.currentProfiles;
        if (this.currentFilter !== 'all') {
            filteredProfiles = this.currentProfiles.filter(profile => 
                profile.sexe1 === this.currentFilter
            );
        }
        
        // Take first 6 profiles for display
        const displayProfiles = filteredProfiles.slice(0, 6);
        
        grid.innerHTML = displayProfiles.map(profile => this.createProfileCard(profile)).join('');
        
        // Add click handlers
        grid.querySelectorAll('.profile-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.showProfileModal(displayProfiles[index]);
            });
        });
        
        // Add intersection observer to new profile cards for animation
        if (window.profileObserver) {
            grid.querySelectorAll('.profile-card').forEach(card => {
                window.profileObserver.observe(card);
            });
        }
    }

    // Create individual profile card HTML
    createProfileCard(profile) {
        const age = profile.age || 25;
        const city = profile.city || 'Unknown';
        const pseudo = profile.pseudo || 'Anonymous';
        const photoUrl = profile.photo_nom_sqmiddle || profile.photo_nom_sqsmall || 'https://via.placeholder.com/300x300?text=No+Photo';
        const genderIcon = profile.sexe1 === '1' ? '♂️' : '♀️';
        
        return `
            <div class="profile-card" data-profile-id="${profile.id}">
                <img src="${photoUrl}" alt="${pseudo}" class="profile-image" 
                     onerror="this.src='https://via.placeholder.com/300x300?text=Photo+Unavailable'">
                <div class="profile-info">
                    <div class="profile-name">${genderIcon} ${pseudo}</div>
                    <div class="profile-details">${age} years old</div>
                    <div class="profile-location">📍 ${city}</div>
                </div>
            </div>
        `;
    }

    // Show loading state
    showProfilesLoading() {
        const grid = document.getElementById('profilesGrid');
        grid.innerHTML = Array(6).fill().map(() => `
            <div class="profile-skeleton">
                <div class="skeleton-image"></div>
                <div class="profile-info">
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text short"></div>
                    <div class="skeleton-text short"></div>
                </div>
            </div>
        `).join('');
    }

    // Show no profiles message
    showNoProfiles() {
        const grid = document.getElementById('profilesGrid');
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <h3>No profiles found</h3>
                <p>Try changing your filter or check back later.</p>
            </div>
        `;
    }

    // Show error message
    showProfilesError() {
        const grid = document.getElementById('profilesGrid');
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <h3>Oops! Something went wrong</h3>
                <p>We're having trouble loading profiles. Please try again later.</p>
                <button onclick="spiceLanding.loadProfiles()" class="btn-primary" style="margin-top: 20px;">
                    Try Again
                </button>
            </div>
        `;
    }

    // Show profile modal (placeholder)
    showProfileModal(profile) {
        alert(`Profile: ${profile.pseudo}\nAge: ${profile.age}\nLocation: ${profile.city}\n\nClick "Join Now" to see full profile and send a message!`);
    }

    // Setup event listeners
    setupEventListeners() {
        // Gender filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update current filter and re-render
                this.currentFilter = e.target.dataset.gender;
                this.renderProfiles();
            });
        });

        // Load more profiles button
        document.getElementById('loadMoreProfiles')?.addEventListener('click', () => {
            // Load profiles from different country
            const countries = [64, 724, 840]; // France, Spain, USA
            const randomCountry = countries[Math.floor(Math.random() * countries.length)];
            this.loadProfiles(randomCountry);
        });

        // Registration form
        document.getElementById('registrationForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });

        // Navigation buttons
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            window.location.href = 'index.html#login';
        });

        document.getElementById('signupBtn')?.addEventListener('click', () => {
            this.scrollToRegistration();
        });

        document.getElementById('startMatchingBtn')?.addEventListener('click', () => {
            this.scrollToRegistration();
        });

        document.getElementById('browseProfilesBtn')?.addEventListener('click', () => {
            document.getElementById('profiles').scrollIntoView({ behavior: 'smooth' });
        });

        document.getElementById('joinNowBtn')?.addEventListener('click', () => {
            this.scrollToRegistration();
        });

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // Handle registration form submission
    handleRegistration() {
        alert('Registration feature coming soon! Join our waiting list to be notified when we launch.');
        // In a real app, this would submit to the registration API
    }

    // Scroll to registration section
    scrollToRegistration() {
        document.querySelector('.cta-section').scrollIntoView({ behavior: 'smooth' });
    }

    // Start live updates (every 30 seconds)
    startLiveUpdates() {
        setInterval(() => {
            this.loadLiveStats();
        }, 30000);
    }

    // Format numbers for display
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Add smooth scroll behavior to navbar on scroll
    handleNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    }
}

// Initialize the landing page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 SpiceConnect Landing Page initializing v2.2...');
    window.spiceLanding = new SpiceLanding();
    
    // Handle navbar background on scroll
    window.addEventListener('scroll', () => {
        window.spiceLanding.handleNavbarScroll();
    });
});

// Add some interactive animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

// Make observer global so it can be used in profile rendering
window.profileObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.feature-card, .profile-card, .testimonial-card');
    animatedElements.forEach(el => window.profileObserver.observe(el));
});

// Add some CSS animations via JavaScript
const style = document.createElement('style');
style.textContent = `
    .feature-card, .profile-card, .testimonial-card {
        animation: fadeInUp 0.6s ease forwards;
        animation-play-state: paused;
        opacity: 0;
        transform: translateY(30px);
    }
    
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .hero-stats .stat-item {
        animation: countUp 2s ease-out;
    }
    
    @keyframes countUp {
        from { transform: scale(0); }
        to { transform: scale(1); }
    }
`;
document.head.appendChild(style);