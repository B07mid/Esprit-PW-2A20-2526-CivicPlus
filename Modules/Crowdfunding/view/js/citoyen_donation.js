document.addEventListener('DOMContentLoaded', function () {

    const params = new URLSearchParams(window.location.search);
    const box = document.getElementById('alertBox');

    if (params.get('success') === '1') {
        if (box) box.innerHTML = '<div class="alert alert-success">✅ Donation enregistrée avec succès !</div>';
    } else if (params.get('error') === 'cin_not_found') {
        if (box) box.innerHTML = '<div class="alert alert-danger">❌ Ce numéro CIN n\'existe pas dans notre base de données. Veuillez vérifier votre CIN.</div>';
    } else if (params.get('error') === 'db_error') {
        if (box) box.innerHTML = '<div class="alert alert-danger">❌ Une erreur est survenue. Veuillez réessayer.</div>';
    }

    const form = document.getElementById('formDonation');
    if (!form) return;

    form.addEventListener('submit', function (event) {
        const cin    = document.getElementById('num_cin').value.trim();
        const projet = document.getElementById('id_projet').value.trim();
        const montant = parseFloat(document.getElementById('montant').value);
        const statut = document.getElementById('statut_paiement').value;

        if (!/^\d{1,15}$/.test(cin) || parseInt(cin) <= 0) {
            alert('❌ Le numéro CIN est invalide.');
            event.preventDefault(); return;
        }
        if (!projet || parseInt(projet) <= 0) {
            alert('❌ Veuillez saisir un ID de projet valide.');
            event.preventDefault(); return;
        }
        if (isNaN(montant) || montant <= 0) {
            alert('❌ Le montant doit être un nombre positif.');
            event.preventDefault(); return;
        }
        if (!statut) {
            alert('❌ Veuillez choisir un statut de paiement.');
            event.preventDefault(); return;
        }
    });
});
