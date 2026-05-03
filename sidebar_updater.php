<?php

function rootPrefixFor(string $file): string
{
    $dir = str_replace('\\', '/', dirname($file));
    if ($dir === '.' || $dir === '') {
        return './';
    }

    $parts = array_values(array_filter(explode('/', $dir), static fn ($part) => $part !== ''));
    return str_repeat('../', count($parts));
}

function buildSidebar(string $file): string
{
    $base = rootPrefixFor($file);

    $dashboard = $base . 'admin.html';
    $frontOffice = $base . 'index.html';
    $users = $base . 'Modules/User/View/user_list.html';
    $demandes = $base . 'Modules/E-Administration/view/liste_demandes.html';
    $types = $base . 'Modules/E-Administration/view/gestion_types.html';
    $transportList = $base . 'Modules/Transport/View/back/list_transport.html';
    $transportAdd = $base . 'Modules/Transport/View/back/ajouter_transport.html';
    $signalements = $base . 'Modules/Signalement/view/liste_signalements.html';
    $crowdProjects = $base . 'Modules/Crowdfunding/view/liste_projets.html';
    $crowdDonations = $base . 'Modules/Crowdfunding/view/liste_donations.html';
    $poi = $base . 'Modules/Geo-Services/View/liste_poi.html';

    return <<<HTML
      <ul class="menu-inner">
        <!-- Dashboard -->
        <li class="menu-item">
          <a href="$dashboard" class="menu-link">
            <i class="bi bi-house-door-fill"></i>
            <div>
              <p class="menu-text mb-0">Tableau de Bord</p>
              <p class="menu-description mb-0">Vue d'ensemble</p>
            </div>
          </a>
        </li>

        <!-- Back to FrontOffice -->
        <li class="menu-item">
          <a href="$frontOffice" class="menu-link text-primary">
            <i class="bi bi-arrow-left-circle"></i>
            <div>
              <p class="menu-text mb-0">Retour au Site</p>
              <p class="menu-description mb-0">Quitter le BackOffice</p>
            </div>
          </a>
        </li>

        <!-- User -->
        <li class="menu-item">
          <a href="$users" class="menu-link">
            <i class="bi bi-people-fill"></i>
            <span class="menu-text">Citoyens / Utilisateurs</span>
          </a>
        </li>

        <!-- E-Administration -->
        <li class="menu-item">
          <a href="#collapseEAdmin" data-bs-toggle="collapse" aria-expanded="false" class="menu-link">
            <i class="bi bi-building"></i>
            <span class="menu-text">E-Administration</span>
            <i class="bi bi-chevron-right float-end mt-1"></i>
          </a>
          <ul class="collapse list-unstyled ps-4 mt-2" id="collapseEAdmin">
            <li class="menu-item mb-2">
              <a href="$demandes" class="menu-link">
                <i class="bi bi-card-list"></i> <span class="menu-text">Liste des demandes</span>
              </a>
            </li>
            <li class="menu-item mb-2">
              <a href="$types" class="menu-link">
                <i class="bi bi-plus-circle"></i> <span class="menu-text">Types</span>
              </a>
            </li>
          </ul>
        </li>

        <!-- Smart Transport -->
        <li class="menu-item">
          <a href="#collapseTransport" data-bs-toggle="collapse" aria-expanded="false" class="menu-link">
            <i class="bi bi-bus-front"></i>
            <span class="menu-text">Smart Transport</span>
            <i class="bi bi-chevron-right float-end mt-1"></i>
          </a>
          <ul class="collapse list-unstyled ps-4 mt-2" id="collapseTransport">
            <li class="menu-item mb-2">
              <a href="$transportList" class="menu-link">
                <i class="bi bi-card-list"></i> <span class="menu-text">Liste des transports</span>
              </a>
            </li>
            <li class="menu-item mb-2">
              <a href="$transportAdd" class="menu-link">
                <i class="bi bi-plus-circle"></i> <span class="menu-text">Ajouter un transport</span>
              </a>
            </li>
          </ul>
        </li>

        <!-- Signalements Urbains -->
        <li class="menu-item">
          <a href="#collapseSignalement" data-bs-toggle="collapse" aria-expanded="false" class="menu-link">
            <i class="bi bi-flag-fill"></i>
            <span class="menu-text">Signalements Urbains</span>
            <i class="bi bi-chevron-right float-end mt-1"></i>
          </a>
          <ul class="collapse list-unstyled ps-4 mt-2" id="collapseSignalement">
            <li class="menu-item mb-2">
              <a href="$signalements" class="menu-link">
                <i class="bi bi-card-list"></i> <span class="menu-text">Liste des signalements</span>
              </a>
            </li>
          </ul>
        </li>

        <!-- Crowdfunding -->
        <li class="menu-item">
          <a href="#collapseCrowd" data-bs-toggle="collapse" aria-expanded="false" class="menu-link">
            <i class="bi bi-currency-dollar"></i>
            <span class="menu-text">Crowdfunding</span>
            <i class="bi bi-chevron-right float-end mt-1"></i>
          </a>
          <ul class="collapse list-unstyled ps-4 mt-2" id="collapseCrowd">
            <li class="menu-item mb-2">
              <a href="$crowdProjects" class="menu-link">
                <i class="bi bi-card-list"></i> <span class="menu-text">Liste des projets</span>
              </a>
            </li>
            <li class="menu-item mb-2">
              <a href="$crowdDonations" class="menu-link">
                <i class="bi bi-piggy-bank"></i> <span class="menu-text">Liste des donations</span>
              </a>
            </li>
          </ul>
        </li>

        <!-- Geo-Services -->
        <li class="menu-item">
          <a href="#collapseGeo" data-bs-toggle="collapse" aria-expanded="false" class="menu-link">
            <i class="bi bi-map-fill"></i>
            <span class="menu-text">Geo-Services</span>
            <i class="bi bi-chevron-right float-end mt-1"></i>
          </a>
          <ul class="collapse list-unstyled ps-4 mt-2" id="collapseGeo">
            <li class="menu-item mb-2">
              <a href="$poi" class="menu-link">
                <i class="bi bi-card-list"></i> <span class="menu-text">Liste des POI</span>
              </a>
            </li>
          </ul>
        </li>
      </ul>
HTML;
}

$files = [
    'admin.html',
    'Modules/Crowdfunding/view/liste_projets.html',
    'Modules/Crowdfunding/view/liste_donations.html',
    'Modules/E-Administration/view/gestion_types.html',
    'Modules/E-Administration/view/liste_demandes.html',
    'Modules/Geo-Services/View/liste_poi.html',
    'Modules/Transport/View/back/list_transport.html',
    'Modules/Signalement/view/liste_signalements.html',
    'Modules/User/View/user_list.html'
];

foreach ($files as $file) {
    if (!file_exists($file)) {
        echo "File not found: $file\n";
        continue;
    }

    $content = file_get_contents($file);
    $sidebar = buildSidebar($file);
    $newContent = preg_replace('/<ul class="menu-inner">.*?<\/ul>\s*<\/aside>/s', $sidebar . "\n    </aside>", $content);

    if ($newContent !== $content) {
        file_put_contents($file, $newContent);
        echo "Updated $file\n";
    } else {
        echo "No changes needed or regex failed for $file\n";
    }
}
