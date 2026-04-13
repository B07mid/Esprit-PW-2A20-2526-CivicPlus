document.addEventListener('DOMContentLoaded', function () {

    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
        const box = document.getElementById('flashBox');
        if (box) box.innerHTML = '<div class="alert alert-success">✅ Projet ajouté avec succès !</div>';
    }

    chargerProjets();
    document.getElementById('btnSave').addEventListener('click', sauvegarderProjet);
});

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
                const goal   = Math.max(parseFloat(p.budget_cible), 0.01);
                const raised = parseFloat(p.montant_actuel);
                const pct    = Math.min(100, Math.round((raised / goal) * 100));
                const barColor = pct >= 100 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-danger';

                const col = document.createElement('div');
                col.className = 'col-lg-4 col-md-6';
                col.innerHTML = `
                    <div class="card h-100 shadow-sm border-0">
                        <div class="card-body d-flex flex-column p-4">
                            <span class="badge bg-secondary mb-2 align-self-start">#${p.id_projet}</span>
                            <h5 class="card-title fw-bold mb-1">${p.titre}</h5>
                            <p class="text-muted small mb-2">${p.ville}, ${p.quartier}</p>
                            <p class="card-text flex-grow-1" style="font-size:.9rem;">
                                ${p.description.length > 120 ? p.description.substring(0, 120) + '…' : p.description}
                            </p>

                            <!-- Progress bar -->
                            <div class="mt-3">
                                <div class="d-flex justify-content-between small mb-1">
                                    <span>Collecté : <strong>$${raised.toFixed(2)}</strong></span>
                                    <span>Objectif : <strong>$${goal.toFixed(2)}</strong></span>
                                </div>
                                <div class="progress" style="height:10px;">
                                    <div class="progress-bar ${barColor}" role="progressbar"
                                         style="width:${pct}%"
                                         aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
                                    </div>
                                </div>
                                <div class="text-end small mt-1 text-muted">${pct}% financé</div>
                            </div>

                            <!-- Status badge -->
                            <div class="mt-2">
                                <span class="badge ${statutBadge(p.statut_projet)}">${p.statut_projet}</span>
                            </div>

                            <!-- Action buttons -->
                            <div class="d-flex gap-2 mt-3">
                                <button class="btn btn-outline-danger btn-sm flex-fill btn-like"
                                        data-id="${p.id_projet}">
                                    <i class="bi bi-heart"></i> Like
                                </button>
                                <button class="btn btn-outline-secondary btn-sm flex-fill"
                                        data-bs-toggle="collapse"
                                        data-bs-target="#comment-${p.id_projet}">
                                    <i class="bi bi-chat"></i> Commenter
                                </button>
                                <button class="btn btn-outline-primary btn-sm"
                                        onclick='ouvrirEdit(${JSON.stringify(p)})'>
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm"
                                        onclick="supprimerProjet(${p.id_projet})">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>

                            <!-- Comment collapse -->
                            <div class="collapse mt-3" id="comment-${p.id_projet}">
                                <textarea class="form-control form-control-sm" rows="2"
                                          placeholder="Écrire un commentaire…"></textarea>
                                <button class="btn btn-primary btn-sm mt-2 w-100">Publier</button>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(col);
            });

            // Like button toggle
            document.querySelectorAll('.btn-like').forEach(btn => {
                btn.addEventListener('click', function () {
                    const icon = this.querySelector('i');
                    if (icon.classList.contains('bi-heart')) {
                        icon.classList.replace('bi-heart', 'bi-heart-fill');
                        this.classList.replace('btn-outline-danger', 'btn-danger');
                        this.innerHTML = '<i class="bi bi-heart-fill"></i> Aimé';
                    } else {
                        icon.classList.replace('bi-heart-fill', 'bi-heart');
                        this.classList.replace('btn-danger', 'btn-outline-danger');
                        this.innerHTML = '<i class="bi bi-heart"></i> Like';
                    }
                });
            });
        })
        .catch(err => {
            console.error(err);
            document.getElementById('projetsContainer').innerHTML =
                '<div class="alert alert-danger">Erreur de chargement des projets.</div>';
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
