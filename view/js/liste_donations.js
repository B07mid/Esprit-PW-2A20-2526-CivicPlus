let donationsState = [];

document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
        showFlash('Donation ajoutee avec succes.', 'success');
    }

    chargerDonations();
});

function chargerDonations() {
    fetch('../controller/DonationController.php?action=getAll', { cache: 'no-store' })
        .then(r => r.json())
        .then(donations => {
            donationsState = Array.isArray(donations) ? donations : [];
            const groups = groupDonations(donationsState);

            renderDonationQueue('donationsPendingBody', groups.pending, 'Aucune donation en attente.');
            renderDonationQueue('donationsConfirmedBody', groups.confirmed, 'Aucune donation confirmee.');
            renderDonationQueue('donationsCancelledBody', groups.cancelled, 'Aucune donation annulee.');
            updateDonationStats(groups);
        })
        .catch(err => {
            console.error(err);
            ['donationsPendingBody', 'donationsConfirmedBody', 'donationsCancelledBody'].forEach(id => {
                const body = document.getElementById(id);
                if (body) body.innerHTML = '<tr><td colspan="9" class="text-center text-danger py-4">Erreur de chargement.</td></tr>';
            });
        });
}

function groupDonations(donations) {
    return donations.reduce((acc, donation) => {
        const status = normalizeDonationStatus(donation.statut_paiement);
        if (status === 'confirme') acc.confirmed.push(donation);
        else if (status === 'annule') acc.cancelled.push(donation);
        else acc.pending.push(donation);
        return acc;
    }, { pending: [], confirmed: [], cancelled: [] });
}

function renderDonationQueue(bodyId, rows, emptyMessage) {
    const body = document.getElementById(bodyId);
    if (!body) return;

    if (!rows.length) {
        body.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">${emptyMessage}</td></tr>`;
        return;
    }

    body.innerHTML = rows.map(donationRowHtml).join('');
}

function donationRowHtml(d) {
    const id = Number(d.id_don) || 0;
    const projectId = Number(d.id_projet) || 0;
    const status = normalizeDonationStatus(d.statut_paiement);
    const date = d.date_don ? new Date(d.date_don).toLocaleDateString('fr-FR') : '--';
    const amount = Number.parseFloat(d.montant || 0).toFixed(2);

    return `
        <tr data-id-don="${id}" data-id-projet="${projectId}">
            <td><strong>#${id}</strong></td>
            <td><span class="fw-semibold">${escHtml(d.num_cin || '--')}</span></td>
            <td>#${projectId}</td>
            <td><span class="fw-bold">${amount} $</span></td>
            <td>
                <span class="badge bg-light text-dark border">${formatMethodePaiement(d.methode_paiement)}</span>
                ${d.flouci_transaction_id ? `<div class="small text-muted mt-1">${escHtml(d.flouci_transaction_id)}</div>` : ''}
            </td>
            <td>${escHtml(d.reference_transaction || '--')}</td>
            <td>${proofLink(d.preuve_paiement_image)}</td>
            <td>${escHtml(date)}</td>
            <td>
                <div class="d-flex flex-wrap gap-2 align-items-center">
                    <span class="badge ${statutBadgeClass(status)}">${formatDonationStatus(status)}</span>
                    ${status !== 'confirme' ? `<button class="btn btn-sm btn-success" onclick="changerStatutDonation(${id}, ${projectId}, 'confirmé')" title="Confirmer"><i class="bi bi-check-lg"></i></button>` : ''}
                    ${status !== 'annule' ? `<button class="btn btn-sm btn-outline-warning" onclick="changerStatutDonation(${id}, ${projectId}, 'annulé')" title="Annuler"><i class="bi bi-x-lg"></i></button>` : ''}
                    <button class="btn btn-sm btn-outline-danger" onclick="supprimerDonation(${id})" title="Supprimer"><i class="bi bi-trash"></i></button>
                </div>
            </td>
        </tr>`;
}

function changerStatutDonation(idDon, idProjet, statut) {
    const label = statut.startsWith('confirm') ? 'confirmer' : 'annuler';
    if (!confirm(`Voulez-vous ${label} cette donation ?`)) return;

    const formData = new FormData();
    formData.append('action', 'update');
    formData.append('id_don', idDon);
    formData.append('id_projet', idProjet);
    formData.append('statut_paiement', statut);

    fetch('../controller/DonationController.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                const points = Number(data.points_ajoutes || 0);
                showFlash(points > 0 ? `Donation mise a jour. ${points} points ajoutes.` : 'Donation mise a jour.', 'success');
                chargerDonations();
            } else {
                showFlash('Erreur lors de la mise a jour.', 'danger');
            }
        })
        .catch(() => showFlash('Erreur lors de la mise a jour.', 'danger'));
}

function supprimerDonation(id) {
    if (!confirm('Voulez-vous vraiment supprimer cette donation ?')) return;
    fetch(`../controller/DonationController.php?action=delete&id=${encodeURIComponent(id)}`)
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                showFlash('Donation supprimee.', 'warning');
                chargerDonations();
            } else {
                showFlash('Suppression impossible.', 'danger');
            }
        })
        .catch(() => showFlash('Suppression impossible.', 'danger'));
}

function updateDonationStats(groups) {
    setText('statDonationsTotal', donationsState.length);
    setText('statDonationsPending', groups.pending.length);
    setText('statDonationsConfirmed', groups.confirmed.length);
    setText('statDonationsCancelled', groups.cancelled.length);
}

function formatMethodePaiement(methode) {
    const map = {
        flouci: 'Flouci',
        credit_card: 'Carte bancaire'
    };
    return map[methode] || '--';
}

function proofLink(path) {
    if (!path) return '<span class="text-muted">--</span>';
    const href = publicPath(path);
    return `<a href="${escAttr(href)}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-secondary"><i class="bi bi-image"></i> Voir</a>`;
}

function publicPath(path) {
    const clean = String(path || '').replace(/\\/g, '/').replace(/^(\.\/|\.\.\/)+/, '');
    if (/^(https?:)?\/\//i.test(clean) || clean.charAt(0) === '/') return clean;
    return '/civicplus/' + clean;
}

function normalizeDonationStatus(statut) {
    const val = String(statut || 'en_attente')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    if (val.startsWith('confirm')) return 'confirme';
    if (val.startsWith('annul')) return 'annule';
    return 'en_attente';
}

function statutBadgeClass(statut) {
    if (statut === 'confirme') return 'bg-success';
    if (statut === 'annule') return 'bg-danger';
    return 'bg-warning text-dark';
}

function formatDonationStatus(statut) {
    if (statut === 'confirme') return 'Confirmee';
    if (statut === 'annule') return 'Annulee';
    return 'En attente';
}

function showFlash(msg, type) {
    const box = document.getElementById('flashBox');
    if (!box) return;
    box.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${escHtml(msg)}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button></div>`;
    setTimeout(() => { box.innerHTML = ''; }, 3500);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
}

function escHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escAttr(value) {
    return escHtml(value).replace(/`/g, '&#096;');
}
