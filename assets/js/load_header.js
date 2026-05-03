// 1. On lance la requête de récupération du header IMMÉDIATEMENT 
// (en arrière-plan, sans attendre que le reste de la page finisse de charger)
const civicPlusBasePath = getCivicPlusBasePathFromScript('load_header.js');
const civicPlusThemeStorageKey = 'civicplus-theme';
const civicPlusDarkModeCssVersion = '20260502-2';

loadCivicPlusDarkModeStyles();
applyCivicPlusTheme(getStoredCivicPlusTheme());

const headerPromise = fetch(`${civicPlusBasePath}/Modules/E-Administration/view/header.php`)
    .then(response => {
        if (!response.ok) throw new Error("Erreur de chargement du Header");
        return response.text();
    });

document.addEventListener("DOMContentLoaded", function() {
    const headerContainer = document.getElementById("header-container");
    
    // Si le conteneur n'existe pas sur la page, on ne fait rien
    if (!headerContainer) return;

    // 2. Dès que la balise div est prête dans le HTML, on y injecte la réponse pré-chargée
    headerPromise
        .then(html => {
            // Injection du HTML dans la balise div
            headerContainer.innerHTML = html;
            
            // Une fois injecté, on gère la classe Active
            marquerLienActif();
            
            // Réinitialiser les événements du menu mobile de votre template
            initMobileNav();
            initCivicPlusThemeToggle();
        })
        .catch(error => console.error("Problème avec le Header dynamique :", error));
});

function loadCivicPlusDarkModeStyles() {
    const href = `${civicPlusBasePath}/assets/css/dark-mode.css?v=${civicPlusDarkModeCssVersion}`;
    const existing = document.getElementById('civicplus-dark-mode-css');

    if (existing) {
        existing.href = href;
        return;
    }

    const link = document.createElement('link');
    link.id = 'civicplus-dark-mode-css';
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}

function getStoredCivicPlusTheme() {
    try {
        return localStorage.getItem(civicPlusThemeStorageKey) || 'light';
    } catch (error) {
        return 'light';
    }
}

function setStoredCivicPlusTheme(theme) {
    try {
        localStorage.setItem(civicPlusThemeStorageKey, theme);
    } catch (error) {
        // Ignore storage errors; the visible theme can still change for this page.
    }
}

function applyCivicPlusTheme(theme) {
    const isDark = theme === 'dark';

    document.documentElement.classList.toggle('dark-mode', isDark);
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');

    const applyBodyTheme = () => {
        document.body.classList.toggle('dark-mode', isDark);
        updateCivicPlusThemeToggle(isDark);
    };

    if (document.body) {
        applyBodyTheme();
    } else {
        document.addEventListener('DOMContentLoaded', applyBodyTheme, { once: true });
    }
}

function initCivicPlusThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    const isDark = getStoredCivicPlusTheme() === 'dark';

    updateCivicPlusThemeToggle(isDark);

    if (!themeBtn || themeBtn.dataset.themeReady === 'true') return;

    themeBtn.dataset.themeReady = 'true';
    themeBtn.addEventListener('click', function(event) {
        event.preventDefault();

        const nextTheme = document.documentElement.classList.contains('dark-mode') ? 'light' : 'dark';
        setStoredCivicPlusTheme(nextTheme);
        applyCivicPlusTheme(nextTheme);
    });
}

function updateCivicPlusThemeToggle(isDark) {
    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');

    if (icon) {
        icon.className = isDark ? 'bi bi-sun me-2 text-warning' : 'bi bi-moon-stars me-2 text-dark';
    }

    if (text) {
        text.innerText = isDark ? 'Mode Clair' : 'Mode Sombre';
    }
}

function marquerLienActif() {
    const currentPath = window.location.pathname.toLowerCase();
    const currentHash = window.location.hash || '#hero';
    const navLinks = document.querySelectorAll('#navmenu ul li a');

    navLinks.forEach(link => {
        const url = new URL(link.href);
        const linkPath = url.pathname.toLowerCase();
        const linkHash = url.hash;

        link.classList.remove('active');

        // Cas 1: Navigation par Hash (sur la page Index)
        if (currentPath.endsWith('index.html') || currentPath.endsWith('/')) {
            if (linkHash === currentHash) {
                link.classList.add('active');
            }
        } 
        // Cas 2: Navigation par Page (Modules / Services)
        else {
            // Si on est dans un module (ex: /Modules/Transport/...)
            // on allume le bouton "Services"
            if (currentPath.includes('/modules/') && !currentPath.includes('citoyen_profile.html')) {
                if (link.textContent.trim() === 'Services') {
                    link.classList.add('active');
                }
            } else if (currentPath.includes(linkPath) && !linkHash) {
                link.classList.add('active');
            }
        }
    });
}

// Gestion dynamique du scroll pour allumer les sections de l'index
window.addEventListener('scroll', () => {
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        const sections = ['hero', 'about', 'services', 'team', 'contact'];
        let currentSection = 'hero';

        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section && window.scrollY >= (section.offsetTop - 150)) {
                currentSection = '#' + id;
            }
        });

        const navLinks = document.querySelectorAll('#navmenu ul li a');
        navLinks.forEach(link => {
            const linkHash = new URL(link.href).hash;
            link.classList.toggle('active', linkHash === currentSection);
        });
    }
});

function initMobileNav() {
    const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');
    
    if (mobileNavToggleBtn) {
        mobileNavToggleBtn.addEventListener('click', function() {
            document.querySelector('body').classList.toggle('mobile-nav-active');
            this.classList.toggle('bi-list');
            this.classList.toggle('bi-x');
        });
    }

    // Fermer le menu mobile quand on clique sur un lien
    document.querySelectorAll('#navmenu a').forEach(navmenu => {
        navmenu.addEventListener('click', () => {
            if (document.querySelector('.mobile-nav-active')) {
                document.querySelector('body').classList.remove('mobile-nav-active');
                if (mobileNavToggleBtn) {
                    mobileNavToggleBtn.classList.add('bi-list');
                    mobileNavToggleBtn.classList.remove('bi-x');
                }
            }
        });
    });
}

function getCivicPlusBasePathFromScript(fileName) {
    const script = Array.from(document.scripts).find(function (tag) {
        return tag.src && tag.src.indexOf('/assets/js/' + fileName) !== -1;
    });

    if (script) {
        const scriptPath = new URL(script.src, window.location.href).pathname;
        return scriptPath.replace(new RegExp('/assets/js/' + fileName.replace('.', '\\.') + '.*$', 'i'), '') || '';
    }

    const currentPath = window.location.pathname;
    const modulesIndex = currentPath.toLowerCase().indexOf('/modules/');
    if (modulesIndex !== -1) return currentPath.slice(0, modulesIndex);

    return currentPath.replace(/\/[^\/]*$/, '');
}
