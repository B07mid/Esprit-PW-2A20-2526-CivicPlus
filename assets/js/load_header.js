// 1. On lance la requête de récupération du header IMMÉDIATEMENT 
// (en arrière-plan, sans attendre que le reste de la page finisse de charger)
const headerPromise = fetch('/civicplus/Modules/E-Administration/view/header.php')
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
        })
        .catch(error => console.error("Problème avec le Header dynamique :", error));
});

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