<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Définition de la base URL pour assurer que tous les liens fonctionnent partout
$script_dir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
$base_url = preg_replace('#/Modules/E-Administration/view$#', '', $script_dir);
if ($base_url === '/' || $base_url === '.') {
    $base_url = '';
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
        if ($base_url !== '' && strpos($path, $base_url . '/') === 0) {
            return $path;
        }

        if ($base_url !== '' && stripos($path, '/assets/') === 0) {
            return $base_url . $path;
        }

        return $path;
    }

    return rtrim($base_url, '/') . '/' . ltrim($path, '/');
}
}
?>
<header id="header" class="header d-flex align-items-center sticky-top">
  <div class="container-fluid container-xl position-relative d-flex align-items-center">

    <!-- Logo / Marque original du template -->
    <a href="<?php echo $base_url; ?>/index.html" class="logo d-flex align-items-center me-auto">
      <img src="<?php echo $base_url; ?>/assets/img/logo.png" alt="CivicPlus Logo">
      <h1 class="sitename">CivicPlus</h1>
    </a>

    <!-- Menu de navigation original -->
    <nav id="navmenu" class="navmenu">
      <ul>
        <li><a href="<?php echo $base_url; ?>/index.html#hero">Accueil</a></li>
        <li><a href="<?php echo $base_url; ?>/index.html#about">Concept</a></li>
        <li><a href="<?php echo $base_url; ?>/index.html#services">Services</a></li>
        <li><a href="<?php echo $base_url; ?>/index.html#team">Équipe</a></li>
        <li><a href="<?php echo $base_url; ?>/index.html#contact">Contact</a></li>
      </ul>
      <i class="mobile-nav-toggle d-xl-none bi bi-list"></i>
    </nav>

    <!-- Espace Authentification dynamique -->
    <div class="d-flex align-items-center">
        <?php if (!isset($_SESSION['user_id'])): ?>
            <!-- Visiteur : Bouton du template original -->
            <a class="btn-getstarted" href="<?php echo $base_url; ?>/Modules/User/View/login.html">Connexion</a>
        <?php else: ?>
            <!-- Utilisateur connecté : Orange Pill + Photo -->
            <?php
                $nom = htmlspecialchars($_SESSION['nom'] ?? 'Utilisateur');
                $role = $_SESSION['role'] ?? 'citoyen';

                // Si la photo n'est pas en session, on essaie de la charger depuis la DB pour éviter de forcer le re-login
                if (!isset($_SESSION['photo']) && isset($_SESSION['user_id'])) {
                    try {
                        require_once __DIR__ . '/../../User/config/config.php';
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

            <!-- On garde le bouton orange même connecté (vers le portfolio ou services) -->
            <a class="btn-getstarted d-none d-sm-block me-3" href="<?php echo $base_url; ?>/Modules/E-Administration/view/citoyen_portfolio.html">Mon E-Espace</a>

            <div class="dropdown">
                <a href="#" class="d-flex align-items-center text-decoration-none dropdown-toggle user-profile-dropdown" id="dropdownUser" data-bs-toggle="dropdown" data-bs-display="static" aria-expanded="false">
                    <div class="profile-img-wrapper">
                        <img src="<?php echo $photo_url; ?>" alt="Profil" width="40" height="40" class="rounded-circle shadow-sm">
                        <?php if ($role === 'admin'): ?>
                            <span class="admin-badge-dot"></span>
                        <?php endif; ?>
                    </div>
                </a>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 animate slideIn" aria-labelledby="dropdownUser">
                    <li><a class="dropdown-item py-2" href="<?php echo $base_url; ?>/Modules/User/View/citoyen_profile.html"><i class="bi bi-person-circle me-2 text-primary"></i>Mon Compte</a></li>
                    <li><a class="dropdown-item py-2" href="<?php echo $base_url; ?>/Modules/Assistance/view/assistance.html"><i class="bi bi-headset me-2 text-primary"></i>Assistance</a></li>
                    <li><a class="dropdown-item py-2" href="#"><i class="bi bi-gear-fill me-2 text-secondary"></i>Paramètres</a></li>

                    <li><hr class="dropdown-divider"></li>

                    <!-- Language Option -->
                    <li class="dropdown-submenu">
                        <a class="dropdown-item py-2 dropdown-toggle-sub" href="#"><i class="bi bi-translate me-2 text-info"></i>Langue</a>
                        <ul class="dropdown-menu shadow-sm border-0">
                            <li><a class="dropdown-item py-1" href="#"><img src="https://flagcdn.com/w20/fr.png" class="me-2" width="16" alt="FR"> Français</a></li>
                            <li><a class="dropdown-item py-1" href="#"><img src="https://flagcdn.com/w20/tn.png" class="me-2" width="16" alt="AR"> Arabe</a></li>
                            <li><a class="dropdown-item py-1" href="#"><img src="https://flagcdn.com/w20/gb.png" class="me-2" width="16" alt="EN"> Anglais</a></li>
                        </ul>
                    </li>

                    <!-- Theme Toggle Option -->
                    <li>
                        <a class="dropdown-item py-2" href="#" id="theme-toggle">
                            <i class="bi bi-moon-stars me-2 text-dark" id="theme-icon"></i>
                            <span id="theme-text">Mode Sombre</span>
                        </a>
                    </li>

                    <?php if ($role === 'admin'): ?>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item fw-bold py-2 text-warning" href="<?php echo $base_url; ?>/admin.html"><i class="bi bi-speedometer2 me-2"></i>Administration</a></li>
                    <?php endif; ?>

                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger fw-bold py-2" href="<?php echo $base_url; ?>/Modules/User/Controller/logout.php"><i class="bi bi-box-arrow-right me-2"></i>Déconnexion</a></li>
                </ul>
            </div>
        <?php endif; ?>
    </div>

  </div>

  <style>
    .navmenu a:hover, .navmenu .active {
        color: #fd7e14 !important;
    }
    .user-profile-dropdown {
        transition: all 0.3s ease;
        padding: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .user-profile-dropdown::after {
        display: none; /* Cache la flèche bootstrap par défaut */
    }
    .profile-img-wrapper {
        position: relative;
        cursor: pointer;
    }
    .profile-img-wrapper img {
        border: 2px solid #fff;
        transition: all 0.3s ease;
        object-fit: cover;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .user-profile-dropdown:hover .profile-img-wrapper img {
        transform: scale(1.05);
        border-color: #fd7e14;
    }
    .admin-badge-dot {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 12px;
        height: 12px;
        background: #fd7e14;
        border: 2px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 5px rgba(0,0,0,0.2);
    }

    /* Correction positionnement Dropdown Principal */
    .dropdown {
        position: relative !important;
    }
    .user-profile-dropdown + .dropdown-menu {
        position: absolute !important;
        top: 100% !important;
        right: 0 !important;
        left: auto !important;
        margin-top: 12px !important;
        min-width: 220px;
        z-index: 9999;
    }

    /* Animations Dropdown */
    .animate {
        animation-duration: 0.3s;
        -webkit-animation-duration: 0.3s;
        animation-fill-mode: both;
        -webkit-animation-fill-mode: both;
    }
    @keyframes slideIn {
        0% { transform: translateY(10px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
    }
    .slideIn {
        animation-name: slideIn;
    }

    .dropdown-item {
        transition: all 0.2s ease;
        border-radius: 8px;
        margin: 4px 8px;
        width: auto;
        display: flex;
        align-items: center;
        padding: 10px 15px;
    }
    .dropdown-item:hover {
        background-color: rgba(253, 126, 20, 0.1);
        color: #fd7e14;
        transform: translateX(5px);
    }
    .dropdown-item i {
        font-size: 1.1rem;
    }
    #theme-toggle, .no-caret {
        text-decoration: none !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        color: var(--nav-color) !important;
    }
    #theme-toggle:hover, .no-caret:hover {
        color: var(--accent-color) !important;
    }
    .no-caret::after {
        display: none !important;
    }

    /* Sous-menus dans le dropdown */
    .dropdown-submenu {
        position: relative;
    }
    .dropdown-submenu .dropdown-menu {
        top: 0 !important;
        left: auto !important;
        right: 100% !important; /* S'ouvre à gauche */
        margin-top: 0 !important;
        margin-right: 0 !important;
        min-width: 180px !important;
        display: none;
        box-shadow: -5px 0 15px rgba(0,0,0,0.1) !important;
    }
    .dropdown-submenu:hover > .dropdown-menu {
        display: block !important;
    }
  </style>

</header>
