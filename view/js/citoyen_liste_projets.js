var _allProjets  = [];
var _voteCounts  = {};
var _isLoggedIn  = false;
var _isAdmin     = false;
var _currentUserCin = null;
var _userLocation = null;
var _projectBasePath = detectProjectBasePath();
var _defaultProjectImage = '../../../assets/img/RawShape.png';
var _pendingProjectOpenId = getProjectIdFromUrl();

document.addEventListener('DOMContentLoaded', function () {
    // Check session first, then load projects
    fetch('../../User/Controller/auth.php')
        .then(function (r) { return r.json(); })
        .then(function (session) {
            _isLoggedIn = session.logged_in === true;
            _isAdmin = String(session.role || '').toLowerCase() === 'admin';
            _currentUserCin = session.num_cin ? String(session.num_cin) : null;
            if (_isLoggedIn) loadUserLocationFromProfile();
            loadBrowserLocation();
        })
        .catch(function () {
            _isLoggedIn = false;
            _isAdmin = false;
            _currentUserCin = null;
            loadBrowserLocation();
        })
        .finally(function () { chargerProjets(); });

    document.getElementById('searchInput').addEventListener('input',   filtrer);
    document.getElementById('filterStatut').addEventListener('change', filtrer);
    document.getElementById('filterType').addEventListener('change',   filtrer);
    document.getElementById('filterVille').addEventListener('input',   filtrer);
    document.getElementById('sortSelect').addEventListener('change',   trier);
    document.getElementById('btnViewGrid').addEventListener('click', function () { setView('grid'); });
    document.getElementById('btnViewList').addEventListener('click', function () { setView('list'); });
});

function setView(mode) {
    var container = document.getElementById('projetsContainer');
    if (mode === 'list') {
        container.classList.add('list-view');
        document.getElementById('btnViewList').classList.add('active');
        document.getElementById('btnViewGrid').classList.remove('active');
    } else {
        container.classList.remove('list-view');
        document.getElementById('btnViewGrid').classList.add('active');
        document.getElementById('btnViewList').classList.remove('active');
    }
}

function loadUserLocationFromProfile() {
    fetch('../../User/Controller/get_current_user.php')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (!data.success || !data.user) return;
            if (!_currentUserCin && data.user.num_cin) _currentUserCin = String(data.user.num_cin);

            var lat = parseFloat(data.user.latitude_domicile);
            var lng = parseFloat(data.user.longitude_domicile);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                _userLocation = { lat: lat, lng: lng };
                if (_allProjets.length && document.getElementById('sortSelect').value === 'distance') {
                    afficherProjets(sortProjects(_allProjets, 'distance'));
                }
            }
        })
        .catch(function () {});
}

function loadBrowserLocation(callback) {
    if (!navigator.geolocation) {
        if (callback) callback(false);
        return;
    }

    navigator.geolocation.getCurrentPosition(function (position) {
        _userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        if (_allProjets.length && document.getElementById('sortSelect').value === 'distance') {
            afficherProjets(sortProjects(_allProjets, 'distance'));
        }
        if (callback) callback(true);
    }, function () {
        if (callback) callback(false);
    }, {
        enableHighAccuracy: false,
        timeout: 6000,
        maximumAge: 300000
    });
}

function chargerProjets() {
    const spinner  = document.getElementById('loadingSpinner');
    const alertBox = document.getElementById('alertBox');

    spinner.style.display = 'block';
    document.getElementById('projetsContainer').innerHTML = '';

    Promise.all([
        fetch('../controller/ProjetCrowdfundingController.php?action=getPublic&_=' + Date.now(), { cache: 'no-store' }).then(function (r) {
            if (!r.ok) throw new Error('Réponse invalide');
            return r.json();
        }),
        fetch('../controller/VoteController.php?action=allCounts').then(function (r) {
            return r.json();
        }).catch(function () { return {}; })
    ])
    .then(function (results) {
        var projets = results[0];
        var votes   = results[1];
        spinner.style.display = 'none';
        _allProjets = projets;
        _voteCounts = votes;
        afficherProjets(sortProjects(projets, document.getElementById('sortSelect').value));
        openPendingProjectFromUrl();
    })
    .catch(function (err) {
        spinner.style.display = 'none';
        console.error(err);
        alertBox.innerHTML = '<div class="alert alert-danger">Impossible de charger les projets.</div>';
    });
}

function afficherProjets(projets) {
    const container = document.getElementById('projetsContainer');
    const emptyMsg  = document.getElementById('emptyMsg');
    container.innerHTML = '';

    if (projets.length === 0) { emptyMsg.classList.remove('d-none'); return; }
    emptyMsg.classList.add('d-none');

    const groupedProjets = [];
    const working = projets.filter(p => normalizeStatutKey(p.statut_projet) !== 'termine');
    const finished = projets.filter(p => normalizeStatutKey(p.statut_projet) === 'termine');
    if (working.length) groupedProjets.push({ __section: true, title: 'Projets en cours', count: working.length }, ...working);
    if (finished.length) groupedProjets.push({ __section: true, title: 'Projets termines', count: finished.length }, ...finished);

    groupedProjets.forEach(function (p) {
        if (p.__section) {
            const heading = document.createElement('div');
            heading.className = 'col-12 cf-project-section-title';
            heading.innerHTML = `<div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-2 mb-1"><h3 class="h5 fw-bold mb-0">${escHtml(p.title)}</h3><span class="badge bg-primary">${p.count}</span></div>`;
            container.appendChild(heading);
            return;
        }

        const isMine   = isOwnProject(p);
        const imageUrl = projectImageUrl(p.image_url);
        const goal     = Math.max(parseFloat(p.budget_cible), 0.01);
        const raised   = parseFloat(p.montant_actuel) || 0;
        const pct      = Math.min(100, Math.round((raised / goal) * 100));
        const barColor = pct >= 100 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-danger';
        const { badge, bandColor } = statutInfo(p.statut_projet);
        const projectDescription = String(p.description || '');
        p.description = projectDescription;
        const desc = projectDescription.length > 130
            ? p.description.substring(0, 130) + '…' : p.description;

        const ownerName = projectAuthorName(p);
        const ownerHref = profileUrl(p.createur_citoyen_id, p.num_cin);
        const voteState = _voteCounts[p.id_projet] || { like: 0, dislike: 0, user_vote: null };
        const isLiked = voteState.user_vote === 'like';

        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6';
        col.setAttribute('data-titre',  (p.titre         || '').toLowerCase());
        col.setAttribute('data-statut', normalizeStatutKey(p.statut_projet));
        col.setAttribute('data-type',   (p.type_projet   || '').toLowerCase());
        col.setAttribute('data-ville',  (p.ville         || '').toLowerCase());
        col.setAttribute('data-own', isMine ? '1' : '0');

        col.innerHTML = `
            <div class="card projet-card h-100" data-projet-id="${p.id_projet}">
                <span class="project-save-ribbon ${isLiked ? 'is-visible' : ''}" aria-hidden="${isLiked ? 'false' : 'true'}" title="Projet sauvegarde">
                    <i class="bi bi-bookmark-fill"></i>
                </span>
                <div class="projet-card-image-wrap">
                    <img class="projet-card-image" src="${escHtml(imageUrl)}" alt="${escHtml(p.titre || 'Projet')}" onerror="this.onerror=null;this.src='${escHtml(_defaultProjectImage)}';">
                    ${isMine ? '<span class="my-project-badge"><i class="bi bi-stars"></i> Mon projet</span>' : ''}
                </div>
                <div class="card-header-band" style="background:${bandColor};"></div>
                <div class="card-body d-flex flex-column p-4">

                    <div class="project-main-info">
                    <div class="project-type-chip-wrap mb-2">
                        <span class="project-type-chip">${typeIcon(p.type_projet)} ${formatType(p.type_projet)}</span>
                    </div>

                    <h5 class="card-title project-card-title fw-bold mb-1" style="color:#112f8d;">${escHtml(p.titre)}</h5>
                    <a href="${escHtml(ownerHref)}" class="project-card-owner small fw-semibold mb-2 text-decoration-none d-inline-flex align-items-center gap-1" style="color:#e86a1e;">
                        <i class="bi bi-person-circle"></i> Projet propose par ${escHtml(ownerName)}
                    </a>
                    <p class="project-card-location text-muted small mb-3">
                        <i class="bi bi-geo-alt-fill me-1"></i>${escHtml(p.ville)}, ${escHtml(p.quartier)}
                    </p>

                    <p class="card-text flex-grow-1" style="font-size:.9rem; color:#555;">${escHtml(desc)}</p>
                    <div class="card-click-hint mb-1"><i class="bi bi-eye me-1"></i>Cliquez pour voir les détails</div>

                    </div>

                    <div class="project-side-panel">
                    <div class="proj-progress mt-3">
                        <div class="d-flex justify-content-between small mb-1">
                            <span>Collecté : <strong style="color:#e86a1e;">${formatTnd(raised)}</strong></span>
                            <span>Objectif : <strong>${formatTnd(goal)}</strong></span>
                        </div>
                        <div class="progress" style="height:9px;">
                            <div class="progress-bar ${barColor}" role="progressbar"
                                 style="width:${pct}%" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                        <div class="text-end small mt-1 text-muted">${pct}% financé</div>
                    </div>

                    <div class="proj-actions d-flex justify-content-between align-items-center mt-4">
                        <!-- Bottom-left: like + dislike -->
                        <div class="d-flex gap-2 align-items-center">
                            <div class="lk-tooltip btn-like" data-id="${p.id_projet}">
                                <button type="button" aria-label="J'aime ce projet" class="lk-sizer lk-trigger">
                                    <svg class="lk-sizer lk-heart" viewBox="0 0 256 256" stroke-width="0" fill="currentColor" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <path opacity="0.2" class="lk-fill" d="M232,102c0,66-104,122-104,122S24,168,24,102A54,54,0,0,1,78,48c22.59,0,41.94,12.31,50,32,8.06-19.69,27.41-32,50-32A54,54,0,0,1,232,102Z"></path>
                                        <path d="M178,40c-20.65,0-38.73,8.88-50,23.89C116.73,48.88,98.65,40,78,40a62.07,62.07,0,0,0-62,62c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,228.66,240,172,240,102A62.07,62.07,0,0,0,178,40ZM128,214.8C109.74,204.16,32,155.69,32,102A46.06,46.06,0,0,1,78,56c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,155.61,146.24,204.15,128,214.8Z"></path>
                                    </svg>
                                    <svg class="lk-sizer lk-checkround" viewBox="0 0 44 44">
                                        <path transform="translate(-2.000000, -2.000000)" d="M 39.7428882,11.5937758 C35.2809627,6.53125861 30.0333333,4 24,4 C12.95,4 4,12.95 4,24 C4,35.05 12.95,44 24,44 C35.05,44 44,35.05 44,24 C44,19.3 42.5809627,15.1645919 39.7428882,11.5937758"></path>
                                    </svg>
                                </button>
                                <div class="lk-content">
                                    J'aime <span class="lk-cnt" data-decrease="0" data-increase="0"></span>
                                </div>
                            </div>
                            <div class="dk-tooltip btn-dislike" data-id="${p.id_projet}">
                                <button type="button" aria-label="Je n'aime pas" class="lk-sizer dk-trigger">
                                    <i class="bi bi-hand-thumbs-down-fill dk-thumb-icon"></i>
                                    <svg class="lk-sizer dk-checkround" viewBox="0 0 44 44">
                                        <path transform="translate(-2.000000, -2.000000)" d="M 39.7428882,11.5937758 C35.2809627,6.53125861 30.0333333,4 24,4 C12.95,4 4,12.95 4,24 C4,35.05 12.95,44 24,44 C35.05,44 44,35.05 44,24 C44,19.3 42.5809627,15.1645919 39.7428882,11.5937758"></path>
                                    </svg>
                                </button>
                                <div class="dk-content">
                                    Je n'aime pas <span class="dk-cnt" data-decrease="0" data-increase="0"></span>
                                </div>
                            </div>
                        </div>

                        <!-- Bottom-right: comment + donate -->
                        <div class="d-flex gap-2 align-items-center">
                            <button class="cm-bookmarkBtn btn-open-modal"
                                    data-id="${p.id_projet}" data-scroll-comments="true">
                                <span class="cm-IconContainer">
                                    <svg fill="white" viewBox="0 0 512 512" height="1em"><path d="M123.6 391.3c12.9-9.4 29.6-11.8 44.6-6.4c26.5 9.6 56.2 15.1 87.8 15.1c124.7 0 208-80.5 208-160s-83.3-160-208-160S48 160.5 48 240c0 32 12.4 62.8 35.7 89.2c8.6 9.7 12.8 22.5 11.8 35.5c-1.4 18.1-5.7 34.7-11.3 49.4c17-7.9 31.1-16.7 39.4-22.7zM21.2 431.9c1.8-2.7 3.5-5.4 5.1-8.1c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208s-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6c-15.1 6.6-32.3 12.6-50.1 16.1c-.8 .2-1.6 .3-2.4 .5c-4.4 .8-8.7 1.5-13.2 1.9c-.2 0-.5 .1-.7 .1c-5.1 .5-10.2 .8-15.3 .8c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4c4.1-4.2 7.8-8.7 11.3-13.5c1.7-2.3 3.3-4.6 4.8-6.9c.1-.2 .2-.3 .3-.5z"></path></svg>
                                </span>
                                <p class="cm-text">Commenter</p>
                            </button>
                            <a href="citoyen_nouvelle_donation.html?id_projet=${p.id_projet}" class="dn-bookmarkBtn">
                                <span class="dn-IconContainer">
                                    <svg fill="white" viewBox="0 0 576 512" height="1em"><path d="M400 96l0 .7c-5.3-.4-10.6-.7-16-.7L256 96c-16.5 0-32.5 1.5-48 4.4L208 96c0-35.3 28.7-64 64-64l64 0c35.3 0 64 28.7 64 64zM144 192l288 0c17.7 0 32 14.3 32 32l0 32-112 0c-26.5 0-48 21.5-48 48l0 8c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-8c0-26.5-21.5-48-48-48L96 256l0-32c0-17.7 14.3-32 32-32zM64 288l48 0c8.8 0 16 7.2 16 16l0 8c0 35.3 28.7 64 64 64l16 0c35.3 0 64-28.7 64-64l0-8c0-8.8 7.2-16 16-16l48 0 16 0c8.8 0 16 7.2 16 16l0 8c0 35.3 28.7 64 64 64l16 0c35.3 0 64-28.7 64-64l0-8c0-8.8 7.2-16 16-16l48 0 16 0c8.8 0 16 7.2 16 16l0 176c0 17.7-14.3 32-32 32L32 512c-17.7 0-32-14.3-32-32L0 304c0-8.8 7.2-16 16-16l48 0z"/></svg>
                                </span>
                                <p class="dn-text">Donner</p>
                            </a>
                        </div>
                    </div>
                    </div>
                </div>
            </div>`;
        container.appendChild(col);
    });

    // Vote buttons (like + dislike)
    document.querySelectorAll('.btn-like, .btn-dislike').forEach(function (btn) {
        const id   = btn.getAttribute('data-id');
        const type = btn.classList.contains('btn-like') ? 'like' : 'dislike';
        const cv   = _voteCounts[id] || { like: 0, dislike: 0, user_vote: null };

        if (type === 'like') {
            var span = btn.querySelector('.lk-cnt');
            span.setAttribute('data-decrease', cv.like);
            span.setAttribute('data-increase', cv.like + 1);
            if (cv.user_vote === 'like') activateLike(btn);
            btn.querySelector('.lk-trigger').addEventListener('click', function (e) {
                e.stopPropagation();
                voteAction(parseInt(id), 'like');
            });
        } else {
            var dspan = btn.querySelector('.dk-cnt');
            dspan.setAttribute('data-decrease', cv.dislike);
            dspan.setAttribute('data-increase', cv.dislike + 1);
            if (cv.user_vote === 'dislike') activateDislike(btn);
            btn.querySelector('.dk-trigger').addEventListener('click', function (e) {
                e.stopPropagation();
                voteAction(parseInt(id), 'dislike');
            });
        }
    });

    // Card click → open modal (ignore clicks on buttons/links/vote-widget)
    document.querySelectorAll('.card[data-projet-id]').forEach(function (card) {
        card.addEventListener('click', function (e) {
            if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.lk-tooltip') || e.target.closest('.dk-tooltip')) return;
            openProjetModal(card.getAttribute('data-projet-id'), false);
        });
    });

    // "Commenter" button → open modal scrolled to comments
    document.querySelectorAll('.btn-open-modal').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            openProjetModal(btn.getAttribute('data-id'), true);
        });
    });
}

function filtrer() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const statut = document.getElementById('filterStatut').value.toLowerCase();
    const type   = document.getElementById('filterType').value.toLowerCase();
    const ville  = document.getElementById('filterVille').value.toLowerCase().trim();
    let visible  = 0;

    document.querySelectorAll('#projetsContainer > .col-lg-4').forEach(function (col) {
        const show = (!search || col.getAttribute('data-titre').includes(search))
                  && (!statut || col.getAttribute('data-statut') === statut)
                  && (!type   || col.getAttribute('data-type')   === type)
                  && (!ville  || col.getAttribute('data-ville').includes(ville));
        col.style.display = show ? '' : 'none';
        if (show) visible++;
    });
    document.querySelectorAll('#projetsContainer > .cf-project-section-title').forEach(function (heading) {
        let next = heading.nextElementSibling;
        let hasVisible = false;
        while (next && !next.classList.contains('cf-project-section-title')) {
            if (next.classList.contains('col-lg-4') && next.style.display !== 'none') {
                hasVisible = true;
                break;
            }
            next = next.nextElementSibling;
        }
        heading.style.display = hasVisible ? '' : 'none';
    });
    document.getElementById('emptyMsg').classList.toggle('d-none', visible > 0);
}

function trier() {
    const val = document.getElementById('sortSelect').value;
    if (val === 'distance' && !_userLocation) {
        loadBrowserLocation(function () {
            afficherProjets(sortProjects(_allProjets, val));
        });
        return;
    }

    afficherProjets(sortProjects(_allProjets, val));
}

function normalizeStatutKey(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function sortProjects(projets, mode) {
    return projets.slice().sort(function (a, b) {
        var mineDiff = (isOwnProject(b) ? 1 : 0) - (isOwnProject(a) ? 1 : 0);
        if (mineDiff !== 0) return mineDiff;

        switch (mode) {
            case 'budget_asc':
                return parseFloat(a.budget_cible) - parseFloat(b.budget_cible);
            case 'budget_desc':
                return parseFloat(b.budget_cible) - parseFloat(a.budget_cible);
            case 'distance':
            default:
                return projectDistance(a) - projectDistance(b);
        }
    });
}

function isOwnProject(p) {
    return _currentUserCin !== null && String(p.num_cin || '') === String(_currentUserCin);
}

function projectDistance(p) {
    if (!_userLocation) return 999999999;
    var lat = parseFloat(p.latitude);
    var lng = parseFloat(p.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 999999999;
    return haversineDistance(_userLocation.lat, _userLocation.lng, lat, lng);
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    var toRad = function (value) { return value * Math.PI / 180; };
    var radius = 6371;
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
        * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function profileUrl(citoyenId, cin) {
    var base = projectBasePath();
    var root = base ? base : '';
    var id = String(citoyenId || '').trim();
    if (id) return root + '/Modules/Social/View/profile.html?id=' + encodeURIComponent(id);

    var cleanCin = String(cin || '').trim();
    if (cleanCin) return root + '/Modules/Social/View/profile.html?cin=' + encodeURIComponent(cleanCin);

    return root + '/Modules/Social/View/profile.html';
}

function projectAuthorName(p) {
    var fullName = [p.createur_prenom, p.createur_nom].filter(Boolean).join(' ').trim();
    return fullName || 'Citoyen CivicPlus';
}

function formatTnd(value) {
    var amount = parseFloat(value) || 0;
    return amount.toFixed(2) + ' TND';
}

function formatDisplayDate(value) {
    if (!value) return '';
    var date = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return String(value).substring(0, 10);
    return date.toLocaleDateString('fr-FR');
}

function getProjectIdFromUrl() {
    try {
        var value = new URLSearchParams(window.location.search).get('project');
        var id = parseInt(value, 10);
        return Number.isFinite(id) && id > 0 ? id : null;
    } catch (error) {
        return null;
    }
}

function openPendingProjectFromUrl() {
    if (!_pendingProjectOpenId) return;
    var id = _pendingProjectOpenId;
    _pendingProjectOpenId = null;
    window.setTimeout(function () {
        openProjetModal(id, false);
    }, 80);
}

function projectPlaceLabel(p) {
    return [p.quartier, p.ville].filter(function (part) {
        return String(part || '').trim() !== '';
    }).join(', ') || 'Lieu du projet';
}

function projectCoordinates(p) {
    var lat = parseFloat(p.latitude);
    var lng = parseFloat(p.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat: lat, lng: lng };
}

function projectMapsUrl(p) {
    var coords = projectCoordinates(p);
    if (coords) {
        return 'https://www.google.com/maps/search/?api=1&query='
            + encodeURIComponent(coords.lat.toFixed(6) + ',' + coords.lng.toFixed(6));
    }

    return 'https://www.google.com/maps/search/?api=1&query='
        + encodeURIComponent(projectPlaceLabel(p) + ', Tunisie');
}

function renderModalLocation(p) {
    var el = document.getElementById('modalLocation');
    if (!el) return;

    el.innerHTML =
        '<button type="button" class="cf-location-link" title="Ouvrir ce lieu dans Google Maps">' +
            '<i class="bi bi-geo-alt-fill me-1"></i>' + escHtml(projectPlaceLabel(p)) +
        '</button>';

    var button = el.querySelector('.cf-location-link');
    if (button) {
        button.addEventListener('click', function () {
            showProjectLocationPopup(p);
        });
    }
}

function showProjectLocationPopup(p) {
    var existing = document.querySelector('.cf-location-popup');
    if (existing) existing.remove();

    var coords = projectCoordinates(p);
    var place = projectPlaceLabel(p);
    var url = projectMapsUrl(p);
    var coordinatesText = coords
        ? 'Coordonnees exactes: ' + coords.lat.toFixed(6) + ', ' + coords.lng.toFixed(6)
        : 'Google Maps cherchera ce lieu par nom.';

    var wrapper = document.createElement('div');
    wrapper.className = 'cf-popup-backdrop cf-location-popup';
    wrapper.innerHTML =
        '<div class="cf-popup-card" role="dialog" aria-modal="true" aria-label="Lieu du projet">' +
            '<div class="cf-popup-icon"><i class="bi bi-geo-alt-fill"></i></div>' +
            '<h5>Lieu du projet</h5>' +
            '<div class="cf-place-detail">' + escHtml(place) + '</div>' +
            '<div class="cf-place-coordinates">' + escHtml(coordinatesText) + '</div>' +
            '<p>Ouvrir ce point dans Google Maps ?</p>' +
            '<div class="cf-popup-actions">' +
                '<button type="button" class="btn btn-outline-secondary btn-sm" data-cf-location-close>Fermer</button>' +
                '<a class="btn btn-primary btn-sm" href="' + escHtml(url) + '" target="_blank" rel="noopener">Ouvrir Google Maps</a>' +
            '</div>' +
        '</div>';

    document.body.appendChild(wrapper);
    wrapper.addEventListener('click', function (event) {
        if (event.target === wrapper || event.target.closest('[data-cf-location-close]')) {
            wrapper.remove();
        }
    });
}

function projectImageUrl(src) {
    src = String(src || '').trim();
    if (!src) return _defaultProjectImage;
    if (/^https?:\/\//i.test(src)) return src;
    if (/^data:/i.test(src) || /^blob:/i.test(src)) return src;
    src = src.replace(/\\/g, '/').replace(/^(\.\/|\.\.\/)+/, '');
    if (src.charAt(0) === '/') return src;
    if (/^Modules\//i.test(src) || /^assets\//i.test(src)) return '/civicplus/' + src;
    return _defaultProjectImage;
}

function formatStatut(s) {
    var normalized = String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const map = { 'en_cours':'En cours', 'termine':'Termine' };
    return map[normalized] || s;
}

function formatType(t) {
    const map = { 'infrastructure':'Infrastructure', 'sante':'Santé', 'education':'Éducation',
                  'environnement':'Environnement', 'culture':'Culture', 'sport':'Sport', 'autre':'Autre' };
    return map[t] || (t || 'Autre');
}

function typeIcon(t) {
    const map = { 'infrastructure':'🏗️', 'sante':'🏥', 'education':'📚',
                  'environnement':'🌿', 'culture':'🎭', 'sport':'⚽', 'autre':'💡' };
    return map[t] || '💡';
}

function statutInfo(s) {
    var normalized = String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const map = {
        'en_cours':                 { badge:'bg-primary text-white', bandColor:'#112f8d' },
        'termine':                  { badge:'bg-secondary text-white',bandColor:'#6c757d' },
    };
    return map[normalized] || { badge:'bg-secondary', bandColor:'#6c757d' };
}

function activateLike(btn) {
    var trigger = btn.querySelector('.lk-trigger');
    if (trigger) trigger.classList.add('lk-liked');
    var span = btn.querySelector('.lk-cnt');
    if (span) {
        var c = parseInt(span.getAttribute('data-increase')) || 0;
        span.setAttribute('data-decrease', c - 1);
        span.setAttribute('data-increase', c);
    }
}
function deactivateLike(btn) {
    var trigger = btn.querySelector('.lk-trigger');
    if (trigger) trigger.classList.remove('lk-liked');
    var span = btn.querySelector('.lk-cnt');
    if (span) {
        var c = parseInt(span.getAttribute('data-decrease')) || 0;
        span.setAttribute('data-decrease', c);
        span.setAttribute('data-increase', c + 1);
    }
}
function activateDislike(btn) {
    var trigger = btn.querySelector('.dk-trigger');
    if (trigger) trigger.classList.add('dk-disliked');
    var span = btn.querySelector('.dk-cnt');
    if (span) {
        var c = parseInt(span.getAttribute('data-increase')) || 0;
        span.setAttribute('data-decrease', c - 1);
        span.setAttribute('data-increase', c);
    }
}
function deactivateDislike(btn) {
    var trigger = btn.querySelector('.dk-trigger');
    if (trigger) trigger.classList.remove('dk-disliked');
    var span = btn.querySelector('.dk-cnt');
    if (span) {
        var c = parseInt(span.getAttribute('data-decrease')) || 0;
        span.setAttribute('data-decrease', c);
        span.setAttribute('data-increase', c + 1);
    }
}

function setProjectSavedState(card, isSaved) {
    var ribbon = card ? card.querySelector('.project-save-ribbon') : null;
    if (!ribbon) return;
    ribbon.classList.toggle('is-visible', isSaved);
    ribbon.setAttribute('aria-hidden', isSaved ? 'false' : 'true');
}

function voteAction(id_projet, type_vote) {
    if (!_isLoggedIn) {
        showAuthToast();
        return;
    }

    var formData = new FormData();
    formData.append('action',    'vote');
    formData.append('id_projet', id_projet);
    formData.append('type_vote', type_vote);

    fetch('../controller/VoteController.php', { method: 'POST', body: formData })
        .then(function (r) {
            if (r.status === 401) throw new Error('non_authentifie');
            return r.json();
        })
        .then(function (data) {
            if (!data.success) return;
            var counts = data.counts;
            _voteCounts[id_projet] = counts;

            document.querySelectorAll('.card[data-projet-id="' + id_projet + '"]').forEach(function (card) {
                var likeBtn    = card.querySelector('.btn-like');
                var dislikeBtn = card.querySelector('.btn-dislike');
                setProjectSavedState(card, counts.user_vote === 'like');
                if (likeBtn) {
                    var span = likeBtn.querySelector('.lk-cnt');
                    if (span) {
                        span.setAttribute('data-decrease', counts.like);
                        span.setAttribute('data-increase', counts.like + 1);
                    }
                    if (counts.user_vote === 'like') activateLike(likeBtn); else deactivateLike(likeBtn);
                }
                if (dislikeBtn) {
                    var dspan = dislikeBtn.querySelector('.dk-cnt');
                    if (dspan) {
                        dspan.setAttribute('data-decrease', counts.dislike);
                        dspan.setAttribute('data-increase', counts.dislike + 1);
                    }
                    if (counts.user_vote === 'dislike') activateDislike(dislikeBtn); else deactivateDislike(dislikeBtn);
                }
            });
        })
        .catch(function (err) {
            if (err.message === 'non_authentifie') {
                _isLoggedIn = false;
                showAuthToast();
            }
        });
}

function showAuthToast() {
    var toastEl = document.getElementById('authToast');
    if (!toastEl) return;
    var toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 4000 });
    toast.show();
}

// ===== Modal Projet =====
var _currentModalProjetId = null;
var _currentModalUpdates = [];

function openProjetModal(id, scrollToComments) {
    id = parseInt(id);
    _currentModalProjetId = id;
    var p = _allProjets.find(function (x) { return parseInt(x.id_projet) === id; });
    if (!p) return;

    var goal    = Math.max(parseFloat(p.budget_cible), 0.01);
    var raised  = parseFloat(p.montant_actuel) || 0;
    var pct     = Math.min(100, Math.round((raised / goal) * 100));
    var info    = statutInfo(p.statut_projet);
    var modalImage = document.getElementById('modalProjectImage');
    if (modalImage) {
        modalImage.src = projectImageUrl(p.image_url);
        modalImage.alt = p.titre || 'Projet';
        modalImage.onerror = function () {
            this.onerror = null;
            this.src = _defaultProjectImage;
        };
    }

    document.getElementById('projetModalLabel').textContent = p.titre || '';
    renderModalLocation(p);
    var madeDate = formatDisplayDate(p.date_creation || p.decision_admin_at);
    document.getElementById('modalProjectDate').innerHTML = madeDate
        ? '<i class="bi bi-calendar-event me-1"></i>' + escHtml(madeDate)
        : '';
    document.getElementById('modalTypeBadge').innerHTML =
        typeIcon(p.type_projet) + ' ' + formatType(p.type_projet);
    document.getElementById('modalTypeBadge').style.cssText =
        'background:#ffffff33; color:#fff; border-radius:20px; font-size:.78rem;';
    document.getElementById('modalRaised').textContent = formatTnd(raised);
    document.getElementById('modalGoal').textContent   = formatTnd(goal);
    var bar = document.getElementById('modalProgressBar');
    bar.style.width = pct + '%';
    bar.className   = 'progress-bar ' + (pct >= 100 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-danger');
    document.getElementById('modalPct').textContent     = pct + '% financé';
    document.getElementById('modalStatut').textContent  = formatStatut(p.statut_projet);
    document.getElementById('modalStatut').className    = 'badge ' + info.badge;
    document.getElementById('modalDescription').textContent = p.description || '';
    document.getElementById('modalDonnerBtn').href = 'citoyen_nouvelle_donation.html?id_projet=' + id;
    var ownerBox = document.getElementById('modalProjectOwner');
    if (ownerBox) {
        var ownerPhoto = commentPhotoUrl(p.createur_photo);
        var fallbackOwnerPhoto = commentPhotoUrl('');
        var modalOwnerName = projectAuthorName(p);
        var modalOwnerHref = profileUrl(p.createur_citoyen_id, p.num_cin);
        ownerBox.innerHTML =
            '<a href="' + escHtml(modalOwnerHref) + '" class="d-inline-flex align-items-center gap-2 text-decoration-none rounded-pill px-2 py-1" style="background:rgba(255,255,255,.14);color:#fff;">' +
                '<img src="' + escHtml(ownerPhoto) + '" alt="' + escHtml(modalOwnerName) + '" ' +
                     'style="width:24px;height:24px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,.75);" ' +
                     'onerror="this.onerror=null;this.src=\'' + escHtml(fallbackOwnerPhoto) + '\'">' +
                '<span class="small">Projet porte par <strong>' + escHtml(modalOwnerName) + '</strong><span class="mx-2">|</span>Collecté : <strong>' + escHtml(formatTnd(raised)) + '</strong></span>' +
            '</a>';
    }

    resetUpdatesUi(p);

    // Reset comment section
    document.getElementById('modalCommentsList').innerHTML =
        '<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-secondary"></div></div>';
    document.getElementById('modalCommentCount').textContent = '0';
    document.getElementById('modalCommentText').value = '';
    document.getElementById('commentFormWrapper').classList.remove('d-none');
    document.getElementById('commentLoginNotice').classList.add('d-none');

    var modal = new bootstrap.Modal(document.getElementById('projetModal'));
    modal.show();

    loadUpdates(id, p);
    loadComments(id);

    if (scrollToComments) {
        document.getElementById('projetModal').addEventListener('shown.bs.modal', function handler() {
            document.getElementById('commentsHeading').scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.getElementById('projetModal').removeEventListener('shown.bs.modal', handler);
        });
    }
}

function resetUpdatesUi(p) {
    _currentModalUpdates = [];
    selectModalImage(projectImageUrl(p.image_url), p.titre || 'Projet', null);
    renderAlbum(p, []);

    var selectedText = document.getElementById('modalSelectedUpdateText');
    if (selectedText) {
        selectedText.classList.add('d-none');
        selectedText.innerHTML = '';
    }

    var list = document.getElementById('modalUpdatesList');
    if (list) {
        list.innerHTML = '<div class="text-center py-2"><div class="spinner-border spinner-border-sm text-secondary"></div></div>';
    }

    var count = document.getElementById('modalUpdateCount');
    if (count) count.textContent = '0';

    var form = document.getElementById('updateFormWrapper');
    if (form) form.classList.toggle('d-none', !isOwnProject(p));

    var text = document.getElementById('modalUpdateText');
    var file = document.getElementById('modalUpdateImage');
    if (text) text.value = '';
    if (file) file.value = '';
}

function loadUpdates(id, p) {
    fetch('../controller/ActualiteProjetController.php?action=getByProjet&id=' + encodeURIComponent(id), { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            var updates = data && data.success && Array.isArray(data.updates) ? data.updates : [];
            _currentModalUpdates = updates;
            renderAlbum(p, updates);
            renderUpdatesList(updates);
        })
        .catch(function () {
            _currentModalUpdates = [];
            renderAlbum(p, []);
            var list = document.getElementById('modalUpdatesList');
            if (list) list.innerHTML = '<p class="text-danger small text-center mb-0">Impossible de charger les actualités.</p>';
        });
}

function renderAlbum(p, updates) {
    var album = document.getElementById('modalImageAlbum');
    if (!album) return;

    var baseImage = projectImageUrl(p.image_url);
    var buttons = [
        '<button type="button" class="modal-album-thumb active" data-album-index="-1" title="Image principale">' +
            '<img src="' + escHtml(baseImage) + '" alt="' + escHtml(p.titre || 'Projet') + '" onerror="this.onerror=null;this.src=\'' + escHtml(_defaultProjectImage) + '\'">' +
        '</button>'
    ];

    updates.forEach(function (u, index) {
        if (!u.photo_url) return;
        buttons.push(
            '<button type="button" class="modal-album-thumb" data-album-index="' + index + '" title="' + escHtml(formatActualiteTitle(u.titre_actu, index)) + '">' +
                '<img src="' + escHtml(projectImageUrl(u.photo_url)) + '" alt="' + escHtml(formatActualiteTitle(u.titre_actu, index)) + '" onerror="this.onerror=null;this.src=\'' + escHtml(_defaultProjectImage) + '\'">' +
            '</button>'
        );
    });

    album.innerHTML = buttons.join('');
    album.querySelectorAll('.modal-album-thumb').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var index = parseInt(btn.getAttribute('data-album-index'), 10);
            if (index === -1) {
                selectModalImage(baseImage, p.titre || 'Projet', null);
            } else {
                selectUpdate(updates[index], false);
            }
            album.querySelectorAll('.modal-album-thumb').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
        });
    });
}

function renderUpdatesList(updates) {
    var list = document.getElementById('modalUpdatesList');
    var count = document.getElementById('modalUpdateCount');
    if (count) count.textContent = updates.length;
    if (!list) return;

    if (updates.length === 0) {
        list.innerHTML =
            '<div class="cf-updates-empty">' +
                '<i class="bi bi-images"></i>' +
                '<div><strong>Aucune actualité</strong><span>Les nouvelles images et notes du porteur apparaîtront ici.</span></div>' +
            '</div>';
        return;
    }

    list.innerHTML = '';
    updates.forEach(function (u, index) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cf-update-item';
        btn.innerHTML =
            '<div class="d-flex justify-content-between gap-2 align-items-start">' +
                '<strong class="cf-update-title">' + escHtml(formatActualiteTitle(u.titre_actu, index)) + '</strong>' +
                '<small class="text-muted flex-shrink-0">' + escHtml(formatDisplayDate(u.date_actualite)) + '</small>' +
            '</div>' +
            '<div class="small text-muted mt-1">' + escHtml(u.contenu_actu || '') + '</div>';
        btn.addEventListener('click', function () { selectUpdate(u, true); });
        list.appendChild(btn);
    });
}

function selectUpdate(update, scrollToImage) {
    if (!update) return;
    selectModalImage(projectImageUrl(update.photo_url), formatActualiteTitle(update.titre_actu, _currentModalUpdates.indexOf(update)), update);

    var album = document.getElementById('modalImageAlbum');
    if (album) {
        album.querySelectorAll('.modal-album-thumb').forEach(function (btn) {
            btn.classList.toggle('active', parseInt(btn.getAttribute('data-album-index'), 10) === _currentModalUpdates.indexOf(update));
        });
    }

    if (scrollToImage) {
        document.getElementById('modalMediaSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function selectModalImage(src, alt, update) {
    var image = document.getElementById('modalProjectImage');
    if (image) {
        image.src = src || _defaultProjectImage;
        image.alt = alt || 'Projet';
        image.onerror = function () {
            this.onerror = null;
            this.src = _defaultProjectImage;
        };
    }

    var selectedText = document.getElementById('modalSelectedUpdateText');
    if (!selectedText) return;
    if (!update) {
        selectedText.classList.add('d-none');
        selectedText.innerHTML = '';
        return;
    }

    selectedText.classList.remove('d-none');
    selectedText.innerHTML =
        '<strong>' + escHtml(formatActualiteTitle(update.titre_actu, _currentModalUpdates.indexOf(update))) + '</strong>' +
        '<span class="ms-2">' + escHtml(formatDisplayDate(update.date_actualite)) + '</span>' +
        '<div>' + escHtml(update.contenu_actu || '') + '</div>';
}

function formatActualiteTitle(title, index) {
    var value = String(title || '').trim();
    var fallbackNumber = Number.isFinite(index) && index >= 0 ? index + 1 : 1;
    if (!value) return 'Mise à jour ' + fallbackNumber;

    var match = value.match(/^update\s+(\d+)$/i);
    if (match) return 'Mise à jour ' + match[1];

    return value;
}

function loadComments(id) {
    fetch('../controller/CommentaireController.php?action=getByProjet&id=' + id)
        .then(function (r) { return r.json(); })
        .then(function (comments) {
            var list = document.getElementById('modalCommentsList');
            if (!Array.isArray(comments)) comments = [];
            document.getElementById('modalCommentCount').textContent = comments.length;
            if (comments.length === 0) {
                list.innerHTML = '<p class="cf-comments-empty text-muted text-center small py-2">Aucun commentaire. Soyez le premier !</p>';
                return;
            }
            list.innerHTML = '';
            comments.forEach(function (c) { list.appendChild(renderComment(c)); });
            list.scrollTop = list.scrollHeight;
        })
        .catch(function () {
            document.getElementById('modalCommentsList').innerHTML =
                '<p class="text-danger small text-center">Impossible de charger les commentaires.</p>';
        });
}

function renderComment(c) {
    var d = document.createElement('div');
    d.className = 'cf-comment-item d-flex gap-2 mb-2 align-items-start';
    d.setAttribute('data-comment-id', c.id_commentaire || '');
    var date   = c.date_publication ? c.date_publication.substring(0, 10) : '';
    var auteur = (c.auteur && c.auteur.trim()) ? escHtml(c.auteur) : 'Anonyme';
    var photo  = commentPhotoUrl(c.auteur_photo_url || c.auteur_photo);
    var fallbackPhoto = commentPhotoUrl('');
    var profileHref = profileUrl(c.auteur_citoyen_id, c.num_cin);
    var isCensored = c.statut === 'censure' || c.contenu === '***************';
    var statutBadge = (_isAdmin && c.statut && c.statut !== 'visible')
        ? '<span class="badge bg-warning text-dark ms-1">' + (isCensored ? 'Censure' : 'Masque') + '</span>'
        : '';
    var deleteButton = (_isAdmin && c.id_commentaire)
        ? '<button type="button" class="btn btn-sm btn-outline-danger py-0 px-1 cf-delete-comment-btn" title="Supprimer ce commentaire" aria-label="Supprimer ce commentaire"><i class="bi bi-trash3"></i></button>'
        : '';
    d.innerHTML =
        '<a href="' + escHtml(profileHref) + '" class="flex-shrink-0" title="Voir le profil de ' + auteur + '">' +
            '<img src="' + escHtml(photo) + '" alt="' + auteur + '" ' +
                 'style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #f0f4ff;" ' +
                 'onerror="this.onerror=null;this.src=\'' + escHtml(fallbackPhoto) + '\'">' +
        '</a>' +
        '<div class="flex-grow-1 p-2 rounded" style="background:#f0f4ff;">' +
            '<div class="d-flex justify-content-between align-items-start gap-2 mb-1">' +
                '<div class="d-flex align-items-center gap-1 flex-wrap">' +
                    '<a href="' + escHtml(profileHref) + '" class="small fw-bold text-decoration-none" style="color:#112f8d;">' + auteur + '</a>' +
                    statutBadge +
                '</div>' +
                '<div class="d-flex align-items-center gap-1 flex-shrink-0">' +
                    '<span class="text-muted" style="font-size:.75rem;">' + escHtml(date) + '</span>' +
                    deleteButton +
                '</div>' +
            '</div>' +
            '<p class="mb-0 small' + (isCensored ? ' text-danger fw-bold' : '') + '">' + escHtml(c.contenu) + '</p>' +
        '</div>';

    var deleteBtn = d.querySelector('.cf-delete-comment-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            deleteCommentFromModal(c.id_commentaire, deleteBtn);
        });
    }

    return d;
}

function deleteCommentFromModal(id, btn) {
    if (!_isAdmin || !id) return;

    showPopupCard({
        title: 'Supprimer le commentaire ?',
        message: 'Cette action est definitive et retirera le commentaire du projet.',
        icon: 'bi-trash3-fill',
        tone: 'danger',
        confirmText: 'Supprimer',
        confirmClass: 'btn-danger',
        cancelText: 'Annuler',
        onConfirm: function () {
            performCommentDelete(id, btn);
        }
    });
}

function performCommentDelete(id, btn) {
    btn.disabled = true;

    fetch('../controller/CommentaireController.php?action=delete&id=' + encodeURIComponent(id))
        .then(function (r) {
            if (r.status === 403) throw new Error('admin_required');
            return r.json();
        })
        .then(function (data) {
            if (!data.success) throw new Error('delete_failed');

            var item = btn.closest('.cf-comment-item');
            if (item) item.remove();

            var list = document.getElementById('modalCommentsList');
            var remaining = list.querySelectorAll('.cf-comment-item').length;
            document.getElementById('modalCommentCount').textContent = remaining;
            if (remaining === 0) {
                list.innerHTML = '<p class="cf-comments-empty text-muted text-center small py-2">Aucun commentaire. Soyez le premier !</p>';
            }
        })
        .catch(function (err) {
            btn.disabled = false;
            if (err.message === 'admin_required') {
                _isAdmin = false;
                showPopupCard({
                    title: 'Action refusee',
                    message: 'Seuls les administrateurs peuvent supprimer les commentaires.',
                    icon: 'bi-shield-lock-fill',
                    tone: 'warning',
                    confirmText: 'Compris',
                    hideCancel: true
                });
                if (_currentModalProjetId) loadComments(_currentModalProjetId);
                return;
            }
            showPopupCard({
                title: 'Suppression impossible',
                message: 'Le commentaire n\'a pas pu etre supprime. Reessayez dans un instant.',
                icon: 'bi-exclamation-circle-fill',
                tone: 'danger',
                confirmText: 'OK',
                hideCancel: true
            });
        });
}

function showPopupCard(options) {
    options = options || {};

    var backdrop = document.getElementById('cfPopupBackdrop');
    var title = document.getElementById('cfPopupTitle');
    var message = document.getElementById('cfPopupMessage');
    var icon = document.getElementById('cfPopupIcon');
    var cancelBtn = document.getElementById('cfPopupCancel');
    var confirmBtn = document.getElementById('cfPopupConfirm');

    if (!backdrop || !title || !message || !icon || !cancelBtn || !confirmBtn) {
        if (typeof options.onConfirm === 'function') options.onConfirm();
        return;
    }

    var tones = {
        danger:  { color: '#dc3545', background: '#fff0f1' },
        warning: { color: '#b45309', background: '#fff7ed' },
        success: { color: '#198754', background: '#ecfdf3' },
        info:    { color: '#112f8d', background: '#f0f4ff' }
    };
    var tone = tones[options.tone] || tones.info;

    title.textContent = options.title || '';
    message.textContent = options.message || '';
    icon.innerHTML = '<i class="bi ' + escHtml(options.icon || 'bi-info-circle-fill') + '"></i>';
    icon.style.color = tone.color;
    icon.style.background = tone.background;

    cancelBtn.textContent = options.cancelText || 'Annuler';
    cancelBtn.classList.toggle('d-none', options.hideCancel === true);

    confirmBtn.textContent = options.confirmText || 'OK';
    confirmBtn.className = 'btn ' + (options.confirmClass || 'btn-primary');

    function closePopup() {
        backdrop.classList.add('d-none');
        cancelBtn.onclick = null;
        confirmBtn.onclick = null;
        backdrop.onclick = null;
        document.removeEventListener('keydown', onKeydown);
    }

    function onKeydown(e) {
        if (e.key === 'Escape') closePopup();
    }

    cancelBtn.onclick = closePopup;
    confirmBtn.onclick = function () {
        closePopup();
        if (typeof options.onConfirm === 'function') options.onConfirm();
    };
    backdrop.onclick = function (e) {
        if (e.target === backdrop) closePopup();
    };

    backdrop.classList.remove('d-none');
    document.addEventListener('keydown', onKeydown);
    confirmBtn.focus();
}

function commentPhotoUrl(photo) {
    var src = String(photo || '').trim();
    var base = projectBasePath();
    var fallback = (base ? base : '') + '/assets/img/RawShape.png';

    if (!src) return fallback;

    src = src.replace(/\\/g, '/');
    if (/^(https?:)?\/\//i.test(src) || /^data:/i.test(src) || /^blob:/i.test(src)) return src;

    var assetsIndex = src.toLowerCase().indexOf('/assets/');
    if (assetsIndex !== -1 && src.charAt(0) !== '/') {
        src = src.slice(assetsIndex + 1);
    }

    src = src.replace(/^(\.\/|\.\.\/)+/, '');

    if (src.charAt(0) === '/') {
        if (base && src.indexOf(base + '/') === 0) return src;
        if (base && /^\/assets\//i.test(src)) return base + src;
        return src;
    }

    return (base ? base + '/' : '/') + src.replace(/^\/+/, '');
}

function projectBasePath() {
    return _projectBasePath;
}

function detectProjectBasePath() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].getAttribute('src') || '';
        if (src.indexOf('citoyen_liste_projets.js') === -1) continue;

        var scriptPath = new URL(src, window.location.href).pathname;
        var scriptModulesIndex = scriptPath.toLowerCase().indexOf('/modules/');
        if (scriptModulesIndex !== -1) return scriptPath.slice(0, scriptModulesIndex);
    }

    var path = window.location.pathname;
    var modulesIndex = path.toLowerCase().indexOf('/modules/');
    if (modulesIndex !== -1) return path.slice(0, modulesIndex);
    return path.replace(/\/[^\/]*$/, '');
}

// Publish comment from modal
var modalUpdatePublishBtn = document.getElementById('modalUpdatePublishBtn');
if (modalUpdatePublishBtn) {
    modalUpdatePublishBtn.addEventListener('click', function () {
        var p = _allProjets.find(function (x) { return parseInt(x.id_projet) === parseInt(_currentModalProjetId); });
        if (!p || !isOwnProject(p)) return;

        var text = document.getElementById('modalUpdateText').value.trim();
        var fileInput = document.getElementById('modalUpdateImage');
        var file = fileInput && fileInput.files ? fileInput.files[0] : null;
        if (!text || !file) return;

        modalUpdatePublishBtn.disabled = true;
        modalUpdatePublishBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Publication...';

        var formData = new FormData();
        formData.append('action', 'add');
        formData.append('id_projet', _currentModalProjetId);
        formData.append('contenu_actu', text);
        formData.append('photo_actualite', file);

        fetch('../controller/ActualiteProjetController.php', { method: 'POST', body: formData })
            .then(function (r) {
                if (r.status === 401) throw new Error('non_authentifie');
                if (r.status === 403) throw new Error('owner_required');
                return r.json();
            })
            .then(function (data) {
                if (!data.success || !data.update) throw new Error(data.error || 'actualite_failed');
                document.getElementById('modalUpdateText').value = '';
                document.getElementById('modalUpdateImage').value = '';
                _currentModalUpdates.push(data.update);
                renderAlbum(p, _currentModalUpdates);
                renderUpdatesList(_currentModalUpdates);
                selectUpdate(data.update, true);
            })
            .catch(function () {})
            .finally(function () {
                modalUpdatePublishBtn.disabled = false;
                modalUpdatePublishBtn.innerHTML = '<i class="bi bi-image me-1"></i> Publier l\'actualité';
            });
    });
}

document.getElementById('modalPublishBtn').addEventListener('click', function () {
    var text = document.getElementById('modalCommentText').value.trim();
    if (!text || !_currentModalProjetId) return;

    var btn = document.getElementById('modalPublishBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Publication...';

    var formData = new FormData();
    formData.append('action',    'add');
    formData.append('id_projet', _currentModalProjetId);
    formData.append('contenu',   text);

    fetch('../controller/CommentaireController.php', { method: 'POST', body: formData })
        .then(function (r) {
            if (r.status === 401) throw new Error('non_authentifie');
            if (r.status === 403) throw new Error('compte_bloqué');
            return r.json();
        })
        .then(function (data) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-send me-1"></i> Publier le commentaire';
            if (data.success && data.comment) {
                document.getElementById('modalCommentText').value = '';
                var list = document.getElementById('modalCommentsList');
                if (list.querySelector('.cf-comments-empty')) list.innerHTML = '';
                list.appendChild(renderComment(data.comment));
                list.scrollTop = list.scrollHeight;
                var cnt = document.getElementById('modalCommentCount');
                cnt.textContent = parseInt(cnt.textContent) + 1;
            }
        })
        .catch(function (err) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-send me-1"></i> Publier le commentaire';
            if (err.message === 'non_authentifie') {
                document.getElementById('commentFormWrapper').classList.add('d-none');
                document.getElementById('commentLoginNotice').classList.remove('d-none');
            } else if (err.message === 'compte_bloqué') {
                document.getElementById('commentFormWrapper').classList.add('d-none');
                document.getElementById('commentLoginNotice').classList.remove('d-none');
                document.getElementById('commentLoginNotice').innerHTML =
                    '<i class="bi bi-ban me-2 text-danger"></i><span class="text-danger fw-semibold">Votre compte a été bloqué. Vous ne pouvez plus commenter.</span>';
            }
        });
});
