document.addEventListener('DOMContentLoaded', function () {

    // Show success alert if redirected back
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
        const box = document.getElementById('alertBox');
        if (box) box.innerHTML = '<div class="alert alert-success">✅ Projet ajouté avec succès !</div>';
    }

    const form = document.getElementById('formProjet');
    if (!form) return;

    form.addEventListener('submit', function (event) {
        const cin         = document.getElementById('num_cin').value.trim();
        const titre       = document.getElementById('titre').value.trim();
        const description = document.getElementById('description').value.trim();
        const budget      = parseFloat(document.getElementById('budget_cible').value);
        const ville       = document.getElementById('ville').value.trim();
        const quartier    = document.getElementById('quartier').value.trim();

        if (!/^\d{1,15}$/.test(cin) || parseInt(cin) <= 0) {
            alert('❌ Le numéro CIN est invalide.');
            event.preventDefault(); return;
        }
        if (titre.length < 3) {
            alert('❌ Le titre est trop court (minimum 3 caractères).');
            event.preventDefault(); return;
        }
        if (description.length < 10) {
            alert('❌ La description est trop courte (minimum 10 caractères).');
            event.preventDefault(); return;
        }
        if (isNaN(budget) || budget <= 0) {
            alert('❌ L\'objectif de financement doit être un nombre positif.');
            event.preventDefault(); return;
        }
        if (ville.length < 2) {
            alert('❌ Veuillez indiquer une ville.');
            event.preventDefault(); return;
        }
        if (quartier.length < 2) {
            alert('❌ Veuillez indiquer un quartier.');
            event.preventDefault(); return;
        }
    });
});
