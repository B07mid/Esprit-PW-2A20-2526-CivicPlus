document.addEventListener('DOMContentLoaded', function () {

    // Show success alert if redirected back
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
        const box = document.getElementById('flashBox');
        if (box) box.innerHTML = '<div class="alert alert-success">✅ Donation ajoutée avec succès !</div>';
    }

    chargerDonations();
});

function chargerDonations() {
    const tableBody = document.getElementById('donationsTableBody');
    if (!tableBody) return;

    fetch('../controller/DonationController.php?action=getAll')
        .then(r => r.json())
        .then(donations => {
            tableBody.innerHTML = '';

            if (donations.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Aucune donation trouvée.</td></tr>';
                return;
            }

            donations.forEach(d => {
                const date = d.date_don ? new Date(d.date_don).toLocaleDateString('fr-FR') : '—';
                const statutBadge = statutBadgeClass(d.statut_paiement);
                const tr = document.createElement('tr');
                tr.dataset.id_don      = d.id_don;
                tr.dataset.id_projet   = d.id_projet;
                tr.dataset.statut      = d.statut_paiement;

                tr.innerHTML = `
                    <td>#${d.id_don}</td>
                    <td>${d.num_cin}</td>
                    <td>#${d.id_projet}</td>
                    <td>${parseFloat(d.montant).toFixed(2)}</td>
                    <td>${d.reference_transaction || '—'}</td>
                    <td ondblclick="editerStatut(this)" title="Double-cliquer pour modifier">
                        <span class="badge ${statutBadge}">${d.statut_paiement}</span>
                    </td>
                    <td>${date}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1"
                                onclick="sauvegarderDonation(${d.id_don}, ${d.id_projet}, this)">
                            <i class="bi bi-save"></i> Sauvegarder
                        </button>
                        <button class="btn btn-sm btn-outline-danger"
                                onclick="supprimerDonation(${d.id_don})">
                            <i class="bi bi-trash"></i> Supprimer
                        </button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error(err);
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Erreur de chargement.</td></tr>';
        });
}

function statutBadgeClass(statut) {
    if (statut === 'confirmé')  return 'bg-success';
    if (statut === 'annulé')    return 'bg-danger';
    return 'bg-warning text-dark';
}

function editerStatut(td) {
    if (td.querySelector('select')) return;
    const tr  = td.closest('tr');
    const val = tr.dataset.statut;
    td.innerHTML = `
        <select class="form-select form-select-sm" data-champ="statut_paiement">
            <option value="en_attente"  ${val === 'en_attente' ? 'selected' : ''}>En attente</option>
            <option value="confirmé"    ${val === 'confirmé'   ? 'selected' : ''}>Confirmé</option>
            <option value="annulé"      ${val === 'annulé'     ? 'selected' : ''}>Annulé</option>
        </select>
    `;
}

function sauvegarderDonation(id_don, id_projet, btn) {
    const tr       = btn.closest('tr');
    const formData = new FormData();
    formData.append('action', 'update');
    formData.append('id_don', id_don);
    formData.append('id_projet', id_projet);

    const sel = tr.querySelector('[data-champ="statut_paiement"]');
    formData.append('statut_paiement', sel ? sel.value : tr.dataset.statut);

    fetch('../controller/DonationController.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                showFlash('Donation mise à jour !', 'success');
                chargerDonations();
            } else {
                showFlash('Erreur lors de la mise à jour.', 'danger');
            }
        })
        .catch(err => console.error(err));
}

function supprimerDonation(id) {
    if (!confirm('Voulez-vous vraiment supprimer cette donation ?')) return;
    fetch(`../controller/DonationController.php?action=delete&id=${id}`)
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                showFlash('Donation supprimée.', 'warning');
                chargerDonations();
            }
        });
}

function showFlash(msg, type) {
    const box = document.getElementById('flashBox');
    if (box) {
        box.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
        setTimeout(() => box.innerHTML = '', 3000);
    }
}
