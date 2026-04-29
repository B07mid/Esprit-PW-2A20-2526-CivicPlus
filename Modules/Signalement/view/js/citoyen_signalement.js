// Gestion de la soumission du formulaire
document.addEventListener("DOMContentLoaded", function() {
    initialiserGraphiqueImpact();
    const form = document.getElementById("formSignalement");
    if (!form) return;

    form.addEventListener("submit", function(event) {
        event.preventDefault();

        let cin = document.getElementById("cin").value;
        let titre = document.getElementById("titre").value.trim();
        let description = document.getElementById("description").value.trim();
        let photo = document.getElementById("photo").files[0];

        // Validations
        if (!/^[0-9]{8}$/.test(cin)) {
            afficherMessage("Le numéro CIN est invalide. Il doit contenir exactement 8 chiffres.", "danger");
            return;
        }
        if (titre.length < 10) {
            afficherMessage("Le titre est trop court (minimum 10 caractères).", "danger");
            return;
        }
        if (description.length < 15) {
            afficherMessage("La description est trop courte (minimum 15 caractères).", "danger");
            return;
        }
        if (!photo) {
            afficherMessage("Veuillez ajouter une photo de l'incident.", "danger");
            return;
        }
        
        // Vérification format PNG et Taille (2Mo)
        if (photo.type !== "image/png") {
            afficherMessage("Seul le format PNG est accepté pour la photo.", "danger");
            return;
        }
        if (photo.size > 2 * 1024 * 1024) {
            afficherMessage("La photo est trop lourde (maximum 2 Mo).", "danger");
            return;
        }

        const formData = new FormData(form);

        fetch(form.action, {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Capturer le délai prédit pour l'afficher dans le succès
                const predictedSLA = document.getElementById('estimatedTimeValue').innerText;
                const successSLA = document.getElementById('successSLA');
                if (successSLA) successSLA.innerText = predictedSLA;

                // Afficher le modal de feedback professionnel Elite
                const feedbackModal = new bootstrap.Modal(document.getElementById('feedbackModal'));
                feedbackModal.show();
                
                // Réinitialiser le formulaire
                form.reset();
                const uploadBox = document.querySelector('.photo-upload-box');
                uploadBox.innerHTML = `
                    <i class="bi bi-camera" style="font-size: 3rem; color: #4f46e5;"></i>
                    <p class="mt-2 fw-bold" style="color: #4f46e5;">Cliquez pour ajouter une photo du problème (PNG uniquement)</p>
                `;
                // Cacher le badge d'estimation
                const timeContainer = document.getElementById('timeEstimationContainer');
                if (timeContainer) timeContainer.classList.add('d-none');
            } else {
                afficherMessage("Erreur serveur : " + (data.error || "Inconnue"), "danger");
            }
        })
        .catch(error => {
            console.error("Erreur:", error);
            afficherMessage("Une erreur de connexion est survenue.", "danger");
        });
    });

    // Effacer les messages d'erreur dès que l'utilisateur commence à corriger
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const ancien = document.getElementById("msg-signalement");
            if (ancien) ancien.remove();
        });
    });
});

// Fonction pour afficher les messages
function afficherMessage(texte, type) {
    const form = document.getElementById("formSignalement");
    const ancien = document.getElementById("msg-signalement");
    if (ancien) ancien.remove();

    const msg = document.createElement("div");
    msg.id = "msg-signalement";
    msg.className = `alert alert-${type} text-center mt-3`;
    msg.innerText = texte;

    const boutons = document.querySelector(".text-center.mt-4");
    if (form && boutons) {
        form.insertBefore(msg, boutons);
    }

    if (type === "success") {
        setTimeout(() => msg.remove(), 5000);
    }
}

// Charger les signalements d'un citoyen
function chargerMesSignalements() {
    const cin = document.getElementById("cin_check").value;
    if (!/^[0-9]{8}$/.test(cin)) {
        afficherMessageDansContainer("Veuillez entrer un CIN valide (8 chiffres)", "warning");
        return;
    }

    const container = document.getElementById("mesSignalements");
    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p>Chargement...</p></div>';

    fetch(`../controller/SignalementController.php?action=getByCin&cin=${cin}`)
        .then(res => res.json())
        .then(signalements => {
            if (signalements.length === 0) {
                container.innerHTML = '<div class="alert alert-info">Aucun signalement trouvé pour ce CIN.</div>';
                return;
            }

            let html = `
                <div class="table-responsive">
                    <table class="table table-hover table-sm">
                        <thead class="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Titre</th>
                                <th>Statut</th>
                                <th>Priorité</th>
                                <th>Date</th>
                                <th>Suivi</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            signalements.forEach(sig => {
                let prog = sig.progression || 0;
                let color = prog === 100 ? 'bg-success' : (prog > 50 ? 'bg-primary' : 'bg-info');
                
                html += `
                    <tr>
                        <td>#${sig.id_signalement}</td>
                        <td><strong>${escapeHtml(sig.titre)}</strong></td>
                        <td>${sig.statut}</td>
                        <td>${sig.niveau_priorite}</td>
                        <td>${new Date(sig.date_signalement).toLocaleDateString('fr-FR')}</td>
                        <td>
                            <div class="progress mb-2" style="height: 10px;">
                                <div class="progress-bar ${color}" style="width: ${prog}%"></div>
                            </div>
                            <div id="suivi-${sig.id_signalement}">
                                <!-- Le bouton de résultat ou le suivi technique s'affichera ici -->
                            </div>
                        </td>
                        <td class="text-center">
                            <a href="javascript:void(0)" class="btn btn-sm btn-outline-primary shadow-sm" style="border-radius: 8px;" onclick='ouvrirModification(${sig.id_signalement}, ${JSON.stringify(escapeHtml(sig.titre))}, ${JSON.stringify(escapeHtml(sig.description))})'>
                                <i class="bi bi-pencil"></i>
                            </a>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
                <small class="text-muted">Vous pouvez modifier le titre et la description de vos signalements.</small>
            `;
            container.innerHTML = html;
            
            // Appel après injection dans le DOM pour éviter la condition de course (race condition)
            signalements.forEach(sig => {
                verifierSuiviTechnique(sig.id_signalement);
            });
        })
        .catch(error => {
            console.error("Erreur:", error);
            container.innerHTML = '<div class="alert alert-danger">Erreur de chargement des signalements.</div>';
        });
}

// GESTION DU RATING PAR ÉTOILES
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('star-input')) {
        const val = parseInt(e.target.getAttribute('data-value'));
        const stars = document.querySelectorAll('.star-input');
        
        stars.forEach(star => {
            const starVal = parseInt(star.getAttribute('data-value'));
            if (starVal <= val) {
                star.style.color = '#ffc107'; // Jaune doré
            } else {
                star.style.color = '#ddd'; // Gris clair
            }
        });
        
        const thanks = document.getElementById('feedbackThanks');
        if (thanks) thanks.classList.remove('d-none');
    }
});

function initialiserGraphiqueImpact() {
    const chartDom = document.getElementById('impactChart');
    if (!chartDom) return;

    const myChart = echarts.init(chartDom);
    
    fetch('../controller/SignalementController.php?action=getChartData')
        .then(res => res.json())
        .then(response => {
            const serverData = response.chart;
            const kpis = response.kpis;

            let labels = ['12 Avr', '14 Avr', '16 Avr', '18 Avr', '20 Avr', '22 Avr', '24 Avr'];
            let values = [150, 420, 310, 680, 520, 890, 1140];

            if (serverData && serverData.length > 0) {
                labels = serverData.map(item => new Date(item.jour).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'}));
                values = serverData.map(item => item.total);
            }

            // MISE À JOUR DES NOMBRES RÉELS (KPI)
            if (kpis) {
                document.getElementById('kpi-total').innerText = kpis.total_resolus.toLocaleString();
                // Mise à jour du taux de succès dans la colonne latérale
                const rateEl = document.querySelector('.reassurance-stats span.fw-bold');
                if (rateEl) rateEl.innerText = kpis.taux_succes + '%';
            }

            const option = {
                color: ['#42b983'],
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'line', lineStyle: { color: '#eee' } },
                    backgroundColor: '#fff',
                    borderColor: '#eee',
                    borderWidth: 1,
                    formatter: '{b} : <b>{c} résolutions</b>'
                },
                grid: { left: '10%', right: '5%', bottom: '15%', top: '5%', containLabel: false },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: labels,
                    axisLine: { lineStyle: { color: '#eee' } },
                    axisLabel: { color: '#999', fontSize: 10 }
                },
                yAxis: {
                    type: 'value',
                    axisLine: { show: false },
                    axisLabel: { color: '#999', fontSize: 10 },
                    splitLine: { lineStyle: { color: '#f5f5f5' } }
                },
                series: [{
                    name: 'Résolutions',
                    type: 'line',
                    smooth: 0.3,
                    showSymbol: false,
                    lineStyle: { width: 3, color: '#42b983' },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(66, 185, 131, 0.2)' },
                            { offset: 1, color: 'rgba(66, 185, 131, 0)' }
                        ])
                    },
                    data: values,
                    animationDuration: 2000
                }]
            };

            myChart.setOption(option);
        });

    // ESTIMATION PRÉDICTIVE DU TEMPS (MÉTIER AVANCÉ)
    const titreInput = document.getElementById('titre');
    const timeContainer = document.getElementById('timeEstimationContainer');
    const timeValue = document.getElementById('estimatedTimeValue');

    if (titreInput && timeContainer) {
        titreInput.addEventListener('input', function() {
            const val = this.value.toLowerCase();
            let estimation = "";

            if (val.match(/gaz|incendie|explosion|danger|majeure/)) {
                estimation = "1h - 2h (Priorité Critique)";
            } else if (val.match(/fuite|eau|inondation|canalisation/)) {
                estimation = "4h - 6h";
            } else if (val.match(/panne|éclairage|lampe|noir/)) {
                estimation = "12h - 24h";
            } else if (val.match(/nid de poule|route|chaussée|trou/)) {
                estimation = "2 - 3 jours";
            } else if (val.length > 5) {
                estimation = "24h - 48h";
            }

            if (estimation) {
                timeValue.innerText = estimation;
                timeContainer.classList.remove('d-none');
            } else {
                timeContainer.classList.add('d-none');
            }
        });
    }

    window.addEventListener('resize', () => myChart.resize());
}

function afficherMessageDansContainer(texte, type) {
    const container = document.getElementById("mesSignalements");
    const msg = document.createElement("div");
    msg.className = `alert alert-${type} mt-2`;
    msg.innerText = texte;
    container.innerHTML = '';
    container.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}

const NOTIFICATION_SOUND = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function ouvrirModification(id, titre, description) {
    document.getElementById("edit_id").value = id;
    document.getElementById("edit_titre").value = titre;
    document.getElementById("edit_description").value = description;
    new bootstrap.Modal(document.getElementById("editModal")).show();
}

function sauvegarderModification() {
    const id = document.getElementById("edit_id").value;
    const titre = document.getElementById("edit_titre").value.trim();
    const description = document.getElementById("edit_description").value.trim();

    if (titre.length < 5) {
        alert("❌ Le titre doit contenir au moins 5 caractères.");
        return;
    }
    if (description.length < 10) {
        alert("❌ La description doit contenir au moins 10 caractères.");
        return;
    }

    const formData = new FormData();
    formData.append("action", "updateComplete");
    formData.append("id_signalement", id);
    formData.append("titre", titre);
    formData.append("description", description);

    fetch("../controller/SignalementController.php", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
            afficherMessageDansContainer("Signalement modifié avec succès !", "success");
            chargerMesSignalements();
        } else {
            alert("❌ Erreur lors de la modification");
        }
    })
    .catch(error => {
        console.error("Erreur:", error);
        alert("❌ Erreur de connexion");
    });
}

function verifierSuiviTechnique(id_sig) {
    fetch(`../controller/InterventionController.php?action=get&id_signalement=${id_sig}`)
        .then(res => res.json())
        .then(data => {
            const td = document.getElementById(`suivi-${id_sig}`);
            if (!td) return; // Si l'élément n'existe pas dans le DOM, on arrête
            
            if (data.success) {
                let currentStatut = data.data.statut ? data.data.statut.toLowerCase().trim() : '';
                // Accepte "termine", "terminée", "Terminée", "términée", etc.
                if (currentStatut.includes('termin')) {
                    // --- LOGIQUE DE NOTIFICATION SONORE ---
                    const dejaNotifie = localStorage.getItem(`notifie_res_${id_sig}`);
                    if (!dejaNotifie) {
                        afficherNotificationTerminee(id_sig);
                        localStorage.setItem(`notifie_res_${id_sig}`, 'true');
                    }
                    // --- FIN LOGIQUE ---

                    // Si l'intervention est terminée, on affiche le bouton de résultat
                    const commSafe = data.data.comm || "Intervention clôturée avec succès.";
                    const equipeSafe = data.data.equipe || "Équipe non spécifiée";
                    const dateSafe = new Date(data.data.date).toLocaleDateString('fr-FR');
                    
                    td.innerHTML = `
                        <button class="btn btn-sm btn-success shadow-sm fw-bold" style="border-radius: 8px;" 
                                onclick='afficherResultatIntervention(${JSON.stringify(escapeHtml(equipeSafe))}, ${JSON.stringify(dateSafe)}, ${JSON.stringify(escapeHtml(commSafe))})'>
                            <i class="bi bi-file-earmark-check"></i> Voir le résultat
                        </button>
                    `;
                } else {
                    // Sinon on affiche le suivi classique
                    td.innerHTML = `<span class="text-primary" style="font-size: 0.85rem; font-weight: 500;" title="${escapeHtml(data.data.comm)}">
                        <i class="bi bi-tools"></i> En charge: ${escapeHtml(data.data.equipe)}<br>
                        <i class="bi bi-calendar-event"></i> Prévu: ${new Date(data.data.date).toLocaleDateString('fr-FR')}
                    </span>`;
                }
            } else {
                td.innerHTML = `<span class="text-muted small">En attente d'affectation</span>`;
            }
        });
}

// Nouvelle fonction pour afficher le rapport final au citoyen
function afficherResultatIntervention(equipe, date, comm) {
    // Vérifier si le modal existe déjà, sinon on le crée dynamiquement
    let modalEl = document.getElementById('resultatModal');
    if (!modalEl) {
        const modalHtml = `
            <div class="modal fade" id="resultatModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content" style="border-radius: 20px; border: none; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                        <div class="modal-header bg-success text-white border-0">
                            <h5 class="modal-title fw-bold"><i class="bi bi-check-circle-fill me-2"></i> Rapport d'Intervention</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div class="text-center mb-4">
                                <div class="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 60px; height: 60px; font-size: 2rem;">
                                    <i class="bi bi-tools"></i>
                                </div>
                                <h4 class="fw-bold text-dark">Problème Résolu</h4>
                                <p class="text-muted">Merci pour votre signalement !</p>
                            </div>
                            
                            <div class="card bg-light border-0" style="border-radius: 15px;">
                                <div class="card-body">
                                    <p class="mb-2"><strong class="text-primary"><i class="bi bi-people-fill"></i> Équipe intervenante :</strong> <span id="resEquipe"></span></p>
                                    <p class="mb-2"><strong class="text-primary"><i class="bi bi-calendar-check-fill"></i> Date de résolution :</strong> <span id="resDate"></span></p>
                                    <hr>
                                    <strong class="text-primary"><i class="bi bi-journal-text"></i> Rapport technique :</strong>
                                    <div class="mt-2 p-3 bg-white rounded shadow-sm text-dark" id="resComm" style="font-style: italic; border-left: 4px solid #198754;"></div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-0 d-flex justify-content-center pb-4">
                            <button type="button" class="btn btn-success rounded-pill px-4" data-bs-dismiss="modal">Fermer le rapport</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modalEl = document.getElementById('resultatModal');
    }

    // Remplir les données
    document.getElementById('resEquipe').innerText = equipe;
    document.getElementById('resDate').innerText = date;
    document.getElementById('resComm').innerText = comm;

    // Afficher le modal
    new bootstrap.Modal(modalEl).show();
}

// Fonction pour afficher un Toast de notification avec son
function afficherNotificationTerminee(id_sig) {
    // Jouer le son
    NOTIFICATION_SOUND.play().catch(e => console.log("Audio bloqué par le navigateur (nécessite une interaction)"));

    // Créer le conteneur de toast s'il n'existe pas
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    const toastId = 'toast-' + id_sig;
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-success border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true" style="border-radius: 12px; margin-top: 80px;">
            <div class="d-flex">
                <div class="toast-body">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-bell-fill fs-4 animate__animated animate__tada animate__infinite"></i>
                        <div>
                            <strong class="d-block">🔔 Bonne nouvelle !</strong>
                            Votre signalement #${id_sig} a été résolu.
                        </div>
                    </div>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="p-2 border-top border-white opacity-50 text-center">
                <small>Consultez les détails dans le tableau</small>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('afterbegin', toastHtml);
    const toastEl = document.getElementById(toastId);
    const bsToast = new bootstrap.Toast(toastEl, { delay: 10000 });
    bsToast.show();
}