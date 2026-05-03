const civicPlusFooterBasePath = getCivicPlusFooterBasePathFromScript('load_footer.js');

document.addEventListener('DOMContentLoaded', function () {
    const footerContainer = document.getElementById('footer-container');
    if (!footerContainer) return;

    fetch(`${civicPlusFooterBasePath}/Modules/E-Administration/view/footer.php`)
        .then(response => {
            if (!response.ok) throw new Error('Erreur de chargement du footer');
            return response.text();
        })
        .then(html => {
            footerContainer.innerHTML = html;
        })
        .catch(error => console.error('Problème avec le footer dynamique :', error));
});

function getCivicPlusFooterBasePathFromScript(fileName) {
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
