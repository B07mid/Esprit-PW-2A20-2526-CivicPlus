document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
        showFlash('Projet ajoute avec succes.', 'success');
    }

    chargerProjets();
    document.getElementById('btnSave').addEventListener('click', sauvegarderProjet);
});

const DEFAULT_PROJECT_IMAGE = '../../../assets/img/RawShape.png';
const ADMIN_BASE_PATH = detectProjectBasePath();
let adminProjects = [];

function chargerProjets() {
    fetch('../controller/ProjetCrowdfundingController.php?action=getAll&_=' + Date.now(), { cache: 'no-store' })
        .then(r => r.json())
        .then(projets => {
            adminProjects = Array.isArray(projets) ? projets : [];
            const pendingBody = document.getElementById('projetsPendingBody');
            const approvedBody = document.getElementById('projetsApprovedBody');
            const rejectedBody = document.getElementById('projetsRejectedBody');
            const empty = document.getElementById('emptyMsg');
            if (!pendingBody || !approvedBody || !rejectedBody) return;
            pendingBody.innerHTML = '';
            approvedBody.innerHTML = '';
            rejectedBody.innerHTML = '';

            if (adminProjects.length === 0) {
                empty.classList.remove('d-none');
                renderProjectQueue(pendingBody, [], 'pending');
                renderProjectQueue(approvedBody, [], 'approved');
                renderProjectQueue(rejectedBody, [], 'rejected');
                updateProjectStats();
                return;
            }
            empty.classList.add('d-none');

            const groups = { pending: [], approved: [], rejected: [] };
            adminProjects.forEach(p => {
                const decision = normalizeDecision(p.decision_admin);
                if (decision === 'accepte') groups.approved.push(p);
                else if (decision === 'rejete') groups.rejected.push(p);
                else groups.pending.push(p);
            });

            updateProjectStats(groups);
            renderProjectQueue(pendingBody, groups.pending, 'pending');
            renderProjectQueue(approvedBody, groups.approved, 'approved');
            renderProjectQueue(rejectedBody, groups.rejected, 'rejected');

            document.querySelectorAll('[data-action-decision]').forEach(btn => {
                btn.addEventListener('click', function () {
                    changerDecisionProjet(this.getAttribute('data-id'), this.getAttribute('data-action-decision'));
                });
            });
            document.querySelectorAll('[data-action-edit]').forEach(btn => {
                btn.addEventListener('click', function () {
                    const p = adminProjects.find(item => String(item.id_projet) === String(this.getAttribute('data-id')));
                    if (p) ouvrirEdit(p);
                });
            });
        })
        .catch(err => {
            console.error(err);
            ['projetsPendingBody', 'projetsApprovedBody', 'projetsRejectedBody'].forEach(id => {
                const body = document.getElementById(id);
                if (body) body.innerHTML = '<tr><td colspan="11" class="text-danger text-center py-4">Erreur de chargement des projets.</td></tr>';
            });
        });
}

function renderProjectQueue(container, projects, queue) {
    if (!projects.length) {
        const labels = {
            pending: 'Aucun projet en attente.',
            approved: 'Aucun projet approuve.',
            rejected: 'Aucun projet rejete.'
        };
        container.innerHTML = `<tr><td colspan="11" class="text-center text-muted py-4">${labels[queue]}</td></tr>`;
        return;
    }

    container.innerHTML = projects.map(p => projectRowHtml(p)).join('');
}

function projectRowHtml(p) {
    const goal = Math.max(parseFloat(p.budget_cible), 0.01);
    const raised = parseFloat(p.montant_actuel) || 0;
    const pct = Math.min(100, Math.round((raised / goal) * 100));
    const barColor = pct >= 100 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-danger';
    const hasCoordsVal = p.latitude && p.longitude;
    const mapsUrl = hasCoordsVal
        ? `https://www.google.com/maps?q=${p.latitude},${p.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.quartier}, ${p.ville}, Tunisie`)}`;
    const imageUrl = projectImageUrl(p.image_url);
    const emailSent = parseInt(p.decision_email_sent || 0) === 1;
    const decision = normalizeDecision(p.decision_admin);
    const recipient = p.decision_email_recipient || p.email || '';
    const canAccept = decision !== 'accepte';
    const canReject = decision !== 'rejete';

    return `
        <tr>
            <td>#${p.id_projet}</td>
            <td>
                <img src="${escHtml(imageUrl)}" alt="${escHtml(p.titre || 'Projet')}"
                     style="width:76px;height:52px;object-fit:cover;border-radius:6px;background:#eef2f7;"
                     onerror="this.onerror=null;this.src='${escHtml(DEFAULT_PROJECT_IMAGE)}';">
            </td>
            <td>
                <div class="fw-bold">${escHtml(p.titre)}</div>
                <div class="text-muted small">${escHtml(shortText(p.description, 80))}</div>
                <span class="badge ${decisionBadge(decision)} mt-1">${formatDecision(decision)}</span>
            </td>
            <td>${citizenProfileLink(p.num_cin, [p.prenom, p.nom].filter(Boolean).join(' '))}</td>
            <td>
                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
                    <i class="bi bi-geo-alt-fill text-primary me-1"></i>${escHtml(p.ville)}
                </a><br>
                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="text-decoration-none text-primary small">${escHtml(p.quartier)}</a>
            </td>
            <td>${goal.toFixed(2)}</td>
            <td>${raised.toFixed(2)}</td>
            <td style="min-width:120px">
                <div class="progress" style="height:8px;">
                    <div class="progress-bar ${barColor}" role="progressbar" style="width:${pct}%"
                         aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <div class="small text-muted mt-1">${pct}%</div>
            </td>
            <td><span class="badge ${statutBadge(p.statut_projet)}">${formatStatut(p.statut_projet)}</span></td>
            <td>
                <span class="badge ${emailSent ? 'bg-success' : 'bg-secondary'}">${emailSent ? 'Envoye' : 'Non envoye'}</span>
                <div class="small text-muted">${escHtml(recipient || 'Email indisponible')}</div>
            </td>
            <td>
                ${canAccept ? `<button type="button" class="btn btn-sm btn-success me-1" title="Accepter" data-action-decision="accepte" data-id="${p.id_projet}"><i class="bi bi-check-lg"></i></button>` : ''}
                ${canReject ? `<button type="button" class="btn btn-sm btn-warning me-1" title="Rejeter" data-action-decision="rejete" data-id="${p.id_projet}"><i class="bi bi-x-lg"></i></button>` : ''}
                <button type="button" class="btn btn-sm btn-outline-primary me-1" data-action-edit data-id="${p.id_projet}"><i class="bi bi-pencil"></i></button>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="supprimerProjet(${p.id_projet})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>`;
}

function citizenProfileLink(cin, name) {
    const clean = String(cin || '').trim();
    if (!/^\d{8}$/.test(clean)) return '<span class="text-muted">--</span>';
    const label = name ? `${escHtml(name)}<br><span class="small text-muted">${escHtml(clean)}</span>` : escHtml(clean);
    return `<a class="fw-semibold text-decoration-none" href="../../Social/View/profile.html?cin=${encodeURIComponent(clean)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function updateProjectStats(groups) {
    groups = groups || { pending: [], approved: [], rejected: [] };
    setText('statProjectsTotal', adminProjects.length);
    setText('statProjectsPending', groups.pending.length);
    setText('statProjectsApproved', groups.approved.length);
    setText('statProjectsRejected', groups.rejected.length);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
}

function normalizeDecision(decision) {
    const val = String(decision || 'en_attente').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (val === 'approuve' || val === 'approuvee' || val === 'approved') return 'accepte';
    if (val === 'rejected' || val === 'rejete' || val === 'rejetee') return 'rejete';
    if (val === 'accepte' || val === 'accepté') return 'accepte';
    return 'en_attente';
}

function statutBadge(statut) {
    const map = {
        'en_cours': 'bg-primary',
        'termine': 'bg-secondary'
    };
    return map[statut] || 'bg-secondary';
}

function decisionBadge(decision) {
    const map = {
        'en_attente': 'bg-warning text-dark',
        'accepte': 'bg-success',
        'rejete': 'bg-danger'
    };
    return map[decision] || 'bg-secondary';
}

function formatDecision(decision) {
    const map = {
        'en_attente': 'En attente',
        'accepte': 'Accepte',
        'rejete': 'Rejete'
    };
    return map[decision] || decision || '';
}

function formatStatut(statut) {
    const normalized = String(statut || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const map = {
        'en_cours': 'En cours',
        'termine': 'Termine'
    };
    return map[normalized] || statut || '';
}

function ouvrirEdit(p) {
    document.getElementById('edit_id_projet').value = p.id_projet;
    document.getElementById('edit_titre').value = p.titre || '';
    document.getElementById('edit_description').value = p.description || '';
    document.getElementById('edit_budget').value = p.budget_cible || '';
    document.getElementById('edit_image_projet').value = '';
    document.getElementById('edit_ville').value = p.ville || '';
    document.getElementById('edit_quartier').value = p.quartier || '';
    document.getElementById('edit_statut').value = String(p.statut_projet || 'en_cours').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    new bootstrap.Modal(document.getElementById('editModal')).show();
}

function sauvegarderProjet() {
    const titre = document.getElementById('edit_titre').value.trim();
    const description = document.getElementById('edit_description').value.trim();
    const budget = parseFloat(document.getElementById('edit_budget').value);
    const imageFile = document.getElementById('edit_image_projet').files[0];
    const ville = document.getElementById('edit_ville').value.trim();
    const quartier = document.getElementById('edit_quartier').value.trim();
    const statut = document.getElementById('edit_statut').value;

    if (titre.length < 3) { showFlash('Le titre doit contenir au moins 3 caracteres.', 'warning'); return; }
    if (description.length < 10) { showFlash('La description doit contenir au moins 10 caracteres.', 'warning'); return; }
    if (!Number.isFinite(budget) || budget <= 0) { showFlash('Le budget doit etre positif.', 'warning'); return; }
    if (imageFile && (!/^image\/(png|jpeg|webp|gif)$/.test(imageFile.type) || imageFile.size > 5 * 1024 * 1024)) {
        showFlash('Image invalide (PNG, JPG, WEBP ou GIF, max 5 MB).', 'warning');
        return;
    }
    if (ville.length < 2 || quartier.length < 2) { showFlash('La ville et le quartier sont obligatoires.', 'warning'); return; }
    if (!statut) { showFlash('Le statut est obligatoire.', 'warning'); return; }

    const formData = new FormData();
    formData.append('action', 'update');
    formData.append('id_projet', document.getElementById('edit_id_projet').value);
    formData.append('titre', titre);
    formData.append('description', description);
    formData.append('budget_cible', budget);
    if (imageFile) formData.append('image_projet', imageFile);
    formData.append('ville', ville);
    formData.append('quartier', quartier);
    formData.append('statut_projet', statut);

    fetch('../controller/ProjetCrowdfundingController.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
            if (data.success) {
                showFlash('Projet mis a jour.', 'success');
                chargerProjets();
            } else {
                showFlash(data.error === 'image' ? 'Image invalide.' : 'Erreur lors de la mise a jour.', 'danger');
            }
        })
        .catch(() => showFlash('Erreur lors de la mise a jour.', 'danger'));
}

function changerDecisionProjet(idProjet, decision) {
    const action = decision === 'rejete' ? 'rejeter' : 'accepter';
    if (!confirm('Voulez-vous vraiment ' + action + ' ce projet ?')) return;

    const formData = new FormData();
    formData.append('action', 'decision');
    formData.append('id_projet', idProjet);
    formData.append('decision', decision);

    fetch('../controller/ProjetCrowdfundingController.php', { method: 'POST', body: formData, cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                showFlash(data.email_sent ? 'Decision enregistree et email envoye.' : 'Decision enregistree. Email non envoye.', data.email_sent ? 'success' : 'warning');
                chargerProjets();
            } else {
                showFlash('Impossible de changer la decision du projet.', 'danger');
            }
        })
        .catch(() => showFlash('Impossible de changer la decision du projet.', 'danger'));
}

function supprimerProjet(id) {
    if (!confirm('Voulez-vous vraiment supprimer ce projet ?')) return;
    fetch(`../controller/ProjetCrowdfundingController.php?action=delete&id=${id}`)
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                showFlash('Projet supprime.', 'warning');
                chargerProjets();
            }
        });
}

function showFlash(msg, type) {
    const box = document.getElementById('flashBox');
    if (box) {
        box.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
        setTimeout(() => box.innerHTML = '', 3500);
    }
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function shortText(value, length) {
    value = String(value || '');
    return value.length > length ? value.substring(0, length) + '...' : value;
}

function projectImageUrl(src) {
    src = String(src || '').trim();
    if (!src) return DEFAULT_PROJECT_IMAGE;
    if (/^(https?:)?\/\//i.test(src) || /^data:/i.test(src) || /^blob:/i.test(src)) return src;
    src = src.replace(/\\/g, '/').replace(/^(\.\/|\.\.\/)+/, '');
    if (src.charAt(0) === '/') return src;
    if (/^Modules\//i.test(src) || /^assets\//i.test(src)) return (ADMIN_BASE_PATH || '') + '/' + src;
    return DEFAULT_PROJECT_IMAGE;
}

function detectProjectBasePath() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].getAttribute('src') || '';
        if (src.indexOf('liste_projets.js') === -1) continue;

        var scriptPath = new URL(src, window.location.href).pathname;
        var modulesIndex = scriptPath.toLowerCase().indexOf('/modules/');
        if (modulesIndex !== -1) return scriptPath.slice(0, modulesIndex);
    }

    var path = window.location.pathname;
    var pathModulesIndex = path.toLowerCase().indexOf('/modules/');
    if (pathModulesIndex !== -1) return path.slice(0, pathModulesIndex);
    return '';
}
