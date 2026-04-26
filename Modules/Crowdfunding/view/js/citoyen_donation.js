document.addEventListener('DOMContentLoaded', function () {

    // ── IIFE : Génère automatiquement la référence de transaction au format TXN-YYYYMMDD-XXXX.
    //           Remplit le champ caché et l'affiche dans la div grise en lecture seule.
    (function () {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const ref = 'TXN-' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate())
                  + '-' + Math.floor(1000 + Math.random() * 9000);
        document.getElementById('reference_transaction').value = ref;
        document.getElementById('reference_display').textContent = ref;
    })();

    // ── Pré-remplit le champ CIN depuis la session via get_current_user.php.
    //    Affiche le numéro en bleu si l'utilisateur est connecté, sinon 'Non connecté'.
    fetch('../../../Modules/User/Controller/get_current_user.php')
        .then(r => r.json())
        .then(data => {
            if (data.success && data.user) {
                document.getElementById('num_cin').value = data.user.num_cin;
                document.getElementById('cin_display').textContent = data.user.num_cin;
                document.getElementById('cin_display').style.color = '#112f8d';
            } else {
                document.getElementById('cin_display').textContent = 'Non connecté';
            }
        })
        .catch(() => { document.getElementById('cin_display').textContent = 'Erreur'; });

    // ── Récupère le nom du projet depuis l'URL (?id_projet=X) et le passe à l'API.
    //    Affiche le titre du projet dans la div grise en lecture seule.
    const idProjet = new URLSearchParams(window.location.search).get('id_projet');
    if (idProjet) {
        document.getElementById('id_projet').value = idProjet;
        fetch('../controller/ProjetCrowdfundingController.php?action=getById&id=' + idProjet)
            .then(r => r.json())
            .then(data => {
                const nom = data && data.titre ? data.titre : 'Projet #' + idProjet;
                document.getElementById('projet_display').textContent = nom;
                document.getElementById('projet_display').style.color = '#112f8d';
            })
            .catch(() => {
                document.getElementById('projet_display').textContent = 'Projet #' + idProjet;
                document.getElementById('projet_display').style.color = '#112f8d';
            });
    } else {
        document.getElementById('projet_display').textContent = 'Aucun projet sélectionné';
    }

    // ── Vérifie les paramètres GET pour afficher les messages de succès ou d'erreur
    //    après la soumission du formulaire (redirecté depuis DonationController.php).
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

    // ── Validation côté client avant soumission du formulaire.
    //    Vérifie que le CIN et le projet sont chargés, que le montant est positif
    //    et qu'un statut de paiement a été sélectionné.
    form.addEventListener('submit', function (event) {
        const cin    = document.getElementById('num_cin').value.trim();
        const projet = document.getElementById('id_projet').value.trim();
        const montant = parseFloat(document.getElementById('montant').value);
        const statut = document.getElementById('statut_paiement').value;

        if (!cin || parseInt(cin) <= 0) {
            alert('❌ CIN non chargé. Veuillez vous connecter.');
            event.preventDefault(); return;
        }
        if (!projet || parseInt(projet) <= 0) {
            alert('❌ Aucun projet sélectionné.');
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
