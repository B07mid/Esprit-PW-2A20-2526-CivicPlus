document.addEventListener('DOMContentLoaded', function () {

    var params = new URLSearchParams(window.location.search);
    var preId  = params.get('id_projet');
    var box    = document.getElementById('alertBox');
    var select = document.getElementById('id_projet');
    var hint   = document.getElementById('projetHint');

    // Alert messages from redirect
    if (params.get('success') === '1') {
        if (box) box.innerHTML = '<div class="alert alert-success">&#x2705; Donation enregistree avec succes !</div>';
    } else if (params.get('error') === 'cin_not_found') {
        if (box) box.innerHTML = '<div class="alert alert-danger">&#x274C; Ce numero CIN n\'existe pas dans notre base de donnees.</div>';
    } else if (params.get('error') === 'db_error') {
        if (box) box.innerHTML = '<div class="alert alert-danger">&#x274C; Une erreur est survenue. Veuillez reessayer.</div>';
    }

    // ── Auto-fill CIN from session ────────────────────────────────────────────
    fetch('../../User/Controller/get_current_user.php')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (data.success && data.user) {
                var cinField = document.getElementById('num_cin');
                if (cinField) {
                    cinField.value    = data.user.num_cin;
                    cinField.readOnly = true;
                    cinField.style.background = '#e9ecef';
                    cinField.style.cursor     = 'not-allowed';
                    var col = cinField.closest('.col-md-12');
                    if (col) {
                        var h = document.createElement('div');
                        h.className = 'form-text text-success mt-1';
                        h.innerHTML = '<i class="bi bi-person-check-fill me-1"></i>Connecte en tant que : <strong>' + data.user.nom + ' ' + data.user.prenom + '</strong>';
                        col.appendChild(h);
                    }
                }
            }
        })
        .catch(function () { /* not logged in – field stays editable */ });

    // ── Project field ─────────────────────────────────────────────────────────
    if (select) {
        if (preId) {
            // Arriving from "Donner" button: fetch this specific project immediately
            select.innerHTML = '<option value="">Chargement...</option>';
            select.disabled  = true;
            select.style.background = '#e9ecef';
            select.style.cursor     = 'not-allowed';

            fetch('../Controller/ProjetCrowdfundingController.php?action=getById&id=' + encodeURIComponent(preId))
                .then(function (r) { return r.json(); })
                .then(function (p) {
                    if (p && p.id_projet) {
                        // Replace select with a read-only display input
                        var display = document.createElement('input');
                        display.type      = 'text';
                        display.className = 'form-control';
                        display.readOnly  = true;
                        display.value     = p.titre + ' — ' + p.ville + ', ' + p.quartier;
                        display.style.background = '#e9ecef';
                        display.style.cursor     = 'not-allowed';
                        display.style.color      = '#112f8d';
                        display.style.fontWeight = '500';

                        // Hidden input carries the actual id_projet value
                        var hidden   = document.createElement('input');
                        hidden.type  = 'hidden';
                        hidden.name  = 'id_projet';
                        hidden.value = p.id_projet;

                        select.parentNode.replaceChild(display, select);
                        display.parentNode.appendChild(hidden);

                        if (hint) {
                            hint.innerHTML = '<i class="bi bi-check-circle-fill text-success me-1"></i>'
                                + 'Projet pre-selectionne : <strong>' + p.titre + '</strong>';
                        }
                    } else {
                        // Fallback: show editable dropdown if project not found
                        chargerTousProjets(select, null);
                    }
                })
                .catch(function () {
                    chargerTousProjets(select, null);
                });
        } else {
            // No pre-selection: load full dropdown
            chargerTousProjets(select, null);
        }
    }

    // ── Form validation ───────────────────────────────────────────────────────
    var form = document.getElementById('formDonation');
    if (!form) return;

    form.addEventListener('submit', function (event) {
        var cin     = (document.getElementById('num_cin')          || {}).value || '';
        var projet  = (document.querySelector('[name="id_projet"]') || {}).value || '';
        var montant = parseFloat((document.getElementById('montant')          || {}).value);
        var statut  = (document.getElementById('statut_paiement')  || {}).value || '';

        if (!/^\d{1,15}$/.test(cin.trim()) || parseInt(cin) <= 0) {
            alert('Erreur : Le numero CIN est invalide.');
            event.preventDefault(); return;
        }
        if (!projet || parseInt(projet) <= 0) {
            alert('Erreur : Veuillez selectionner un projet.');
            event.preventDefault(); return;
        }
        if (isNaN(montant) || montant <= 0) {
            alert('Erreur : Le montant doit etre un nombre positif.');
            event.preventDefault(); return;
        }
        if (!statut) {
            alert('Erreur : Veuillez choisir un statut de paiement.');
            event.preventDefault(); return;
        }
    });
});

function chargerTousProjets(select, preId) {
    select.innerHTML = '<option value="" disabled selected>-- Choisir un projet --</option>';
    fetch('../Controller/ProjetCrowdfundingController.php?action=getAll')
        .then(function (r) { return r.json(); })
        .then(function (projets) {
            projets.forEach(function (p) {
                var opt        = document.createElement('option');
                opt.value      = p.id_projet;
                opt.textContent = p.titre + ' -- ' + p.ville + ', ' + p.quartier;
                select.appendChild(opt);
            });
            if (preId) { select.value = preId; }
        })
        .catch(function () {
            select.innerHTML = '<option value="" disabled selected>Erreur de chargement</option>';
        });
}