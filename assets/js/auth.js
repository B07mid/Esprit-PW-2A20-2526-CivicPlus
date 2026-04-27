function initAuth() {
    const currentPath = window.location.pathname.toLowerCase();

    fetch('/civicplus/Modules/User/Controller/auth.php')
        .then(response => response.json())
        .then(session => {
            
            // ==========================================
            // LOGIQUE DE REDIRECTION (ROUTING)
            // ==========================================

            if (session.logged_in) {
                // S'il essaie d'aller sur login ou register, on le renvoie à l'accueil
                if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
                    window.location.href = '/civicplus/index.html';
                    return; 
                }

                // S'il essaie d'aller sur une page admin alors qu'il n'est que citoyen
                // (On évite de bloquer "E-Administration" par erreur)
                const isAdminPath = currentPath.includes('/admin.html') || currentPath.includes('_admin') || currentPath.includes('/back/');
                if (isAdminPath && session.role !== 'admin') {
                    alert("Accès refusé : Réservé aux administrateurs.");
                    window.location.href = '/civicplus/index.html';
                    return;
                }

            } else {
                // VISITEUR (Guest) - Protéger les routes sécurisées
                const protectedPages = ['portfolio', 'soumettre_demande', 'admin', 'signalement', '/back/', 'edit'];
                
                let isProtected = protectedPages.some(page => currentPath.includes(page));
                
                if (isProtected) {
                    alert("Vous devez être connecté pour accéder à cette page.");
                    window.location.href = '/civicplus/Modules/User/View/login.html';
                    return;
                }
            }

            if (session.logged_in) {
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
            }
        })
        .catch(error => console.error("Erreur d'authentification CivicPlus:", error));
}
if(document.readyState === "loading") { 
    document.addEventListener("DOMContentLoaded", initAuth); 
} else { 
    initAuth(); 
}
