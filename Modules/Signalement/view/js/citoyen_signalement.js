// Cache local des signalements pour le suivi technique côté citoyen
const signalementsCache = {};

// Gestion de la soumission du formulaire
document.addEventListener("DOMContentLoaded", function () {
    initialiserGraphiqueImpact();
    const form = document.getElementById("formSignalement");
    if (!form) return;

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        let cinField = document.getElementById("num_cin") || document.getElementById("cin");
        let cin = cinField ? cinField.value : '';
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
        
        // Validation photo OPTIONNELLE
        if (photo) {
            // Vérification format PNG et Taille (2Mo)
            if (photo.type !== "image/png") {
                afficherMessage("Seul le format PNG est accepté pour la photo.", "danger");
                return;
            }
            if (photo.size > 2 * 1024 * 1024) {
                afficherMessage("La photo est trop lourde (maximum 2 Mo).", "danger");
                return;
            }
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

                    // Notification Toast pour confirmation immédiate
                    if (typeof afficherSuccesToast === 'function') {
                        afficherSuccesToast("Votre signalement a été envoyé avec succès !");
                    }

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
        input.addEventListener('input', function () {
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

// Charger les signalements du citoyen connecté
function chargerMesSignalements(cin = null) {
    const cinValide = cin !== null && cin !== undefined ? String(cin).trim() : '';
    if (!/^[0-9]{8}$/.test(cinValide)) {
        afficherMessageDansContainer("Impossible de récupérer votre CIN de session.", "warning");
        return;
    }

    const container = document.getElementById("mesSignalements");
    if (container) {
        container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p>Chargement...</p></div>';
    }

    fetch(`../controller/SignalementController.php?action=getByCin&cin=${encodeURIComponent(cinValide)}`)
        .then(res => res.json())
        .then(signalements => {
            if (signalements.length === 0) {
                if (container) {
                    container.innerHTML = '<div class="alert alert-info">Aucun signalement trouvé pour votre compte.</div>';
                }
                return;
            }

            let html = `
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Titre</th>
                                <th>Date</th>
                                <th>Priorité</th>
                                <th>Statut</th>
                                <th>Localisation</th>
                                <th>Suivi</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            signalements.forEach(sig => {
                let prog = sig.progression || 0;
                let color = prog === 100 ? 'bg-success' : (prog > 50 ? 'bg-primary' : 'bg-info');
                const statut = (sig.statut || 'ouvert').toLowerCase();
                const priorite = sig.niveau_priorite || 'Normale';
                
                // Statut en texte simple
                let statusBadge = `<span class="text-muted small">${statut === 'en_cours' ? 'En cours' : (statut.includes('term') ? 'Résolu' : 'Ouvert')}</span>`;
                
                // Priorité en texte simple, SAUF pour SOS
                let prioriteBadge = priorite === 'SOS_VITALE'
                    ? '<span class="badge bg-danger">SOS vitale</span>'
                    : `<span class="text-muted small">${escapeHtml(priorite)}</span>`;
                const description = sig.description || '';
                const resume = escapeHtml(description.slice(0, 160));
                const photoUrl = sig.photo_url ? `../../../assets/img/signalements/${escapeHtml(sig.photo_url)}` : '../../../assets/img/signalements/default.png';
                const localisation = sig.latitude && sig.longitude
                    ? `<span class="badge bg-info text-dark">GPS</span> <span class="small text-muted d-block mt-1">${sig.latitude}, ${sig.longitude}</span>`
                    : '<span class="text-muted small">Non partagée</span>';
                const estModifiable = statut === 'ouvert';
                const actions = estModifiable
                    ? `
                        <div class="d-flex gap-1">
                            <a class="btn" style="background-color:#f68d56; border-color:#f68d56; color:#fff; padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 8px;" href="modifier_signalement.php?id=${sig.id_signalement}" title="Modifier">
                                <i class="bi bi-pencil-square"></i>
                            </a>
                            <form method="POST" action="../controller/SignalementController.php" class="m-0" onsubmit="return confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?');">
                                <input type="hidden" name="action" value="citizenDelete">
                                <input type="hidden" name="id_signalement" value="${sig.id_signalement}">
                                <button type="submit" class="btn" style="background-color:#e9783e; border-color:#e9783e; color:#fff; padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 8px;" title="Supprimer">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </form>
                        </div>
                    `
                    : `<span class="text-muted small">Non modifiable</span>`;

                html += `
                    <tr>
                        <td class="fw-semibold">#${sig.id_signalement}</td>
                        <td>
                            <div class="d-flex align-items-center gap-3">
                                <img src="${photoUrl}" alt="${escapeHtml(sig.titre || 'Signalement')}" style="width: 54px; height: 54px; object-fit: cover; border-radius: 12px;">
                                <div>
                                    <div class="fw-semibold text-dark">${escapeHtml(sig.titre || 'Sans titre')}</div>
                                    <div class="text-muted small" style="max-width: 420px;">${resume}${description.length > 160 ? '...' : ''}</div>
                                </div>
                            </div>
                        </td>
                        <td>${sig.date_signalement ? new Date(sig.date_signalement).toLocaleDateString('fr-FR') : '--'}</td>
                        <td>${prioriteBadge}</td>
                        <td>${statusBadge}</td>
                        <td>${localisation}</td>
                        <td>
                            <div id="suivi-${sig.id_signalement}"></div>
                        </td>
                        <td>${actions}</td>
                    </tr>
                `;
                signalementsCache[sig.id_signalement] = sig;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
            if (container) {
                container.innerHTML = html;
            }

            signalements.forEach(sig => {
                verifierSuiviTechnique(sig.id_signalement);
            });
        })
        .catch(error => {
            console.error("Erreur:", error);
            if (container) {
                container.innerHTML = '<div class="alert alert-danger">Erreur de chargement des signalements.</div>';
            }
        });
}

function chargerMesSignalementsSession() {
    const container = document.getElementById('mesSignalements');
    const cinField = document.getElementById('num_cin');

    if (container) {
        container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 mb-0 text-muted">Chargement de vos signalements...</p></div>';
    }

    const projectRoot = window.location.pathname.substring(0, window.location.pathname.indexOf('/Modules/')) ||
        window.location.pathname.substring(0, window.location.pathname.indexOf('/assets/')) ||
        '/civicplus';

    fetch(`${projectRoot}/Modules/User/Controller/auth.php`)
        .then(response => response.json())
        .then(session => {
            if (session && session.logged_in && session.num_cin) {
                chargerMesSignalements(session.num_cin);
                return;
            }

            let attempts = 0;
            const maxAttempts = 120;

            const waitForCin = function () {
                const cin = cinField ? String(cinField.value || '').trim() : '';

                if (/^[0-9]{8}$/.test(cin)) {
                    chargerMesSignalements(cin);
                    return;
                }

                attempts += 1;
                if (attempts >= maxAttempts) {
                    if (container) {
                        container.innerHTML = '<div class="alert alert-warning">Impossible de récupérer votre CIN de session.</div>';
                    }
                    return;
                }

                setTimeout(waitForCin, 100);
            };

            waitForCin();
        })
        .catch(err => {
            console.error("Erreur de récupération de session:", err);
            // On tente quand même via le champ HIDDEN au cas où auth.js a réussi
            let attempts = 0;
            const maxAttempts = 50; // Réduit à 5s pour pas bloquer trop longtemps

            const waitForCin = function () {
                const cin = cinField ? String(cinField.value || '').trim() : '';

                if (/^[0-9]{8}$/.test(cin)) {
                    chargerMesSignalements(cin);
                    return;
                }

                attempts += 1;
                if (attempts >= maxAttempts) {
                    if (container) {
                        container.innerHTML = '<div class="alert alert-warning">Impossible de récupérer votre CIN de session.</div>';
                    }
                    return;
                }

                setTimeout(waitForCin, 100);
            };

            waitForCin();
        });
}

document.addEventListener('DOMContentLoaded', function () {
    chargerMesSignalementsSession();
    verifierMessagesFlash();
});

function verifierMessagesFlash() {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');

    if (msg === 'updated') {
        afficherSuccesToast("Modification effectuée avec succès !");
    } else if (msg === 'deleted') {
        afficherSuccesToast("Suppression effectuée avec succès !");
    } else if (msg === 'error') {
        afficherMessageDansContainer("Une erreur est survenue lors de l'opération.", "danger");
    }

    // Nettoyer l'URL sans recharger la page
    if (msg) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
}

function afficherSuccesToast(message) {
    // Créer le conteneur de toast s'il n'existe pas
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    const toastId = 'toast-success-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-success border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true" style="border-radius: 12px; margin-top: 80px;">
            <div class="d-flex">
                <div class="toast-body">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-check-circle-fill fs-4"></i>
                        <div>
                            <strong class="d-block">Succès !</strong>
                            ${message}
                        </div>
                    </div>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('afterbegin', toastHtml);
    const toastEl = document.getElementById(toastId);
    const bsToast = new bootstrap.Toast(toastEl, { delay: 5000 });
    bsToast.show();
}

// GESTION DU RATING PAR ÉTOILES
document.addEventListener('click', function (e) {
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

            let labels = [];
            let values = [];

            if (serverData && serverData.length > 0) {
                labels = serverData.map(item => new Date(item.jour).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
                values = serverData.map(item => item.total);
            }

            // MISE À JOUR DES NOMBRES RÉELS (KPI)
            if (kpis) {
                if (document.getElementById('kpi-total'))
                    document.getElementById('kpi-total').innerText = kpis.total_resolus.toLocaleString();

                if (document.getElementById('kpi-trend'))
                    document.getElementById('kpi-trend').innerText = kpis.trend;

                if (document.getElementById('kpi-success-rate'))
                    document.getElementById('kpi-success-rate').innerText = kpis.taux_succes + '%';

                if (document.getElementById('kpi-avg-delay'))
                    document.getElementById('kpi-avg-delay').innerText = kpis.delai_moyen;
            }

            const option = {
                color: ['#3b82f6'],
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'line', lineStyle: { color: '#f1f5f9', width: 2 } },
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderColor: '#f1f5f9',
                    borderWidth: 1,
                    textStyle: { color: '#1e293b' },
                    formatter: function(params) {
                        return `<div style="padding: 5px;">
                                    <div style="font-size: 10px; color: #64748b; margin-bottom: 3px;">${params[0].name}</div>
                                    <div style="font-weight: bold; color: #1e293b;">
                                        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f68d56;margin-right:5px;"></span>
                                        ${params[0].value} interventions
                                    </div>
                                </div>`;
                    }
                },
                grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: labels,
                    axisLine: { lineStyle: { color: '#f1f5f9' } },
                    axisLabel: { color: '#94a3b8', fontSize: 10, margin: 15 }
                },
                yAxis: {
                    type: 'value',
                    axisLine: { show: false },
                    axisLabel: { color: '#94a3b8', fontSize: 10 },
                    splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
                },
                series: [{
                    name: 'Interventions',
                    type: 'line',
                    smooth: 0.4,
                    showSymbol: true,
                    symbol: 'circle',
                    symbolSize: 6,
                    itemStyle: { color: '#f68d56', borderSize: 2, borderColor: '#fff' },
                    lineStyle: { width: 3, color: '#3b82f6' },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
                            { offset: 1, color: 'rgba(59, 130, 246, 0)' }
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
        titreInput.addEventListener('input', function () {
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
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
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
                        <button class="btn btn-sm shadow-sm fw-bold text-white" style="border-radius: 8px; background-color: #f68d56;" 
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

// Fonction pour afficher le rapport final au citoyen avec design Elite et Export
function afficherResultatIntervention(equipe, date, comm) {
    let modalEl = document.getElementById('resultatModal');
    if (!modalEl) {
        const modalHtml = `
            <div class="modal fade" id="resultatModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content border-0 shadow-lg" style="border-radius: 24px; overflow: hidden;">
                        <!-- En-tête avec fond dégradé orangé -->
                        <div class="modal-header border-0 p-4 d-flex align-items-center" style="background: linear-gradient(135deg, #f68d56 0%, #ff9d6c 100%); color: white;">
                            <div class="d-flex align-items-center gap-3">
                                <div class="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style="width: 45px; height: 45px; color: #f68d56;">
                                    <i class="bi bi-file-earmark-pdf-fill fs-4"></i>
                                </div>
                                <div>
                                    <h5 class="modal-title fw-bold mb-0">Rapport d'Intervention Officiel</h5>
                                    <small class="opacity-75">Certifié par les services CivicPlus</small>
                                </div>
                            </div>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>

                        <!-- Corps du rapport (Zone imprimable) -->
                        <div class="modal-body p-0" id="printableReport">
                            <div class="p-4 p-md-5">
                                <!-- Filigrane et Logo de fond -->
                                <div class="position-relative">
                                    <div class="text-center mb-5">
                                        <div class="d-inline-flex align-items-center justify-content-center mb-3" style="width: 80px; height: 80px; background: rgba(246, 141, 86, 0.05); border: 2px solid #f68d56; border-radius: 20px; color: #f68d56; font-size: 2.5rem;">
                                            <i class="bi bi-shield-check"></i>
                                        </div>
                                        <h2 class="fw-bold text-dark mb-1">PROBLÈME RÉSOLU</h2>
                                        <p class="text-muted text-uppercase ls-1" style="letter-spacing: 2px; font-size: 0.8rem;">Dossier de maintenance technique</p>
                                    </div>

                                    <div class="row g-4 mb-5">
                                        <div class="col-md-6">
                                            <div class="p-3 rounded-4 h-100" style="background: #f8fafc; border: 1px solid #f1f5f9;">
                                                <div class="small text-muted text-uppercase fw-bold mb-2" style="letter-spacing: 0.5px;">Équipe d'Intervention</div>
                                                <div class="d-flex align-items-center gap-2">
                                                    <i class="bi bi-people-fill text-warning"></i>
                                                    <span class="fw-bold text-dark fs-5" id="resEquipe"></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="p-3 rounded-4 h-100" style="background: #f8fafc; border: 1px solid #f1f5f9;">
                                                <div class="small text-muted text-uppercase fw-bold mb-2" style="letter-spacing: 0.5px;">Date de Clôture</div>
                                                <div class="d-flex align-items-center gap-2">
                                                    <i class="bi bi-calendar-check-fill text-warning"></i>
                                                    <span class="fw-bold text-dark fs-5" id="resDate"></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mb-5">
                                        <div class="d-flex align-items-center gap-2 mb-3">
                                            <h6 class="fw-bold text-dark mb-0">Rapport Technique de l'Équipe</h6>
                                            <div class="flex-grow-1 border-bottom" style="border-color: #f1f5f9 !important;"></div>
                                        </div>
                                        <div class="p-4 bg-white rounded-4 shadow-sm border" style="border-left: 6px solid #f68d56 !important;">
                                            <p class="text-dark mb-0 lh-lg" id="resComm" style="font-size: 1.05rem; white-space: pre-line;"></p>
                                        </div>
                                    </div>

                                    <!-- Signature / Tampon -->
                                    <div class="d-flex justify-content-between align-items-end mt-5">
                                        <div>
                                            <p class="text-muted small mb-0">Rapport généré le <span id="currentDateReport"></span></p>
                                            <p class="text-muted small">CivicPlus Portal - Système de Gestion Citoyenne</p>
                                        </div>
                                        <div class="text-center opacity-50" style="transform: rotate(-10deg);">
                                            <div class="border border-3 border-warning rounded px-3 py-1 fw-bold text-warning text-uppercase" style="font-size: 0.7rem; border-style: double !important;">
                                                Service Technique<br>APPROUVÉ
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer avec actions -->
                        <div class="modal-footer border-0 p-4 bg-light d-flex justify-content-between">
                            <button type="button" class="btn btn-outline-secondary px-4 rounded-pill fw-bold" data-bs-dismiss="modal">
                                Fermer
                            </button>
                            <div class="d-flex gap-2">
                                <button type="button" class="btn btn-dark px-4 rounded-pill fw-bold" onclick="exporterRapportPDF()">
                                    <i class="bi bi-printer me-2"></i> Exporter en PDF
                                </button>
                                <button type="button" class="btn text-white px-4 rounded-pill fw-bold" style="background-color: #f68d56;" data-bs-dismiss="modal">
                                    Terminer
                                </button>
                            </div>
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
    document.getElementById('currentDateReport').innerText = new Date().toLocaleDateString('fr-FR');

    // Afficher le modal
    new bootstrap.Modal(modalEl).show();
}

// Fonction d'exportation intelligente
function exporterRapportPDF() {
    const content = document.getElementById('printableReport').innerHTML;
    const printWindow = window.open('', '', 'height=800,width=1000');
    
    printWindow.document.write('<html><head><title>Rapport d\'Intervention CivicPlus</title>');
    printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">');
    printWindow.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }');
    printWindow.document.write('.ls-1 { letter-spacing: 2px; }');
    printWindow.document.write('h2 { color: #f68d56 !important; }');
    printWindow.document.write('.bg-light { background-color: #f8fafc !important; }');
    printWindow.document.write('.rounded-4 { border-radius: 1rem !important; }');
    printWindow.document.write('.border-warning { border-color: #f68d56 !important; }');
    printWindow.document.write('.text-warning { color: #f68d56 !important; }');
    printWindow.document.write('@media print { .no-print { display: none; } }');
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    
    // Attendre le chargement des styles avant d'imprimer
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 800);
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