document.addEventListener('DOMContentLoaded', function () {

    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
        const box = document.getElementById('flashBox');
        if (box) box.innerHTML = '<div class="alert alert-success">✅ Projet ajouté avec succès !</div>';
    }

    chargerProjets();
    chargerDemandesCount();
    document.getElementById('btnSave').addEventListener('click', sauvegarderProjet);
});

function chargerProjets() {
    fetch('../controller/ProjetCrowdfundingController.php?action=getAll')
        .then(r => r.json())
        .then(projets => {
            const tbody = document.getElementById('projetsBody');
            const empty = document.getElementById('emptyMsg');
            tbody.innerHTML = '';

            if (projets.length === 0) {
                empty.classList.remove('d-none');
                return;
            }
            empty.classList.add('d-none');

            projets.forEach(p => {
                const goal     = Math.max(parseFloat(p.budget_cible), 0.01);
                const raised   = parseFloat(p.montant_actuel);
                const pct      = Math.min(100, Math.round((raised / goal) * 100));
                const barColor = pct >= 100 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-danger';
                const titre    = p.titre.length > 45 ? p.titre.substring(0, 45) + '…' : p.titre;

                const lat = parseFloat(p.latitude);
                const lng = parseFloat(p.longitude);
                const hasCoords = !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);
                const locLabel = `${p.ville}, ${p.quartier}`;
                const locCell = hasCoords
                    ? `<a href="#" onclick="openMapModal(${lat},${lng},&quot;${locLabel.replace(/"/g,'&amp;quot;')}&quot;);return false;" class="text-primary text-decoration-none fw-medium text-nowrap small"><i class="bi bi-geo-alt-fill me-1"></i>${locLabel}</a>`
                    : `<span class="text-muted small text-nowrap"><i class="bi bi-geo-alt me-1"></i>${locLabel}</span>`;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><span class="badge bg-secondary">#${p.id_projet}</span></td>
                    <td class="text-nowrap fw-semibold" style="max-width:220px;overflow:hidden;text-overflow:ellipsis">${titre}</td>
                    <td>${locCell}</td>
                    <td class="fw-semibold text-danger text-nowrap">$${raised.toFixed(2)}</td>
                    <td class="text-nowrap">$${goal.toFixed(2)}</td>
                    <td><span class="badge ${statutBadge(p.statut_projet)}">${p.statut_projet.replace(/_/g,' ')}</span></td>
                    <td class="text-center text-nowrap">
                        <button class="btn btn-sm btn-outline-primary me-1" title="Modifier"
                                onclick='ouvrirEdit(${JSON.stringify(p)})'>
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" title="Supprimer"
                                onclick="supprimerProjet(${p.id_projet})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error(err);
            document.getElementById('projetsBody').innerHTML =
                '<tr><td colspan="8" class="text-center text-danger">Erreur de chargement des projets.</td></tr>';
        });
}

function statutBadge(statut) {
    const map = {
        'en_recherche_financement': 'bg-info text-dark',
        'financé':  'bg-success',
        'en_cours': 'bg-primary',
        'terminé':  'bg-secondary',
        'annulé':   'bg-danger',
    };
    return map[statut] || 'bg-secondary';
}

function ouvrirEdit(p) {
    document.getElementById('edit_id_projet').value  = p.id_projet;
    document.getElementById('edit_titre').value      = p.titre;
    document.getElementById('edit_description').value = p.description;
    document.getElementById('edit_budget').value     = p.budget_cible;
    document.getElementById('edit_ville').value      = p.ville;
    document.getElementById('edit_quartier').value   = p.quartier;
    document.getElementById('edit_statut').value     = p.statut_projet;
    new bootstrap.Modal(document.getElementById('editModal')).show();
}

function sauvegarderProjet() {
    const formData = new FormData();
    formData.append('action',        'update');
    formData.append('id_projet',     document.getElementById('edit_id_projet').value);
    formData.append('titre',         document.getElementById('edit_titre').value);
    formData.append('description',   document.getElementById('edit_description').value);
    formData.append('budget_cible',  document.getElementById('edit_budget').value);
    formData.append('ville',         document.getElementById('edit_ville').value);
    formData.append('quartier',      document.getElementById('edit_quartier').value);
    formData.append('statut_projet', document.getElementById('edit_statut').value);

    fetch('../controller/ProjetCrowdfundingController.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
            if (data.success) {
                showFlash('Projet mis à jour !', 'success');
                chargerProjets();
            } else {
                showFlash('Erreur lors de la mise à jour.', 'danger');
            }
        })
        .catch(err => console.error(err));
}

function supprimerProjet(id) {
    if (!confirm('Voulez-vous vraiment supprimer ce projet ?')) return;
    fetch(`../controller/ProjetCrowdfundingController.php?action=delete&id=${id}`)
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                showFlash('Projet supprimé.', 'warning');
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

// ====================================================
// Demande de projet functions
// ====================================================

function chargerDemandesCount() {
    fetch('../controller/ProjetCrowdfundingController.php?action=demandeCount')
        .then(r => r.json())
        .then(data => {
            const n = data.count || 0;
            ['demandesCount', 'sidebarCrowdBadge', 'sidebarProjetsBadge'].forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                el.textContent = n;
                el.classList.toggle('d-none', n === 0);
            });
        }).catch(() => {});
}

function ouvrirDemandes() {
    fetch('../controller/ProjetCrowdfundingController.php?action=demandePending')
        .then(r => r.json())
        .then(rows => {
            const tbody = document.getElementById('demandesTableBody');
            tbody.innerHTML = '';
            if (!rows.length) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-3"><i class="bi bi-inbox me-2"></i>Aucune demande en attente</td></tr>';
            } else {
                rows.forEach(d => {
                    const tr = document.createElement('tr');
                    const date = d.date_demande ? new Date(d.date_demande).toLocaleDateString('fr-FR') : '—';
                    tr.innerHTML = `
                        <td class="text-nowrap">#${d.id_demande}</td>
                        <td class="text-nowrap">${d.num_cin}</td>
                        <td><strong>${d.titre}</strong></td>
                        <td><span class="badge bg-secondary">${d.type_projet}</span></td>
                        <td class="text-nowrap">${parseFloat(d.budget_cible).toLocaleString('fr-FR')} TND</td>
                        <td class="text-nowrap">${d.ville}, ${d.quartier}</td>
                        <td class="text-nowrap">${date}</td>
                        <td class="text-center text-nowrap">
                            <button class="btn btn-sm btn-success me-1" onclick="accepterDemande(${d.id_demande})">
                                <i class="bi bi-check-lg"></i> Accepter
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="refuserDemande(${d.id_demande})">
                                <i class="bi bi-x-lg"></i> Refuser
                            </button>
                        </td>`;
                    tbody.appendChild(tr);
                });
            }
            new bootstrap.Modal(document.getElementById('demandesModal')).show();
        }).catch(() => showFlash('Erreur lors du chargement des demandes.', 'danger'));
}

function accepterDemande(id) {
    const fd = new FormData();
    fd.append('action', 'demandeAccept');
    fetch(`../controller/ProjetCrowdfundingController.php?id=${id}`, { method: 'POST', body: fd })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                showDemandesFlash('Demande acceptée — projet créé !', 'success');
                chargerDemandesCount();
                chargerProjets();
                setTimeout(ouvrirDemandes, 600);
            } else {
                showDemandesFlash("Erreur lors de l'acceptation.", 'danger');
            }
        }).catch(() => showDemandesFlash('Erreur réseau.', 'danger'));
}

function refuserDemande(id) {
    if (!confirm('Refuser cette demande de projet ?')) return;
    const fd = new FormData();
    fd.append('action', 'demandeDecline');
    fetch(`../controller/ProjetCrowdfundingController.php?id=${id}`, { method: 'POST', body: fd })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                showDemandesFlash('Demande refusée.', 'warning');
                chargerDemandesCount();
                setTimeout(ouvrirDemandes, 600);
            } else {
                showDemandesFlash('Erreur lors du refus.', 'danger');
            }
        }).catch(() => showDemandesFlash('Erreur réseau.', 'danger'));
}

function showDemandesFlash(msg, type) {
    const box = document.getElementById('demandesFlash');
    if (!box) return;
    box.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show">${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    setTimeout(() => { const a = box.querySelector('.alert'); if (a) a.remove(); }, 4000);
}
