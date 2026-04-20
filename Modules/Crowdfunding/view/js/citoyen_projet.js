document.addEventListener('DOMContentLoaded', function () {

    // Show success alert if redirected back
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
        const box = document.getElementById('alertBox');
        if (box) box.innerHTML = '<div class="alert alert-success">&#x2705; Demande envoy&eacute;e ! Un administrateur l\'examinera prochainement.</div>';
    }

    // Auto-fill CIN from session
    fetch('../../User/Controller/get_current_user.php')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (data.success && data.user) {
                var cinField = document.getElementById('num_cin');
                if (cinField) {
                    cinField.value = data.user.num_cin;
                    cinField.readOnly = true;
                    cinField.style.background = '#e9ecef';
                    cinField.style.cursor = 'not-allowed';
                    cinField.title = 'Rempli automatiquement depuis votre compte';
                    var label = cinField.closest('.col-md-12');
                    if (label) {
                        var hint = document.createElement('div');
                        hint.className = 'form-text text-success mt-1';
                        hint.innerHTML = '<i class="bi bi-person-check-fill me-1"></i>CIN r&eacute;cup&eacute;r&eacute; depuis votre session : <strong>' + data.user.nom + ' ' + data.user.prenom + '</strong>';
                        label.appendChild(hint);
                    }
                }
            }
        })
        .catch(function () { /* not logged in, field stays editable */ });

    const form = document.getElementById('formProjet');
    if (!form) return;

    form.addEventListener('submit', function (event) {
        const cin         = document.getElementById('num_cin').value.trim();
        const titre       = document.getElementById('titre').value.trim();
        const typeProjet  = document.getElementById('type_projet').value;
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
        if (!typeProjet) {
            alert('❌ Veuillez choisir un type de projet.');
            document.getElementById('type_projet').focus();
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
