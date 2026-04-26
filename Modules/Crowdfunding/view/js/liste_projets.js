document.addEventListener('DOMContentLoaded', function () {

    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
        const box = document.getElementById('flashBox');
        if (box) box.innerHTML = '<div class="alert alert-success">✅ Projet ajouté avec succès !</div>';
    }

    chargerProjets();
    document.getElementById('btnSave').addEventListener('click', sauvegarderProjet);
});

/** Récupère tous les projets depuis l'API et les affiche sous forme de lignes dans le tableau backoffice.
 *  Calcule la barre de progression (budget collecté / cible) et génère les liens Google Maps. */
function chargerProjets() {
    fetch('../controller/ProjetCrowdfundingController.php?action=getAll')
        .then(r => r.json())
        .then(projets => {
            const container = document.getElementById('projetsContainer');
            const empty     = document.getElementById('emptyMsg');
            container.innerHTML = '';

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

                const hasCoordsVal = p.latitude && p.longitude;
                const mapsUrl = hasCoordsVal
                    ? `https://www.google.com/maps?q=${p.latitude},${p.longitude}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.quartier}, ${p.ville}, Tunisie`)}`;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${p.id_projet}</td>
                    <td>
                        <div class="fw-bold">${p.titre}</div>
                        <div class="text-muted small">${p.description.length > 80 ? p.description.substring(0, 80) + '…' : p.description}</div>
                    </td>
                    <td>
                        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
                           class="text-decoration-none">
                            <i class="bi bi-geo-alt-fill text-primary me-1"></i>${p.ville}
                        </a><br>
                        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
                           class="text-decoration-none text-primary small">${p.quartier}</a>
                    </td>
                    <td>${goal.toFixed(2)}</td>
                    <td>${raised.toFixed(2)}</td>
                    <td style="min-width:120px">
                        <div class="progress" style="height:8px;">
                            <div class="progress-bar ${barColor}" role="progressbar"
                                 style="width:${pct}%"
                                 aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
                            </div>
                        </div>
                        <div class="small text-muted mt-1">${pct}%</div>
                    </td>
                    <td><span class="badge ${statutBadge(p.statut_projet)}">${p.statut_projet}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1"
                                onclick='ouvrirEdit(${JSON.stringify(p)})'>
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger"
                                onclick="supprimerProjet(${p.id_projet})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                container.appendChild(tr);
            });
        })
        .catch(err => {
            console.error(err);
            document.getElementById('projetsContainer').innerHTML =
                '<div class="alert alert-danger">Erreur de chargement des projets.</div>';
        });
}

/** Retourne la classe CSS Bootstrap correspondant au statut d'un projet
 *  (ex: 'financé' → 'bg-success', 'annulé' → 'bg-danger'). */
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

/** Ouvre le modal d'édition et pré-remplit tous ses champs avec les données du projet sélectionné.
 *  Appelé depuis le bouton 'crayon' de chaque ligne du tableau. */
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

/** Collecte les valeurs du modal d'édition et envoie un POST à l'API pour mettre à jour le projet.
 *  Ferme le modal, affiche un flash de confirmation et recharge le tableau en cas de succès. */
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

/** Demande confirmation puis envoie une requête DELETE à l'API pour supprimer le projet.
 *  Recharge le tableau si la suppression réussit. */
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

/** Affiche une alerte Bootstrap temporaire (4 secondes) dans la zone #flashBox.
 *  @param {string} msg  - Texte du message
 *  @param {string} type - Type Bootstrap : 'success', 'danger', 'warning', etc. */
function showFlash(msg, type) {
    const box = document.getElementById('flashBox');
    if (box) {
        box.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
        setTimeout(() => box.innerHTML = '', 3500);
    }
}
