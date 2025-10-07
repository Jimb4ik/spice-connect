/**
 * GDPR Cookie Consent Manager
 * Compliant with EU regulations
 */

class CookieConsent {
    constructor() {
        this.cookieName = 'lavrilo_cookie_consent';
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
        
        // Add backdrop blur effect
        document.body.classList.add('cookie-consent-active');
        
        // Animate in
        setTimeout(() => {
            banner.classList.add('show');
        }, 100);
    }

    createConsentBanner() {
        const banner = document.createElement('div');
        banner.className = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-consent-overlay"></div>
            <div class="cookie-consent-modal">
                <div class="cookie-consent-header">
                    <h3>🍪 We Value Your Privacy</h3>
                    <p>We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.</p>
                </div>
                
                <div class="cookie-consent-details">
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <label class="cookie-switch">
                                <input type="checkbox" checked disabled>
                                <span class="cookie-slider"></span>
                            </label>
                            <div class="cookie-category-info">
                                <h4>Necessary Cookies</h4>
                                <p>Essential for the website to function properly. Cannot be disabled.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <label class="cookie-switch">
                                <input type="checkbox" id="analytics-cookies">
                                <span class="cookie-slider"></span>
                            </label>
                            <div class="cookie-category-info">
                                <h4>Analytics Cookies</h4>
                                <p>Help us understand how visitors interact with our website by collecting and reporting information anonymously.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <label class="cookie-switch">
                                <input type="checkbox" id="marketing-cookies">
                                <span class="cookie-slider"></span>
                            </label>
                            <div class="cookie-category-info">
                                <h4>Marketing Cookies</h4>
                                <p>Used to track visitors across websites to display relevant and engaging advertisements.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <label class="cookie-switch">
                                <input type="checkbox" id="preferences-cookies">
                                <span class="cookie-slider"></span>
                            </label>
                            <div class="cookie-category-info">
                                <h4>Preference Cookies</h4>
                                <p>Enable the website to remember information that changes how it behaves or looks, like your preferred language.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="cookie-consent-actions">
                    <button class="btn-cookie btn-cookie-reject" onclick="cookieConsent.rejectAll()">
                        Reject All
                    </button>
                    <button class="btn-cookie btn-cookie-customize" onclick="cookieConsent.saveCustomPreferences()">
                        Save Preferences
                    </button>
                    <button class="btn-cookie btn-cookie-accept" onclick="cookieConsent.acceptAll()">
                        Accept All
                    </button>
                </div>
                
                <div class="cookie-consent-footer">
                    <p>You can change your preferences at any time by clicking the cookie settings link in our footer. 
                    For more information, please read our <a href="privacy.html" target="_blank">Privacy Policy</a> and 
                    <a href="cookies.html" target="_blank">Cookie Policy</a>.</p>
                </div>
            </div>
        `;
        
        return banner;
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
            preferences: document.getElementById('preferences-cookies').checked
        };
        
        this.saveConsent();
        this.hideConsentBanner();
        this.loadApprovedCookies();
    }

    saveConsent() {
        const consentObject = {
            ...this.consentData,
            timestamp: new Date().toISOString(),
            version: '1.0'
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
        const banner = document.querySelector('.cookie-consent-banner');
        if (banner) {
            banner.classList.remove('show');
            document.body.classList.remove('cookie-consent-active');
            
            setTimeout(() => {
                banner.remove();
            }, 300);
        }
    }

    loadApprovedCookies() {
        // Load analytics cookies (Google Analytics, etc.)
        if (this.consentData.analytics) {
            this.loadAnalyticsCookies();
        }
        
        // Load marketing cookies (Facebook Pixel, etc.)
        if (this.consentData.marketing) {
            this.loadMarketingCookies();
        }
        
        // Load preference cookies
        if (this.consentData.preferences) {
            this.loadPreferenceCookies();
        }
    }

    loadAnalyticsCookies() {
        // Example: Google Analytics
        // console.log('Loading analytics cookies...');
        // gtag('config', 'GA_MEASUREMENT_ID');
    }

    loadMarketingCookies() {
        // Example: Facebook Pixel
        // console.log('Loading marketing cookies...');
        // fbq('init', 'FACEBOOK_PIXEL_ID');
    }

    loadPreferenceCookies() {
        // Example: Language preferences, theme preferences
        // console.log('Loading preference cookies...');
    }

    // Method to show cookie settings (can be called from footer link)
    showCookieSettings() {
        this.showConsentBanner();
        
        // Pre-fill current preferences
        const existingConsent = this.getCookieConsent();
        if (existingConsent) {
            document.getElementById('analytics-cookies').checked = existingConsent.analytics;
            document.getElementById('marketing-cookies').checked = existingConsent.marketing;
            document.getElementById('preferences-cookies').checked = existingConsent.preferences;
        }
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
