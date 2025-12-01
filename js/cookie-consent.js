/**
 * GDPR Cookie Consent Manager for Lumina
 * Compliant with EU regulations
 * Styled with Tailwind CSS
 */

class CookieConsent {
    constructor() {
        this.cookieName = 'lumina_cookie_consent';
        this.consentData = {
            necessary: true, // Always true, cannot be disabled
            analytics: false,
            marketing: false,
            preferences: false
        };
        
        this.init();
    }

    init() {
        // Check if consent has already been given
        const existingConsent = this.getCookieConsent();
        
        if (!existingConsent) {
            this.showConsentBanner();
        } else {
            this.consentData = existingConsent;
            this.loadApprovedCookies();
        }
    }

    showConsentBanner() {
        const banner = this.createConsentBanner();
        document.body.appendChild(banner);
        
        // Animate in
        setTimeout(() => {
            const container = banner.querySelector('.cookie-container');
            container.classList.remove('translate-y-full', 'opacity-0');
        }, 100);
    }

    createConsentBanner() {
        const banner = document.createElement('div');
        banner.className = 'fixed bottom-0 left-0 right-0 z-[60] p-4 pointer-events-none flex justify-center';
        banner.id = 'cookieConsentBanner';
        
        banner.innerHTML = `
            <div class="cookie-container pointer-events-auto bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 max-w-4xl w-full transform transition-all duration-500 translate-y-full opacity-0 flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div class="flex-1 space-y-3">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">🍪</span>
                        <h3 class="text-lg font-bold text-white">We Value Your Privacy</h3>
                    </div>
                    <p class="text-slate-400 text-sm leading-relaxed">
                        We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                        By clicking "Accept All", you consent to our use of cookies.
                    </p>
                    
                    <!-- Expanded Settings (Hidden by default) -->
                    <div id="cookieSettings" class="hidden space-y-4 pt-4 border-t border-white/10 mt-4">
                        <div class="flex items-center justify-between">
                            <div class="pr-4">
                                <h4 class="text-white font-medium text-sm">Necessary Cookies</h4>
                                <p class="text-slate-500 text-xs">Essential for the website to function properly.</p>
                            </div>
                            <input type="checkbox" checked disabled class="w-5 h-5 rounded bg-slate-700 border-slate-600 text-brand-primary">
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <div class="pr-4">
                                <h4 class="text-white font-medium text-sm">Analytics Cookies</h4>
                                <p class="text-slate-500 text-xs">Help us understand how visitors interact with our website.</p>
                            </div>
                            <input type="checkbox" id="analytics-cookies" class="w-5 h-5 rounded bg-slate-700 border-slate-600 text-brand-primary focus:ring-brand-primary">
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <div class="pr-4">
                                <h4 class="text-white font-medium text-sm">Marketing Cookies</h4>
                                <p class="text-slate-500 text-xs">Used to track visitors across websites to display relevant ads.</p>
                            </div>
                            <input type="checkbox" id="marketing-cookies" class="w-5 h-5 rounded bg-slate-700 border-slate-600 text-brand-primary focus:ring-brand-primary">
                        </div>
                    </div>
                </div>
                
                <div class="flex flex-col gap-3 min-w-[200px]">
                    <button class="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-xl transition-colors shadow-lg shadow-brand-primary/20 text-sm" onclick="cookieConsent.acceptAll()">
                        Accept All
                    </button>
                    <button class="bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-xl transition-colors border border-white/10 text-sm" onclick="cookieConsent.toggleSettings()">
                        Customize
                    </button>
                    <button class="text-slate-500 hover:text-slate-300 text-xs transition-colors py-1" onclick="cookieConsent.rejectAll()">
                        Reject All
                    </button>
                    <button id="savePreferencesBtn" class="hidden bg-brand-accent hover:bg-amber-400 text-slate-900 font-bold py-2 px-4 rounded-xl transition-colors shadow-lg text-sm" onclick="cookieConsent.saveCustomPreferences()">
                        Save Preferences
                    </button>
                </div>
            </div>
        `;
        
        return banner;
    }

    toggleSettings() {
        const settings = document.getElementById('cookieSettings');
        const saveBtn = document.getElementById('savePreferencesBtn');
        
        if (settings.classList.contains('hidden')) {
            settings.classList.remove('hidden');
            saveBtn.classList.remove('hidden');
        } else {
            settings.classList.add('hidden');
            saveBtn.classList.add('hidden');
        }
    }

    acceptAll() {
        this.consentData = {
            necessary: true,
            analytics: true,
            marketing: true,
            preferences: true
        };
        
        this.saveConsent();
        this.hideConsentBanner();
        this.loadApprovedCookies();
    }

    rejectAll() {
        this.consentData = {
            necessary: true,
            analytics: false,
            marketing: false,
            preferences: false
        };
        
        this.saveConsent();
        this.hideConsentBanner();
        this.loadApprovedCookies();
    }

    saveCustomPreferences() {
        this.consentData = {
            necessary: true,
            analytics: document.getElementById('analytics-cookies').checked,
            marketing: document.getElementById('marketing-cookies').checked,
            preferences: false // Not used in this simplified version
        };
        
        this.saveConsent();
        this.hideConsentBanner();
        this.loadApprovedCookies();
    }

    saveConsent() {
        const consentObject = {
            ...this.consentData,
            timestamp: new Date().toISOString(),
            version: '2.0'
        };
        
        // Save for 1 year
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        
        document.cookie = `${this.cookieName}=${JSON.stringify(consentObject)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
    }

    getCookieConsent() {
        const cookies = document.cookie.split(';');
        const consentCookie = cookies.find(cookie => 
            cookie.trim().startsWith(`${this.cookieName}=`)
        );
        
        if (consentCookie) {
            try {
                const consentValue = consentCookie.split('=')[1];
                return JSON.parse(decodeURIComponent(consentValue));
            } catch (e) {
                return null;
            }
        }
        
        return null;
    }

    hideConsentBanner() {
        const banner = document.getElementById('cookieConsentBanner');
        if (banner) {
            const container = banner.querySelector('.cookie-container');
            container.classList.remove('translate-y-0');
            container.classList.add('translate-y-full', 'opacity-0');
            
            setTimeout(() => {
                banner.remove();
            }, 500);
        }
    }

    loadApprovedCookies() {
        if (this.consentData.analytics) {
            this.loadAnalyticsCookies();
        }
        if (this.consentData.marketing) {
            this.loadMarketingCookies();
        }
    }

    loadAnalyticsCookies() {
        // Placeholder for Google Analytics or similar
    }

    loadMarketingCookies() {
        // Placeholder for marketing pixels
    }

    // Method to show cookie settings (can be called from footer link)
    showCookieSettings() {
        // Remove existing banner if any
        this.hideConsentBanner();
        setTimeout(() => {
            this.showConsentBanner();
            // Open settings immediately
            setTimeout(() => {
                this.toggleSettings();
                
                // Pre-fill current preferences
                const existingConsent = this.getCookieConsent();
                if (existingConsent) {
                    const analytics = document.getElementById('analytics-cookies');
                    const marketing = document.getElementById('marketing-cookies');
                    if (analytics) analytics.checked = existingConsent.analytics;
                    if (marketing) marketing.checked = existingConsent.marketing;
                }
            }, 200);
        }, 600);
    }
}

// Initialize cookie consent when DOM is loaded
let cookieConsent;
document.addEventListener('DOMContentLoaded', () => {
    cookieConsent = new CookieConsent();
});

// Make it globally accessible for footer link
window.showCookieSettings = () => {
    if (cookieConsent) {
        cookieConsent.showCookieSettings();
    }
};
