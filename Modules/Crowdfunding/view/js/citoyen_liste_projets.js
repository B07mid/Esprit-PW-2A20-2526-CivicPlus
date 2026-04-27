var _allProjets  = [];
var _voteCounts  = {};
var _isLoggedIn  = false;

document.addEventListener('DOMContentLoaded', function () {
    // Check session first, then load projects
    fetch('/civicplus/Modules/User/Controller/auth.php')
        .then(function (r) { return r.json(); })
        .then(function (session) { _isLoggedIn = session.logged_in === true; })
        .catch(function () { _isLoggedIn = false; })
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

function chargerProjets() {
    const spinner  = document.getElementById('loadingSpinner');
    const alertBox = document.getElementById('alertBox');

    spinner.style.display = 'block';
    document.getElementById('projetsContainer').innerHTML = '';

    Promise.all([
        fetch('../Controller/ProjetCrowdfundingController.php?action=getAll').then(function (r) {
            if (!r.ok) throw new Error('Réponse invalide');
            return r.json();
        }),
        fetch('../Controller/VoteController.php?action=allCounts').then(function (r) {
            return r.json();
        }).catch(function () { return {}; })
    ])
    .then(function (results) {
        var projets = results[0];
        var votes   = results[1];
        spinner.style.display = 'none';
        _allProjets = projets;
        _voteCounts = votes;
        afficherProjets(projets);
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

    projets.forEach(function (p) {
        const goal     = Math.max(parseFloat(p.budget_cible), 0.01);
        const raised   = parseFloat(p.montant_actuel) || 0;
        const pct      = Math.min(100, Math.round((raised / goal) * 100));
        const barColor = pct >= 100 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-danger';
        const { badge, bandColor } = statutInfo(p.statut_projet);
        const desc = p.description.length > 130
            ? p.description.substring(0, 130) + '…' : p.description;

        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6';
        col.setAttribute('data-titre',  (p.titre         || '').toLowerCase());
        col.setAttribute('data-statut', (p.statut_projet || '').toLowerCase());
        col.setAttribute('data-type',   (p.type_projet   || '').toLowerCase());
        col.setAttribute('data-ville',  (p.ville         || '').toLowerCase());

        col.innerHTML = `
            <div class="card projet-card h-100" data-projet-id="${p.id_projet}" style="cursor:pointer;">
                <div class="card-header-band" style="background:${bandColor};"></div>
                <div class="card-body d-flex flex-column p-4">

                    <div class="mb-2">
                        <span class="badge" style="background:#f0f4ff; color:#112f8d; border-radius:20px; font-size:.75rem;">${typeIcon(p.type_projet)} ${formatType(p.type_projet)}</span>
                    </div>

                    <h5 class="card-title fw-bold mb-1" style="color:#112f8d;">${escHtml(p.titre)}</h5>
                    <p class="text-muted small mb-3">
                        <i class="bi bi-geo-alt-fill me-1"></i>${escHtml(p.ville)}, ${escHtml(p.quartier)}
                    </p>

                    <p class="card-text flex-grow-1" style="font-size:.9rem; color:#555;">${escHtml(desc)}</p>
                    <div class="card-click-hint mb-1"><i class="bi bi-eye me-1"></i>Cliquez pour voir les détails</div>

                    <div class="proj-progress mt-3">
                        <div class="d-flex justify-content-between small mb-1">
                            <span>Collecté : <strong style="color:#e86a1e;">$${raised.toFixed(2)}</strong></span>
                            <span>Objectif : <strong>$${goal.toFixed(2)}</strong></span>
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
    document.getElementById('emptyMsg').classList.toggle('d-none', visible > 0);
}

function trier() {
    const val = document.getElementById('sortSelect').value;
    if (!val) { afficherProjets(_allProjets); return; }

    const sorted = _allProjets.slice().sort(function (a, b) {
        switch (val) {
            case 'nom_asc':     return (a.titre || '').localeCompare(b.titre || '');
            case 'nom_desc':    return (b.titre || '').localeCompare(a.titre || '');
            case 'budget_asc':  return parseFloat(a.budget_cible) - parseFloat(b.budget_cible);
            case 'budget_desc': return parseFloat(b.budget_cible) - parseFloat(a.budget_cible);
            case 'type_asc':    return (a.type_projet || '').localeCompare(b.type_projet || '');
            default: return 0;
        }
    });
    afficherProjets(sorted);
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatStatut(s) {
    const map = { 'en_recherche_financement':'Recherche de financement', 'financé':'Financé',
                  'en_cours':'En cours', 'terminé':'Terminé', 'annulé':'Annulé' };
    return map[s] || s;
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
    const map = {
        'en_recherche_financement': { badge:'bg-info text-dark',    bandColor:'#0dcaf0' },
        'financé':                  { badge:'bg-success text-white', bandColor:'#198754' },
        'en_cours':                 { badge:'bg-primary text-white', bandColor:'#112f8d' },
        'terminé':                  { badge:'bg-secondary text-white',bandColor:'#6c757d' },
        'annulé':                   { badge:'bg-danger text-white',  bandColor:'#dc3545' },
    };
    return map[s] || { badge:'bg-secondary', bandColor:'#6c757d' };
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

function voteAction(id_projet, type_vote) {
    if (!_isLoggedIn) {
        showAuthToast();
        return;
    }

    var formData = new FormData();
    formData.append('action',    'vote');
    formData.append('id_projet', id_projet);
    formData.append('type_vote', type_vote);

    fetch('../Controller/VoteController.php', { method: 'POST', body: formData })
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

function openProjetModal(id, scrollToComments) {
    id = parseInt(id);
    _currentModalProjetId = id;
    var p = _allProjets.find(function (x) { return parseInt(x.id_projet) === id; });
    if (!p) return;

    var goal    = Math.max(parseFloat(p.budget_cible), 0.01);
    var raised  = parseFloat(p.montant_actuel) || 0;
    var pct     = Math.min(100, Math.round((raised / goal) * 100));
    var info    = statutInfo(p.statut_projet);

    document.getElementById('projetModalLabel').textContent = p.titre || '';
    document.getElementById('modalLocation').innerHTML =
        '<i class="bi bi-geo-alt-fill me-1"></i>' + escHtml(p.ville) + ', ' + escHtml(p.quartier);
    document.getElementById('modalTypeBadge').innerHTML =
        typeIcon(p.type_projet) + ' ' + formatType(p.type_projet);
    document.getElementById('modalTypeBadge').style.cssText =
        'background:#ffffff33; color:#fff; border-radius:20px; font-size:.78rem;';
    document.getElementById('modalRaised').textContent = '$' + raised.toFixed(2);
    document.getElementById('modalGoal').textContent   = '$' + goal.toFixed(2);
    var bar = document.getElementById('modalProgressBar');
    bar.style.width = pct + '%';
    bar.className   = 'progress-bar ' + (pct >= 100 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-danger');
    document.getElementById('modalPct').textContent     = pct + '% financé';
    document.getElementById('modalStatut').textContent  = (p.statut_projet || '').replace(/_/g, ' ');
    document.getElementById('modalStatut').className    = 'badge ' + info.badge;
    document.getElementById('modalDescription').textContent = p.description || '';
    document.getElementById('modalDonnerBtn').href = 'citoyen_nouvelle_donation.html?id_projet=' + id;

    // Reset comment section
    document.getElementById('modalCommentsList').innerHTML =
        '<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-secondary"></div></div>';
    document.getElementById('modalCommentCount').textContent = '0';
    document.getElementById('modalCommentText').value = '';
    document.getElementById('commentFormWrapper').classList.remove('d-none');
    document.getElementById('commentLoginNotice').classList.add('d-none');

    var modal = new bootstrap.Modal(document.getElementById('projetModal'));
    modal.show();

    loadComments(id);

    if (scrollToComments) {
        document.getElementById('projetModal').addEventListener('shown.bs.modal', function handler() {
            document.getElementById('commentsHeading').scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.getElementById('projetModal').removeEventListener('shown.bs.modal', handler);
        });
    }
}

function loadComments(id) {
    fetch('../Controller/CommentaireController.php?action=getByProjet&id=' + id)
        .then(function (r) { return r.json(); })
        .then(function (comments) {
            var list = document.getElementById('modalCommentsList');
            document.getElementById('modalCommentCount').textContent = comments.length;
            if (!Array.isArray(comments) || comments.length === 0) {
                list.innerHTML = '<p class="text-muted text-center small py-2">Aucun commentaire. Soyez le premier !</p>';
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
    d.className = 'd-flex gap-2 mb-2 align-items-start';
    var date   = c.date_publication ? c.date_publication.substring(0, 10) : '';
    var auteur = (c.auteur && c.auteur.trim()) ? escHtml(c.auteur) : 'Anonyme';
    d.innerHTML =
        '<i class="bi bi-person-circle fs-5 text-primary mt-1 flex-shrink-0"></i>' +
        '<div class="flex-grow-1 p-2 rounded" style="background:#f0f4ff;">' +
            '<div class="d-flex justify-content-between mb-1">' +
                '<strong class="small" style="color:#112f8d;">' + auteur + '</strong>' +
                '<span class="text-muted" style="font-size:.75rem;">' + escHtml(date) + '</span>' +
            '</div>' +
            '<p class="mb-0 small">' + escHtml(c.contenu) + '</p>' +
        '</div>';
    return d;
}

// Publish comment from modal
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

    fetch('../Controller/CommentaireController.php', { method: 'POST', body: formData })
        .then(function (r) {
            if (r.status === 401) throw new Error('non_authentifie');
            return r.json();
        })
        .then(function (data) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-send me-1"></i> Publier le commentaire';
            if (data.success && data.comment) {
                document.getElementById('modalCommentText').value = '';
                var list = document.getElementById('modalCommentsList');
                if (list.querySelector('p')) list.innerHTML = '';
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
            }
        });
});
