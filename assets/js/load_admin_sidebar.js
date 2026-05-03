const civicPlusAdminBasePath = getCivicPlusAdminBasePathFromScript('load_admin_sidebar.js');

forceCivicPlusAdminLightMode();

document.addEventListener("DOMContentLoaded", function() {
    const sidebarContainer = document.getElementById("admin-sidebar-container");
    if (!sidebarContainer) return;

    const projectRoot = civicPlusAdminBasePath ||
                        window.location.pathname.substring(0, window.location.pathname.indexOf('/Modules/')) ||
                        window.location.pathname.substring(0, window.location.pathname.indexOf('/assets/')) ||
                        '/civicplus';

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

            loadCivicPlusAdminEnhancements(projectRoot);
        })
        .catch(err => console.error(err));
});

function forceCivicPlusAdminLightMode() {
    document.documentElement.setAttribute('data-bs-theme', 'light');
}

function loadCivicPlusAdminEnhancements(projectRoot) {
    if (document.getElementById('civicplus-admin-enhancements-js')) return;

    const script = document.createElement('script');
    script.id = 'civicplus-admin-enhancements-js';
    script.src = `${projectRoot}/assets/js/admin_panel_enhancements.js?v=20260502-2`;
    script.defer = true;
    document.body.appendChild(script);
}

function getCivicPlusAdminBasePathFromScript(fileName) {
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
