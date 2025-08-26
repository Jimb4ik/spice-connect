// Lightweight app navigation helper (stub)
// Ensures the referenced script exists to avoid MIME type errors

(function () {
    if (typeof window === 'undefined') return;

    document.addEventListener('DOMContentLoaded', function () {
        try {
            // Optionally enhance active nav state based on current path
            var path = window.location.pathname || '';
            var links = document.querySelectorAll('nav a, header a');
            for (var i = 0; i < links.length; i++) {
                var link = links[i];
                if (!link || !link.getAttribute) continue;
                var href = link.getAttribute('href') || '';
                if (href && path.endsWith(href)) {
                    link.classList.add('active');
                }
            }
        } catch (err) {
            console.warn('[APP-NAV] init warning:', err && err.message);
        }
    });
})();


