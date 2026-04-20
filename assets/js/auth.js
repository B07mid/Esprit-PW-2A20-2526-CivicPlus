function initAuth() {
    const currentPath = window.location.pathname.toLowerCase();

    fetch('/Esprit-PW-2A20-2526-CivicPlus/Modules/User/Controller/auth.php')
        .then(response => response.json())
        .then(session => {
            
            // ==========================================
            // LOGIQUE DE REDIRECTION (ROUTING)
            // ==========================================

            if (session.logged_in) {
                // S'il essaie d'aller sur login ou register, on le renvoie à l'accueil
                if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
                    window.location.href = '/Esprit-PW-2A20-2526-CivicPlus/index.html';
                    return; 
                }

                // S'il essaie d'aller sur une page admin alors qu'il n'est que citoyen
                // (On évite de bloquer "E-Administration" par erreur)
                const isAdminPath = currentPath.includes('/admin.html') || currentPath.includes('_admin') || currentPath.includes('/back/');
                if (isAdminPath && session.role !== 'admin') {
                    alert("Accès refusé : Réservé aux administrateurs.");
                    window.location.href = '/Esprit-PW-2A20-2526-CivicPlus/index.html';
                    return;
                }

            } else {
                // VISITEUR (Guest) - Protéger les routes sécurisées
                const protectedPages = ['portfolio', 'soumettre_demande', 'admin', 'signalement', '/back/', 'edit'];
                
                let isProtected = protectedPages.some(page => currentPath.includes(page));
                
                if (isProtected) {
                    alert("Vous devez être connecté pour accéder à cette page.");
                    window.location.href = '/Esprit-PW-2A20-2526-CivicPlus/Modules/User/View/login.html';
                    return;
                }
            }

            // ==========================================
            // LOGIQUE D'AFFICHAGE (UI / NAVBAR)
            // ==========================================

            // Affichage Administrateur
            const adminLink = document.getElementById('admin-link');
            if (adminLink) {
                adminLink.style.display = (session.logged_in && session.role === 'admin') ? 'block' : 'none';
            }

            // Gestion du bouton Se connecter / Créer un compte dans la navbar
            // Notre navbar contient typiquement <div id="auth-action-area"> ou un a.btn-getstarted à la racine de la nav
            let authButtons = document.querySelectorAll('header .btn-getstarted, header #login-link');
            let authActionArea = document.getElementById('auth-action-area');
            let headerContainer = document.querySelector('header .container, header .container-fluid');

            if (session.logged_in) {
                // On cache tous les vieux boutons "Se connecter" / "Creer compte" de type "Auth"
                authButtons.forEach(btn => {
                    // Vérification sélective pour ne pas supprimer "Crowdfunding" ou "Planifier"
                    let text = btn.innerText.toLowerCase();
                    if (text.includes("login") || text.includes("connexion") || text.includes("connecter") || text.includes("compte") || text.includes("inscrire")) {
                        btn.style.display = 'none';
                    }
                });

                // Si l'espace auth dédié existe, on le remplit
                if (authActionArea) {
                    let dashboardBtn = (session.role === 'admin') ? 
                        `<a class="btn-getstarted me-2" style="background-color: #ffc107; border-color: #ffc107; color: #000;" href="/Esprit-PW-2A20-2526-CivicPlus/admin.html">Dashboard</a>` : '';
                        
                    authActionArea.innerHTML = `
                        <div class="d-flex align-items-center">
                            ${dashboardBtn}
                            <a href="/Esprit-PW-2A20-2526-CivicPlus/Modules/User/View/citoyen_profile.html" style="text-decoration: none;">
                                <span style="font-weight: 600; margin-right: 15px; color: var(--heading-color);">
                                    👤 ${session.nom}
                                </span>
                            </a>
                            <a class="btn-getstarted" style="background-color: #dc3545; border-color: #dc3545;" href="/Esprit-PW-2A20-2526-CivicPlus/Modules/User/Controller/logout.php">Déconnexion</a>
                        </div>
                    `;
                } else {
                    // Sinon, on injecte dynamiquement le profil dans le header
                    // (Si ce n'est pas déjà fait - évite les doubles)
                    if (!document.getElementById('dynamic-profile-nav')) {
                        let dashboardBtn = (session.role === 'admin') ? 
                            `<a class="btn-getstarted me-2" style="background-color: #ffc107; border-color: #ffc107; color: #000;" href="/Esprit-PW-2A20-2526-CivicPlus/admin.html">Dashboard</a>` : '';

                        let profileHtml = `
                        <div id="dynamic-profile-nav" class="d-flex align-items-center ms-lg-3 mt-3 mt-lg-0">
                            ${dashboardBtn}
                            <a href="/Esprit-PW-2A20-2526-CivicPlus/Modules/User/View/citoyen_profile.html" style="text-decoration: none;">
                                <span style="font-weight: 600; margin-right: 15px; color: var(--heading-color);">
                                    👤 ${session.nom}
                                </span>
                            </a>
                            <a class="btn-getstarted" style="background-color: #dc3545; border-color: #dc3545;" href="/Esprit-PW-2A20-2526-CivicPlus/Modules/User/Controller/logout.php">Déconnexion</a>
                        </div>`;
                        if (headerContainer) headerContainer.insertAdjacentHTML('beforeend', profileHtml);
                    }
                }

                // ==========================================
                // AUTO-FILL DES FORMULAIRES (CIN)
                // ==========================================
                let champCin = document.getElementById('num_cin') || document.querySelector('input[name="num_cin"]');
                if (champCin && session.num_cin) {
                    champCin.value = session.num_cin;
                    champCin.setAttribute('readonly', true);
                    champCin.style.backgroundColor = "#e9ecef";
                    champCin.style.cursor = "not-allowed";
                }

            } else {
                // Si non connecté, s'assurer que auth action area montre Inscription/Login
                if (authActionArea && authActionArea.innerHTML.includes("Déconnexion")) {
                    authActionArea.innerHTML = `<a class="btn-getstarted" href="/Esprit-PW-2A20-2526-CivicPlus/Modules/User/View/login.html">Connexion</a>`;
                }
            }
        })
        .catch(error => console.error("Erreur d'authentification CivicPlus:", error));
}
if(document.readyState === "loading") { 
    document.addEventListener("DOMContentLoaded", initAuth); 
} else { 
    initAuth(); 
}
