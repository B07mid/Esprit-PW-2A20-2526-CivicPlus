const IS_ADMIN = true;
// Cache des signalements pour pré-remplir le lieu d'intervention
const signalementsCache = {};

document.addEventListener("DOMContentLoaded", function () {
    console.log("Page chargée, démarrage du script...");
    chargerSignalements();
});

function chargerSignalements() {
    const tableBody = document.getElementById('signalementsTableBody');
    if (!tableBody) {
        console.error("Erreur: L'élément 'signalementsTableBody' n'existe pas dans la page.");
        return;
    }

    console.log("Appel du contrôleur...");
    fetch('../controller/SignalementController.php?action=getAll')
        .then(response => {
            console.log("Statut HTTP:", response.status);
            return response.text();
        })
        .then(text => {
            console.log("Texte brut reçu du serveur:", text);
            try {
                const signalements = JSON.parse(text);
                tableBody.innerHTML = '';

                if (!Array.isArray(signalements) || signalements.length === 0) {
                    tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-4">Aucun signalement trouvé dans la base.</td></tr>`;
                    return;
                }

                signalements.forEach(sig => {
                    let tr = document.createElement('tr');
                    
                    // Sécurité sur les dates
                    let dateFormatee = "---";
                    if (sig.date_signalement) {
                        let dateObj = new Date(sig.date_signalement);
                        dateFormatee = dateObj.toLocaleDateString('fr-FR');
                    }

                    let statut = sig.statut || 'ouvert';
                    let priorite = sig.niveau_priorite || 'Normale';

                    // Mise en évidence SOS
                    let styleLigne = '';
                    let badgePriorite = priorite;
                    
                    if (priorite === 'SOS_VITALE') {
                        styleLigne = 'background-color: #fee2e2; border-left: 5px solid #dc2626;';
                        badgePriorite = `<span class="badge bg-danger animate__animated animate__pulse animate__infinite" style="font-size: 0.85rem;"><i class="bi bi-exclamation-triangle-fill"></i> URGENCE SOS</span>`;
                    } else if (priorite === 'Urgente') {
                        badgePriorite = `<span class="badge bg-warning text-dark">Urgente</span>`;
                    } else {
                        badgePriorite = `<span class="badge bg-secondary">${priorite}</span>`;
                    }

                    tr.innerHTML = `
                        <td style="${styleLigne}">#${sig.id_signalement}</td>
                        <td style="${styleLigne}">${sig.num_cin}</td>
                        <td style="${styleLigne} font-weight: ${priorite === 'SOS_VITALE' ? 'bold' : 'normal'};">${sig.titre}</td>
                        <td style="${styleLigne}">${dateFormatee}</td>
                        <td style="${styleLigne}">${badgePriorite}</td>
                        <td style="${styleLigne}">${statut}</td>
                        <td id="inter-col-${sig.id_signalement}" style="${styleLigne}">
                            <a href="javascript:void(0)" class="text-dark fw-bold" onclick="ouvrirIntervention(${sig.id_signalement})" style="text-decoration:underline;">
                                Planifier
                            </a>
                        </td>
                        <td style="${styleLigne}">
                            <a href="javascript:void(0)" class="text-dark me-3" onclick="ouvrirModifSignalement(${sig.id_signalement}, '${statut}', '${priorite}')" style="text-decoration:underline; font-weight:500;">
                                Modifier
                            </a>
                            <a href="javascript:void(0)" class="text-danger" onclick="supprimerSignalement(${sig.id_signalement})" style="text-decoration:underline; font-weight:500;">
                                Supprimer
                            </a>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                    // Stocker les données pour le modal d'intervention
                    signalementsCache[sig.id_signalement] = sig;
                    verifierIntervention(sig.id_signalement);
                });
            } catch (e) {
                console.error("Erreur de parsing JSON:", e);
                tableBody.innerHTML = `<tr><td colspan="8" class="text-danger p-4">Erreur de données : ${text}</td></tr>`;
            }
        })
        .catch(error => {
            console.error('Erreur Fetch:', error);
            tableBody.innerHTML = `<tr><td colspan="8" class="text-danger p-4">Impossible de se connecter au serveur.</td></tr>`;
        });
}

function ouvrirModifSignalement(id, statut, priorite) {
    document.getElementById('edit_sig_id').value = id;
    document.getElementById('edit_sig_statut').value = statut;
    document.getElementById('edit_sig_priorite').value = priorite;
    new bootstrap.Modal(document.getElementById('signalementModal')).show();
}

document.getElementById('formModifSignalement')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    formData.append('action', 'updateAdmin');

    fetch('../controller/SignalementController.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('signalementModal')).hide();
            chargerSignalements();
            alert("✅ Signalement mis à jour !");
        }
    });
});


function verifierIntervention(id_sig) {
    fetch(`../controller/InterventionController.php?action=get&id_signalement=${id_sig}`)
        .then(res => res.json())
        .then(data => {
            const col = document.getElementById(`inter-col-${id_sig}`);
            if (data.success) {
                col.innerHTML = `<span style="cursor:pointer; font-weight:bold;" class="text-dark" onclick="ouvrirIntervention(${id_sig})">${data.data.statut}</span>`;
            }
        });
}

function ouvrirIntervention(id_sig) {
    document.getElementById('inter_id_signalement').value = id_sig;
    
    fetch(`../controller/InterventionController.php?action=get&id_signalement=${id_sig}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('inter_type').value    = data.data.type;
                document.getElementById('inter_equipe').value  = data.data.equipe;
                document.getElementById('inter_date').value    = data.data.date;
                document.getElementById('inter_statut').value  = data.data.statut;
                document.getElementById('inter_comm').value    = data.data.comm;
                document.getElementById('formIntervention').dataset.mode = 'update';
            } else {
                // Réinitialisation pour nouvelle création
                document.getElementById('formIntervention').reset();
                document.getElementById('inter_id_signalement').value = id_sig;
                document.getElementById('formIntervention').dataset.mode = 'create';
            }

            // === Réinitialisation du module de localisation ===
            const adresseInput    = document.getElementById('inter_adresse');
            const locationResult  = document.getElementById('locationResult');
            const locationError   = document.getElementById('locationError');
            const btnSearch       = document.getElementById('btnSearchLocation');
            const coordLat        = document.getElementById('coordLat');
            const coordLng        = document.getElementById('coordLng');

            // Masquer carte et erreurs
            if (locationResult)  locationResult.classList.add('d-none');
            if (locationError)   locationError.classList.add('d-none');

            // Réinitialiser le bouton
            if (btnSearch) {
                btnSearch.innerHTML       = '<i class="bi bi-search"></i> Localiser';
                btnSearch.style.background = '#4f46e5';
                btnSearch.disabled        = false;
            }

            // Vider les coordonnées
            document.getElementById('inter_latitude').value  = '';
            document.getElementById('inter_longitude').value = '';
            if (coordLat) coordLat.innerText = '--';
            if (coordLng) coordLng.innerText = '--';

            // Pré-remplir le champ adresse avec le titre du signalement
            if (adresseInput) {
                const sig = signalementsCache[id_sig];
                adresseInput.value = sig ? sig.titre : '';
                adresseInput.placeholder = 'Ex: Avenue Habib Bourguiba, Tunis...';
                
                // NOUVEAU: Si le citoyen a partagé ses coordonnées GPS, on affiche la carte direct
                if (sig && sig.latitude && sig.longitude) {
                    const lat = parseFloat(sig.latitude);
                    const lng = parseFloat(sig.longitude);
                    
                    document.getElementById('inter_latitude').value = lat.toFixed(6);
                    document.getElementById('inter_longitude').value = lng.toFixed(6);
                    if (coordLat) coordLat.innerText = lat.toFixed(6) + '°';
                    if (coordLng) coordLng.innerText = lng.toFixed(6) + '°';
                    
                    if (locationResult) locationResult.classList.remove('d-none');
                    if (btnSearch) {
                        btnSearch.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i>Localisé par Citoyen';
                        btnSearch.style.background = '#16a34a';
                        btnSearch.disabled = true;
                    }
                    
                    const confirmedEl = document.getElementById('confirmedAddress');
                    if (confirmedEl) {
                        confirmedEl.innerText = "Position capturée par le citoyen sur le lieu";
                        confirmedEl.title = "Position capturée par le citoyen sur le lieu";
                    }
                    
                    const delta  = 0.008;
                    const bbox   = (lng - delta) + ',' + (lat - delta) + ',' + (lng + delta) + ',' + (lat + delta);
                    const mapEl  = document.getElementById('locationMap');
                    if (mapEl) {
                        document.getElementById('mapLoading').style.display = 'flex';
                        mapEl.src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + bbox + '&layer=mapnik&marker=' + lat + ',' + lng;
                        mapEl.onload = function () {
                            document.getElementById('mapLoading').style.display = 'none';
                        };
                    }
                }
            }

            new bootstrap.Modal(document.getElementById('interventionModal')).show();
        });
}

function supprimerSignalement(id) {
    if (confirm("Voulez-vous vraiment supprimer ce signalement ?")) {
        fetch(`../controller/SignalementController.php?action=delete&id=${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    chargerSignalements();
                }
            });
    }
}

// Gestion du formulaire d'intervention
document.getElementById('formIntervention')?.addEventListener('submit', function(e) {
    e.preventDefault();

    // --- CONTRÔLE DE SAISIE LOGIQUE ---
    const datePlanif = new Date(document.getElementById('inter_date').value);
    const aujourdhui = new Date();
    aujourdhui.setHours(0,0,0,0);
    
    const statut = document.getElementById('inter_statut').value;
    const commentaires = document.getElementById('inter_comm').value.trim();

    if (datePlanif < aujourdhui) {
        alert("⚠️ Logique : On ne peut pas planifier dans le passé.");
        return;
    }

    if (statut === 'termine' && commentaires.length < 5) {
        alert("⚠️ Logique : Un compte-rendu technique est obligatoire pour clôturer une intervention.");
        return;
    }
    // --- FIN ---

    const formData = new FormData(this);
    const mode = this.dataset.mode || 'create';
    formData.append('action', mode); 

    fetch('../controller/InterventionController.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('interventionModal')).hide();
            chargerSignalements();
            let msg = "✅ Intervention enregistrée avec succès !";
            if (data.email_envoye) {
                msg += "\n📧 Un email automatique a été envoyé au citoyen pour l'informer de la résolution.";
            }
            alert(msg);
        } else {
            alert(data.error || "❌ Erreur lors de l'enregistrement.");
        }
    });
});