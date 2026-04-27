document.addEventListener("DOMContentLoaded", function() {
    const sidebarContainer = document.getElementById("admin-sidebar-container");
    if (!sidebarContainer) return;

    const projectRoot = window.location.pathname.substring(0, window.location.pathname.indexOf('/Modules/')) || 
                        window.location.pathname.substring(0, window.location.pathname.indexOf('/assets/')) ||
                        '/Esprit-PW-2A20-2526-CivicPlus';

    fetch(`${projectRoot}/admin_sidebar.php`)
        .then(response => {
            if (!response.ok) throw new Error("Erreur de chargement de la sidebar");
            return response.text();
        })
        .then(html => {
            sidebarContainer.innerHTML = html;

            // Re-evaluate any returned scripts (like the active state setter)
            const scripts = sidebarContainer.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
        })
        .catch(err => console.error(err));
});
