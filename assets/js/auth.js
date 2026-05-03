let civicPlusAuthCheckId = 0;

function initAuth() {
    const currentPath = window.location.pathname.toLowerCase();
    const basePath = getCivicPlusBasePath();
    const url = (path) => `${basePath}/${path.replace(/^\/+/, '')}`;
    const loginUrl = url('Modules/User/View/login.html');
    const homeUrl = url('index.html');
    const isProtected = isProtectedCivicPlusRoute(currentPath);
    const authCheckId = ++civicPlusAuthCheckId;

    if (isProtected) {
        setCivicPlusAuthPending(true);
    }

    fetch(url('Modules/User/Controller/auth.php'), {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Auth request failed');
            }
            return response.json();
        })
        .then(session => {
            if (authCheckId !== civicPlusAuthCheckId) {
                return;
            }

            if (session.logged_in) {
                if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
                    window.location.replace(homeUrl);
                    return;
                }

                const isAdminPath = currentPath.includes('/admin.html') || currentPath.includes('_admin') || currentPath.includes('/back/');
                if (isAdminPath && session.role !== 'admin') {
                    window.location.replace(homeUrl);
                    return;
                }

                setCivicPlusAuthPending(false);
                fillCivicPlusCin(session);
                return;
            }

            if (isProtected) {
                window.location.replace(loginUrl);
                return;
            }

            setCivicPlusAuthPending(false);
        })
        .catch(error => {
            console.error("Erreur d'authentification CivicPlus:", error);

            if (isProtected) {
                window.location.replace(loginUrl);
                return;
            }

            setCivicPlusAuthPending(false);
        });
}

function isProtectedCivicPlusRoute(currentPath) {
    const protectedPages = [
        '/admin.html',
        '/back/',
        '_admin',
        'admin_',
        'admin',
        'signalement',
        'signaler-transport',
        'portfolio',
        'citoyen_',
        'ajouter_demande',
        'ajouter_portfolio',
        'soumettre_demande',
        'gestion_types',
        'liste_demandes',
        'liste_signalements',
        'liste_interventions',
        'liste_donations',
        'liste_projets',
        'liste_commentaires',
        'user_list',
        'edit'
    ];

    return protectedPages.some(page => currentPath.includes(page));
}

function setCivicPlusAuthPending(isPending) {
    let style = document.getElementById('civicplus-auth-pending-style');

    if (!style) {
        style = document.createElement('style');
        style.id = 'civicplus-auth-pending-style';
        style.textContent = 'html.civicplus-auth-pending body{visibility:hidden!important;}';
        document.head.appendChild(style);
    }

    document.documentElement.classList.toggle('civicplus-auth-pending', isPending);
}

function fillCivicPlusCin(session) {
    let champCin = document.getElementById('num_cin') || document.querySelector('input[name="num_cin"]');

    if (champCin && session.num_cin) {
        champCin.value = session.num_cin;
        champCin.setAttribute('readonly', true);
        champCin.style.backgroundColor = "#e9ecef";
        champCin.style.cursor = "not-allowed";
    }
}

function getCivicPlusBasePath() {
    const script = Array.from(document.scripts).find(function (tag) {
        return tag.src && tag.src.indexOf('/assets/js/auth.js') !== -1;
    });

    if (script) {
        const scriptPath = new URL(script.src, window.location.href).pathname;
        return scriptPath.replace(/\/assets\/js\/auth\.js.*$/i, '') || '';
    }

    const currentPath = window.location.pathname;
    const modulesIndex = currentPath.toLowerCase().indexOf('/modules/');
    if (modulesIndex !== -1) return currentPath.slice(0, modulesIndex);

    return currentPath.replace(/\/[^\/]*$/, '');
}
if(document.readyState === "loading") { 
    document.addEventListener("DOMContentLoaded", initAuth); 
} else { 
    initAuth(); 
}

window.addEventListener('pageshow', function(event) {
    const navigationEntry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    const isBackForward = event.persisted || (navigationEntry && navigationEntry.type === 'back_forward');

    if (isBackForward) {
        initAuth();
    }
});
