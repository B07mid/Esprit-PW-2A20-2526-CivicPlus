<?php
if (!headers_sent()) {
    header('Content-Type: text/html; charset=UTF-8');
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$script_dir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
$base_url = preg_replace('#/$#', '', $script_dir);
if ($base_url === '' || $base_url === '.') {
    $base_url = '/civicplus';
}

if (!function_exists('civicplus_public_asset_url')) {
function civicplus_public_asset_url(?string $path, string $base_url, string $fallback): string {
    $path = trim((string) $path);
    if ($path === '') {
        return $fallback;
    }

    $path = str_replace('\\', '/', $path);

    if (preg_match('#^https?://#i', $path) || strpos($path, '//') === 0) {
        return $path;
    }

    $assets_pos = stripos($path, '/assets/');
    if ($assets_pos !== false && strpos($path, '/assets/') !== 0) {
        $path = substr($path, $assets_pos + 1);
    }

    $path = preg_replace('#^(\./|\../)+#', '', $path);

    if (strpos($path, '/') === 0) {
        if (strpos($path, $base_url . '/') === 0) {
            return $path;
        }

        if (stripos($path, '/assets/') === 0) {
            return $base_url . $path;
        }

        return $path;
    }

    return rtrim($base_url, '/') . '/' . ltrim($path, '/');
}
}

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
$fallback_photo = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
$photo_url = civicplus_public_asset_url($photo, $base_url, $fallback_photo);
if ($photo_url !== $fallback_photo) {
    $photo_url .= (strpos($photo_url, '?') === false ? '?' : '&') . 't=' . time();
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
        <span class="sidebar-notification-badge d-none" data-admin-count="users_pending">+0</span>
        </a>
    </li>

    <!-- E-Administration -->
    <li class="menu-item">
        <a href="#collapseEAdmin" data-bs-toggle="collapse" aria-expanded="false" class="menu-link has-submenu">
        <i class="bi bi-building"></i>
        <span class="menu-text">E-Administration</span>
        <span class="sidebar-notification-badge d-none" data-admin-count="eadmin_pending">+0</span>
        <i class="bi bi-chevron-right float-end mt-1 toggle-icon"></i>
        </a>
        <ul class="collapse list-unstyled ps-4 mt-2" id="collapseEAdmin">
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/E-Administration/view/liste_demandes.html" class="menu-link">
            <i class="bi bi-card-list"></i> <span class="menu-text">Liste des demandes</span>
            <span class="sidebar-notification-badge d-none" data-admin-count="eadmin_pending">+0</span>
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
        <span class="sidebar-notification-badge d-none" data-admin-count="transport_pending">+0</span>
        <i class="bi bi-chevron-right float-end mt-1 toggle-icon"></i>
        </a>
        <ul class="collapse list-unstyled ps-4 mt-2" id="collapseTransport">
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/Transport/View/back/list_transport.html" class="menu-link">
            <i class="bi bi-card-list"></i> <span class="menu-text">Liste des transports</span>
            <span class="sidebar-notification-badge d-none" data-admin-count="transport_pending">+0</span>
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
        <span class="sidebar-notification-badge d-none" data-admin-count="signalement_total_pending">+0</span>
        <i class="bi bi-chevron-right float-end mt-1 toggle-icon"></i>
        </a>
        <ul class="collapse list-unstyled ps-4 mt-2" id="collapseSignalement">
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/Signalement/view/liste_signalements.html" class="menu-link">
            <i class="bi bi-card-list"></i> <span class="menu-text">Liste des signalements</span>
            <span class="sidebar-notification-badge d-none" data-admin-count="signalement_pending">+0</span>
            </a>
        </li>
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/Signalement/view/liste_interventions.html" class="menu-link">
            <i class="bi bi-tools"></i> <span class="menu-text">Liste des interventions</span>
            <span class="sidebar-notification-badge d-none" data-admin-count="intervention_pending">+0</span>
            </a>
        </li>
        </ul>
    </li>

    <!-- Crowdfunding -->
    <li class="menu-item">
        <a href="#collapseCrowd" data-bs-toggle="collapse" aria-expanded="false" class="menu-link has-submenu">
        <i class="bi bi-currency-dollar"></i>
        <span class="menu-text">Crowdfunding</span>
        <span class="sidebar-notification-badge d-none" data-admin-count="crowdfunding_total_pending">+0</span>
        <i class="bi bi-chevron-right float-end mt-1 toggle-icon"></i>
        </a>
        <ul class="collapse list-unstyled ps-4 mt-2" id="collapseCrowd">
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/Crowdfunding/view/liste_projets.html" class="menu-link">
            <i class="bi bi-card-list"></i> <span class="menu-text">Liste des projets</span>
            <span class="sidebar-notification-badge d-none" data-admin-count="crowdfunding_projects_pending">+0</span>
            </a>
        </li>
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/Crowdfunding/view/liste_donations.html" class="menu-link">
            <i class="bi bi-piggy-bank"></i> <span class="menu-text">Liste des donations</span>
            <span class="sidebar-notification-badge d-none" data-admin-count="crowdfunding_donations_pending">+0</span>
            </a>
        </li>
        <li class="menu-item mb-2">
            <a href="<?php echo $base_url; ?>/Modules/Crowdfunding/view/liste_commentaires.html" class="menu-link">
            <i class="bi bi-chat-dots"></i> <span class="menu-text">Commentaires</span>
            <span class="sidebar-notification-badge d-none" data-admin-count="crowdfunding_comments_pending">+0</span>
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

    <!-- Assistance -->
    <li class="menu-item">
        <a href="<?php echo $base_url; ?>/Modules/Assistance/view/admin_assistance.html" class="menu-link">
        <i class="bi bi-headset"></i>
        <span class="menu-text">Assistance</span>
        <span class="sidebar-notification-badge d-none" data-admin-count="assistance_pending">+0</span>
        </a>
    </li>
</ul>

<script>
// Shared admin counters: badges show unresolved items like +2 on the relevant management links.
fetch('<?php echo $base_url; ?>/admin_counts.php')
    .then(r => r.json())
    .then(payload => {
        const counts = payload && payload.counts ? payload.counts : {};

        document.querySelectorAll('[data-admin-count]').forEach(el => {
            const key = el.getAttribute('data-admin-count');
            const count = Number(counts[key] || 0);

            if (count > 0) {
                el.textContent = '+' + count;
                el.title = count + ' élément' + (count > 1 ? 's' : '') + ' à traiter';
                el.classList.remove('d-none');
            } else {
                el.classList.add('d-none');
            }
        });
    })
    .catch(() => {});

// Logic to automatically set 'active' states based on the current page
(function() {
    const currentPath = window.location.pathname.replace(/\/+$/, '').toLowerCase();
    const links = document.querySelectorAll('.admin-sidebar .menu-item a.menu-link');
    let matched = false;

    function activateLink(link) {
        link.classList.add('active');
        const item = link.closest('.menu-item');
        if (item) item.classList.add('active');

        const submenu = link.closest('.collapse');
        if (submenu) {
            submenu.classList.add('show');

            const parentLink = document.querySelector(`a[href="#${submenu.id}"]`);
            if (parentLink) {
                parentLink.setAttribute('aria-expanded', 'true');
            }
        }
    }
    
    links.forEach(link => {
        const rawHref = link.getAttribute('href') || '';
        if (!rawHref || rawHref.charAt(0) === '#') return;

        const linkPath = new URL(link.href, window.location.href).pathname.replace(/\/+$/, '').toLowerCase();
        if (linkPath === currentPath) {
            activateLink(link);
            matched = true;
        }
    });

    if (!matched) {
        const sectionFallbacks = [
            ['/modules/user/', '/Modules/User/View/user_list.html'],
            ['/modules/e-administration/', '/Modules/E-Administration/view/liste_demandes.html'],
            ['/modules/transport/', '/Modules/Transport/View/back/list_transport.html'],
            ['/modules/signalement/', '/Modules/Signalement/view/liste_signalements.html'],
            ['/modules/crowdfunding/', '/Modules/Crowdfunding/view/liste_projets.html'],
            ['/modules/geo-services/', '/Modules/Geo-Services/View/liste_poi.html'],
            ['/modules/assistance/', '/Modules/Assistance/view/admin_assistance.html']
        ];

        const fallback = sectionFallbacks.find(([prefix]) => currentPath.includes(prefix));
        if (fallback) {
            const target = fallback[1].toLowerCase();
            const fallbackLink = Array.from(links).find(link => {
                const rawHref = link.getAttribute('href') || '';
                if (!rawHref || rawHref.charAt(0) === '#') return false;
                return new URL(link.href, window.location.href).pathname.toLowerCase().endsWith(target);
            });
            if (fallbackLink) activateLink(fallbackLink);
        }
    }

    document.querySelectorAll('.collapse').forEach(submenu => {
        submenu.addEventListener('shown.bs.collapse', () => {
            const parentLink = document.querySelector(`a[href="#${submenu.id}"]`);
            if (parentLink) parentLink.setAttribute('aria-expanded', 'true');
        });

        submenu.addEventListener('hidden.bs.collapse', () => {
            const parentLink = document.querySelector(`a[href="#${submenu.id}"]`);
            if (parentLink) parentLink.setAttribute('aria-expanded', 'false');
        });
    });
})();
</script>
