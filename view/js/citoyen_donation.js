document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('formDonation');
    if (!form) return;

    const methodeSelect = document.getElementById('methode_paiement');
    const flouciPanel = document.getElementById('flouciPanel');
    const creditCardPanel = document.getElementById('creditCardPanel');
    const savedCardsPanel = document.getElementById('savedCardsPanel');
    const savedCardsList = document.getElementById('savedCardsList');
    const useNewCardBtn = document.getElementById('useNewCardBtn');
    const savedPaymentCardId = document.getElementById('saved_payment_card_id');
    const flouciTransactionId = document.getElementById('flouci_transaction_id');
    const preuvePaiementImage = document.getElementById('preuve_paiement_image');
    const cardName = document.getElementById('cardName');
    const cardNumber = document.getElementById('cardNumber');
    const expiryDate = document.getElementById('expiryDate');
    const cvv = document.getElementById('cvv');
    const saveCardModalEl = document.getElementById('saveCardModal');
    const saveCardModal = saveCardModalEl ? new bootstrap.Modal(saveCardModalEl) : null;
    let savedCards = [];
    let pendingSubmitAfterSaveChoice = false;

    (function initReference() {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const ref = 'TXN-' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate())
            + '-' + Math.floor(1000 + Math.random() * 9000);
        document.getElementById('reference_transaction').value = ref;
        document.getElementById('reference_display').textContent = ref;
    })();

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

    const params = new URLSearchParams(window.location.search);
    const box = document.getElementById('alertBox');
    if (params.get('success') === '1' && box) {
        box.innerHTML = '<div class="alert alert-success">Donation enregistrée avec succès !</div>';
    } else if (params.get('error') === 'cin_not_found' && box) {
        box.innerHTML = '<div class="alert alert-danger">Ce numéro CIN n\'existe pas dans notre base de données.</div>';
    } else if (params.get('error') === 'db_error' && box) {
        box.innerHTML = '<div class="alert alert-danger">Une erreur est survenue. Veuillez réessayer.</div>';
    } else if (params.get('error') === 'validation' && box) {
        box.innerHTML = '<div class="alert alert-danger">Veuillez corriger les champs invalides avant de confirmer.</div>';
    }

    function setPanelVisible(panel, visible) {
        panel.hidden = !visible;
        panel.classList.toggle('d-none', !visible);
        panel.style.display = visible ? '' : 'none';
    }

    function usingSavedCard() {
        return methodeSelect.value === 'credit_card' && savedPaymentCardId && savedPaymentCardId.value;
    }

    function updateCardFieldState() {
        const isCard = methodeSelect.value === 'credit_card';
        const useSaved = usingSavedCard();
        [cardName, cardNumber, expiryDate].forEach(field => {
            if (!field) return;
            field.required = isCard && !useSaved;
            field.disabled = !isCard;
            field.readOnly = isCard && useSaved;
            field.classList.toggle('is-saved-card-field', isCard && useSaved);
        });
        if (cvv) {
            cvv.required = isCard;
            cvv.disabled = !isCard;
        }
    }

    function updatePaymentPanels() {
        const methode = String(methodeSelect.value || '').toLowerCase();
        setPanelVisible(flouciPanel, methode === 'flouci');
        setPanelVisible(creditCardPanel, methode === 'credit_card');
        flouciTransactionId.required = methode === 'flouci';
        flouciTransactionId.disabled = methode !== 'flouci';
        preuvePaiementImage.required = false;
        preuvePaiementImage.disabled = methode !== 'flouci';
        updateCardFieldState();
        if (methode === 'credit_card') loadSavedCards();
    }

    function loadSavedCards() {
        fetch('../../../Modules/User/Controller/PaymentMethodsController.php', { cache: 'no-store' })
            .then(response => response.json())
            .then(data => {
                savedCards = data.success ? (data.cards || []) : [];
                renderSavedCards();
            })
            .catch(() => {
                savedCards = [];
                renderSavedCards();
            });
    }

    function renderSavedCards() {
        if (!savedCardsPanel || !savedCardsList) return;
        savedCardsPanel.classList.toggle('d-none', savedCards.length === 0);
        savedCardsList.innerHTML = '';

        savedCards.forEach(card => {
            const id = 'saved-card-' + card.card_id;
            const label = document.createElement('label');
            label.className = 'saved-card-choice';
            label.setAttribute('for', id);
            label.innerHTML = `
                <span>
                    <strong>${escapeHtml(String(card.brand || 'card').toUpperCase())}</strong>
                    **** ${escapeHtml(card.last4 || '')}
                    <span class="d-block">${escapeHtml(card.owner || 'Carte')} - ${escapeHtml(card.expiry || '')}</span>
                </span>
                <input type="radio" name="saved_card_choice" id="${id}" value="${escapeHtml(card.card_id)}">
            `;
            label.querySelector('input').addEventListener('change', function () {
                if (this.checked) {
                    applySavedCard(card);
                }
            });
            savedCardsList.appendChild(label);
        });
    }

    function applySavedCard(card) {
        savedPaymentCardId.value = card.card_id || '';
        if (cardName) cardName.value = card.owner || '';
        if (cardNumber) cardNumber.value = '**** **** **** ' + String(card.last4 || '').slice(-4);
        if (expiryDate) expiryDate.value = card.expiry || '';
        if (cvv) {
            cvv.value = '';
            cvv.focus();
        }
        updateCardFieldState();
    }

    function clearSavedCard() {
        savedPaymentCardId.value = '';
        document.querySelectorAll('[name="saved_card_choice"]').forEach(input => { input.checked = false; });
        [cardName, cardNumber, expiryDate].forEach(field => {
            if (!field) return;
            field.readOnly = false;
            field.classList.remove('is-saved-card-field');
            field.value = '';
        });
        if (cvv) cvv.value = '';
        updateCardFieldState();
    }

    useNewCardBtn?.addEventListener('click', function () {
        clearSavedCard();
        cardName?.focus();
    });

    methodeSelect.addEventListener('change', updatePaymentPanels);
    methodeSelect.addEventListener('input', updatePaymentPanels);
    methodeSelect.addEventListener('blur', updatePaymentPanels);
    updatePaymentPanels();
    window.setTimeout(updatePaymentPanels, 50);
    window.setTimeout(updatePaymentPanels, 250);

    cardNumber?.addEventListener('input', function () {
        const digits = cardNumber.value.replace(/\D/g, '').slice(0, 16);
        cardNumber.value = digits.replace(/(.{4})/g, '$1 ').trim();
    });

    expiryDate?.addEventListener('input', function () {
        const digits = expiryDate.value.replace(/\D/g, '').slice(0, 4);
        expiryDate.value = digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits;
    });

    cvv?.addEventListener('input', function () {
        cvv.value = cvv.value.replace(/\D/g, '').slice(0, 4);
    });

    form.addEventListener('submit', function (event) {
        const cin = document.getElementById('num_cin').value.trim();
        const projet = document.getElementById('id_projet').value.trim();
        const montant = parseFloat(document.getElementById('montant').value);
        const methode = document.getElementById('methode_paiement').value;

        if (!/^\d{8}$/.test(cin)) {
            alert('CIN non chargé. Veuillez vous connecter.');
            event.preventDefault(); return;
        }
        if (!projet || parseInt(projet, 10) <= 0) {
            alert('Aucun projet sélectionné.');
            event.preventDefault(); return;
        }
        if (isNaN(montant) || montant <= 0) {
            alert('Le montant doit être un nombre positif.');
            event.preventDefault(); return;
        }
        if (!methode) {
            alert('Veuillez choisir une méthode de paiement.');
            event.preventDefault(); return;
        }
        if (methode === 'flouci' && !flouciTransactionId.value.trim()) {
            alert('Veuillez saisir le Flouci transaction ID.');
            event.preventDefault(); return;
        }
        if (methode === 'credit_card') {
            const cvvOk = /^\d{3,4}$/.test(cvv.value);
            const numberOk = /^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(cardNumber.value);
            const expiryOk = /^\d{2}\/\d{2}$/.test(expiryDate.value);
            const nameOk = cardName.value.trim().length > 0;

            if (!cvvOk || (!usingSavedCard() && (!nameOk || !numberOk || !expiryOk))) {
                alert('Veuillez remplir les informations de la carte.');
                event.preventDefault(); return;
            }

            if (!usingSavedCard() && saveCardModal && !pendingSubmitAfterSaveChoice) {
                event.preventDefault();
                saveCardModal.show();
            }
        }
    });

    document.getElementById('skipSaveCardBtn')?.addEventListener('click', function () {
        pendingSubmitAfterSaveChoice = true;
        saveCardModal.hide();
        form.requestSubmit();
    });

    document.getElementById('confirmSaveCardBtn')?.addEventListener('click', function () {
        const payload = new FormData();
        payload.append('action', 'save');
        payload.append('owner', cardName.value);
        payload.append('card_number', cardNumber.value);
        payload.append('expiry', expiryDate.value);

        fetch('../../../Modules/User/Controller/PaymentMethodsController.php', {
            method: 'POST',
            body: payload
        }).finally(() => {
            pendingSubmitAfterSaveChoice = true;
            saveCardModal.hide();
            form.requestSubmit();
        });
    });

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[char]));
    }
});
