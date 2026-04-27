<?php
$files = [
    'admin.html',
    'Modules/Crowdfunding/view/liste_projets.html',
    'Modules/Crowdfunding/view/liste_donations.html',
    'Modules/E-Administration/view/gestion_types.html',
    'Modules/E-Administration/view/liste_demandes.html',
    'Modules/Geo-Services/View/liste_poi.html',
    'Modules/Transport/View/back/list_transport.html',
    'Modules/Transport/View/back/ajouter_transport.html',
    'Modules/Signalement/view/liste_signalements.html',
    'Modules/User/View/user_list.html',
    'Modules/Crowdfunding/view/liste_commentaires.html'
];

foreach ($files as $file) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        
        // 1. Replace the entire <aside class="admin-sidebar">...</aside> block with the empty container
        $newContent = preg_replace('/<aside class="admin-sidebar">.*?<\/aside>/s', '<aside class="admin-sidebar" id="admin-sidebar-container"></aside>', $content);
        
        // 2. We also need to inject the load_admin_sidebar.js script before closing </body> if not present
        // Let's see how many scripts there are. Or we can just insert it before </body>.
        if (strpos($newContent, 'load_admin_sidebar.js') === false) {
            $newContent = str_replace('</body>', '  <script src="/Esprit-PW-2A20-2526-CivicPlus/assets/js/load_admin_sidebar.js?v=2"></script>' . "\n  </body>", $newContent);
        }

        // 3. Let's also remove the redundant hardcoded script for badges from the page since it's now in admin_sidebar.php
        $newContent = preg_replace('/<script>\s*fetch\(\'\/Esprit-PW-2A20-2526-CivicPlus\/Modules\/Crowdfunding.*?\s*<\/script>/s', '', $newContent);

        if ($newContent !== $content) {
            file_put_contents($file, $newContent);
            echo "Updated $file\n";
        } else {
            echo "No changes needed for $file\n";
        }
    } else {
        echo "File not found: $file\n";
    }
}
echo "Done.\n";
