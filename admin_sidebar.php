<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$base_url = "/Esprit-PW-2A20-2526-CivicPlus";

// Si la photo n'est pas en session, on essaie de la charger depuis la DB
if (!isset($_SESSION['photo']) && isset($_SESSION['user_id'])) {
    try {
        require_once __DIR__ . '/Modules/User/config/config.php';
        $stmt_photo = $pdo->prepare("SELECT photo FROM citoyen WHERE num_cin = :cin");
        $stmt_photo->execute(['cin' => $_SESSION['user_id']]);
        $row_photo = $stmt_photo->fetch();
        if ($row_photo) {
            $_SESSION['photo'] = $row_photo['photo'];
        }
    } catch (Exception $e) { /* tant pis */ }
}

$photo = $_SESSION['photo'] ?? '';
if (empty($photo)) {
    $photo_url = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
} elseif (strpos($photo, 'http') === 0 || strpos($photo, '/') === 0) {
    $photo_url = htmlspecialchars($photo);
} else {
    $photo_url = $base_url . '/' . htmlspecialchars($photo) . '?t=' . time();
}
?>
<!-- Brand Logo -->
<div class="brand d-flex align-items-center justify-content-between p-3 border-bottom mb-3" style="border-color: rgba(0,0,0,0.1) !important;">
    <div class="d-flex align-items-center flex-grow-1">
        <img src="<?php echo $base_url; ?>/assets/img/RawShape.png" alt="CivicPlus Logo" class="brand-image me-2" width="24" height="24">
        <div>
            <h5 class="mb-0 fw-bold" style="font-size: 1.1rem; color: #2c3e50;">CivicPlus</h5>
            <small class="text-muted" style="font-size: 0.75rem;">BackOffice</small>
        </div>
    </div>
    <div class="ms-2">
        <a href="<?php echo $base_url; ?>/Modules/User/View/citoyen_profile.html">
            <img src="<?php echo $photo_url; ?>" alt="Admin" width="36" height="36" class="rounded-circle shadow-sm" style="object-fit: cover; border: 2px solid #fd7e14;">
        </a>
    </div>
</div>

<!-- Menu -->
<ul class="menu-inner">
    <!-- Dashboard -->
    <li class="menu-item">
        <a href="<?php echo $base_url; ?>/admin.html" class="menu-link">
        <i class="bi bi-house-door-fill"></i>
        <div>
            <p class="menu-text mb-0">Tableau de Bord</p>
            <p class="menu-description mb-0">Vue d'ensemble</p>
        </div>
        </a>
    </li>

    <!-- Back to FrontOffice -->
    <li class="menu-item">
        <a href="<?php echo $base_url; ?>/index.html" class="menu-link text-primary">
        <i class="bi bi-arrow-left-circle"></i>
        <div>
            <p class="menu-text mb-0">Retour au Site</p>
            <p class="menu-description mb-0">Quitter le BackOffice</p>
        </div>
        </a>
    </li>

    <!-- User -->
    <li class="menu-item">
        <a href="<?php echo $base_url; ?>/Modules/User/View/user_list.html" class="menu-link">
        <i class="bi bi-people-fill"></i>
        <span class="menu-text">Citoyens / Utilisateurs</span>
        </a>
    </li>

    <!-- E-Administration -->
    <li class="menu-item">
        <a href="#collapseEAdmin" data-bs-toggle="collapse" aria-expanded="false" class="menu-link has-submenu">
        <i class="bi bi-building"></i>
        <span class="menu-text">E-Administration</span>
        <i class="bi bi-chevron-right float-end mt-1 toggle-icon"></i>
        </a>
        <ul class="collapse list-unstyled ps-4 mt-2" id="collapseEAdmin">
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/E-Administration/view/liste_demandes.html" class="menu-link">
            <i class="bi bi-card-list"></i> <span class="menu-text">Liste des demandes</span>
            </a>
        </li>
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/E-Administration/view/gestion_types.html" class="menu-link">
            <i class="bi bi-plus-circle"></i> <span class="menu-text">Types</span>
            </a>
        </li>
        </ul>
    </li>

    <!-- Smart Transport -->
    <li class="menu-item">
        <a href="#collapseTransport" data-bs-toggle="collapse" aria-expanded="false" class="menu-link has-submenu">
        <i class="bi bi-bus-front"></i>
        <span class="menu-text">Smart Transport</span>
        <i class="bi bi-chevron-right float-end mt-1 toggle-icon"></i>
        </a>
        <ul class="collapse list-unstyled ps-4 mt-2" id="collapseTransport">
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/Transport/View/back/list_transport.html" class="menu-link">
            <i class="bi bi-card-list"></i> <span class="menu-text">Liste des transports</span>
            </a>
        </li>
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/Transport/View/back/ajouter_transport.html" class="menu-link">
            <i class="bi bi-plus-circle"></i> <span class="menu-text">Ajouter un transport</span>
            </a>
        </li>
        </ul>
    </li>

    <!-- Signalements Urbains -->
    <li class="menu-item">
        <a href="#collapseSignalement" data-bs-toggle="collapse" aria-expanded="false" class="menu-link has-submenu">
        <i class="bi bi-flag-fill"></i>
        <span class="menu-text">Signalements Urbains</span>
        <i class="bi bi-chevron-right float-end mt-1 toggle-icon"></i>
        </a>
        <ul class="collapse list-unstyled ps-4 mt-2" id="collapseSignalement">
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/Signalement/view/liste_signalements.html" class="menu-link">
            <i class="bi bi-card-list"></i> <span class="menu-text">Liste des signalements</span>
            </a>
        </li>
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/Signalement/view/liste_interventions.html" class="menu-link">
            <i class="bi bi-tools"></i> <span class="menu-text">Liste des interventions</span>
            </a>
        </li>
        </ul>
    </li>

    <!-- Crowdfunding -->
    <li class="menu-item">
        <a href="#collapseCrowd" data-bs-toggle="collapse" aria-expanded="false" class="menu-link has-submenu">
        <i class="bi bi-currency-dollar"></i>
        <span class="menu-text">Crowdfunding</span>
        <span id="sidebarCrowdBadge" class="badge bg-danger rounded-circle ms-1 d-none" style="font-size:0.65rem;">0</span>
        <i class="bi bi-chevron-right float-end mt-1 toggle-icon"></i>
        </a>
        <ul class="collapse list-unstyled ps-4 mt-2" id="collapseCrowd">
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/Crowdfunding/view/liste_projets.html" class="menu-link">
            <i class="bi bi-card-list"></i> <span class="menu-text">Liste des projets</span>
            <span id="sidebarProjetsBadge" class="badge bg-danger rounded-circle ms-1 d-none" style="font-size:0.65rem;">0</span>
            </a>
        </li>
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/Crowdfunding/view/liste_donations.html" class="menu-link">
            <i class="bi bi-piggy-bank"></i> <span class="menu-text">Liste des donations</span>
            </a>
        </li>
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/Crowdfunding/view/liste_commentaires.html" class="menu-link">
            <i class="bi bi-chat-dots"></i> <span class="menu-text">Commentaires</span>
            </a>
        </li>
        </ul>
    </li>

    <!-- Geo-Services -->
    <li class="menu-item">
        <a href="#collapseGeo" data-bs-toggle="collapse" aria-expanded="false" class="menu-link has-submenu">
        <i class="bi bi-map-fill"></i>
        <span class="menu-text">Geo-Services</span>
        <i class="bi bi-chevron-right float-end mt-1 toggle-icon"></i>
        </a>
        <ul class="collapse list-unstyled ps-4 mt-2" id="collapseGeo">
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/Geo-Services/View/liste_poi.html" class="menu-link">
            <i class="bi bi-card-list"></i> <span class="menu-text">Liste des POI</span>
            </a>
        </li>
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/Geo-Services/View/admin_affluence.html" class="menu-link text-warning">
            <i class="bi bi-clock-history"></i> <span class="menu-text">Historique d'affluence</span>
            </a>
        </li>
        </ul>
    </li>
</ul>

<script>
// Logic to handle admin panel JS counters
fetch('/Esprit-PW-2A20-2526-CivicPlus/Modules/Crowdfunding/controller/ProjetCrowdfundingController.php?action=demandeCount')
    .then(r => r.json())
    .then(d => {
    let n = d.count || 0; 
    if(!n) return;
    ['sidebarCrowdBadge','sidebarProjetsBadge'].forEach(id => {
        let el = document.getElementById(id); 
        if(el) { el.textContent = n; el.classList.remove('d-none'); }
    });
    }).catch(()=>{});

// Logic to automatically set 'active' states based on the current page
(function() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.admin-sidebar .menu-item a.menu-link');
    
    links.forEach(link => {
        if (link.href && currentPath.includes(new URL(link.href).pathname)) {
            // Add active to the link
            link.classList.add('active');
            
            // If it's inside a submenu, expand the parent
            const submenu = link.closest('.collapse');
            if (submenu) {
                // Add show class
                submenu.classList.add('show');
                submenu.classList.remove('collapse'); // Some Bootstrap versions prefer this structure
                
                // Set chevron down on the parent link
                const parentLink = document.querySelector(`a[href="#${submenu.id}"]`);
                if (parentLink) {
                    parentLink.setAttribute('aria-expanded', 'true');
                    const icon = parentLink.querySelector('.toggle-icon');
                    if (icon) {
                        icon.classList.remove('bi-chevron-right');
                        icon.classList.add('bi-chevron-down');
                    }
                }
            }
        }
    });

    // Handle manual clicks on submenus to toggle the chevron
    const submenuLinks = document.querySelectorAll('.has-submenu');
    submenuLinks.forEach(item => {
        item.addEventListener('click', function() {
            const icon = this.querySelector('.toggle-icon');
            if(icon) {
                if(this.getAttribute('aria-expanded') === 'true') {
                    icon.classList.remove('bi-chevron-right');
                    icon.classList.add('bi-chevron-down');
                } else {
                    icon.classList.remove('bi-chevron-down');
                    icon.classList.add('bi-chevron-right');
                }
            }
        });
    });
})();
</script>
