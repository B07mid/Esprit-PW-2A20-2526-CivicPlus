document.addEventListener("DOMContentLoaded", function() {
    fetch('/civicplus/Modules/User/Controller/auth.php')
        .then(response => response.json())
        .then(session => {
            if (session.logged_in && session.num_cin) {
                chargerDocuments(session.num_cin);
                chargerHistorique(session.num_cin);
            } else {
                const grid = document.getElementById('documentsGrid');
                if (grid) {
                    grid.innerHTML = '<div class="col-12 text-center py-5 text-muted"><p>Veuillez vous connecter pour voir votre portfolio.</p></div>';
                }
            }
        })
        .catch(error => console.error("Erreur Session auth:", error));
});

// --- GESTION DES ONGLETS ---
function afficherOnglet(nomOnglet) {
    document.getElementById('onglet-documents').style.display = (nomOnglet === 'documents') ? 'block' : 'none';
    document.getElementById('onglet-historique').style.display = (nomOnglet === 'historique') ? 'block' : 'none';
}

// --- CHARGER MES DOCUMENTS OFFICIELS ---
function chargerDocuments(cin) {
    const grid = document.getElementById('documentsGrid');
    if (!grid) return;

    fetch(`../Controller/PortfolioController.php?action=getByCin&cin=${cin}`)
        .then(response => response.json())
        .then(documents => {
            grid.innerHTML = '';
            
            if (documents.length === 0) {
                grid.innerHTML = `<div class="col-12 text-center py-5 text-muted">
                    <i class="bi bi-folder-x display-4 d-block mb-3"></i>
                    <p>Aucun document officiel dans votre portfolio.</p>
                </div>`;
                return;
            }

            documents.forEach(doc => {
                let dateDelivrance = new Date(doc.date_delivrance).toLocaleDateString('fr-FR');
                let dateExpiration = new Date(doc.date_expiration).toLocaleDateString('fr-FR');
                
                // Déterminer la couleur du statut
                let statusColor = "bg-success";
                if (doc.statut_document.toLowerCase().includes("expir")) statusColor = "bg-danger";
                else if (doc.statut_document.toLowerCase().includes("attente")) statusColor = "bg-warning text-dark";

                // Déterminer s'il s'agit d'une image
                let docExt = doc.chemin_fichier_officiel.split('.').pop().toLowerCase();
                let isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(docExt);
                
                let mediaPreview = '';
                if (isImage) {
                    mediaPreview = `<img src="../${doc.chemin_fichier_officiel}" class="img-fluid rounded shadow-sm" style="max-height: 110px; width: auto; object-fit: contain;" alt="${doc.nom_document}" onerror="this.outerHTML='<i class=\\'bi bi-file-earmark-image portfolio-icon\\'></i>'">`;
                } else {
                    let iconClass = "bi-file-earmark-person";
                    let docName = doc.nom_document.toLowerCase();
                    if (docName.includes("permis")) iconClass = "bi-car-front";
                    if (docName.includes("passeport")) iconClass = "bi-passport";
                    mediaPreview = `<i class="bi ${iconClass} portfolio-icon"></i>`;
                }
                
                let card = document.createElement('div');
                card.className = 'col-md-6 col-lg-4';
                card.innerHTML = `
                    <div class="card portfolio-card h-100 p-4 border-0">
                        <span class="badge ${statusColor} status-badge">${doc.statut_document}</span>
                        <div class="text-center mb-4" style="height: 110px; display: flex; align-items: center; justify-content: center;">
                            ${mediaPreview}
                        </div>
                        <h4 class="h5 fw-bold text-center mb-3" style="color: var(--heading-color);">${doc.nom_document}</h4>
                        <div class="px-2">
                            <p class="mb-2 text-muted fw-bold small text-uppercase">N° de pièce</p>
                            <p class="mb-3 lead fw-semibold border-bottom pb-2">${doc.numero_piece_officielle}</p>
                            
                            <div class="d-flex justify-content-between text-muted small mt-3">
                                <div><i class="bi bi-calendar-check me-1"></i> Délivré: <strong>${dateDelivrance}</strong></div>
                            </div>
                            <div class="d-flex justify-content-between text-muted small mt-1">
                                <div><i class="bi bi-calendar-x me-1 text-danger"></i> Expire: <strong class="text-danger">${dateExpiration}</strong></div>
                            </div>
                        </div>
                        <div class="mt-4 text-center">
                            <a href="../${doc.chemin_fichier_officiel}" target="_blank" class="btn btn-outline-primary rounded-pill px-4 w-100">
                                <i class="bi bi-download me-2"></i>Télécharger le justificatif
                            </a>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        })
        .catch(error => console.error("Erreur Documents:", error));
}

// --- CHARGER L'HISTORIQUE DES DEMANDES ---
function chargerHistorique(cin) {
    const list = document.getElementById('historiqueList');
    if (!list) return;

    fetch(`../Controller/DemandeController.php?action=getByCin&cin=${cin}`)
        .then(response => response.json())
        .then(demandes => {
            list.innerHTML = '';
            
            if (demandes.length === 0) {
                list.innerHTML = `<div class="text-center py-5 text-muted">
                    <i class="bi bi-clock-history display-4 d-block mb-3"></i>
                    <p>Aucune demande trouvée dans l'historique.</p>
                </div>`;
                return;
            }

            demandes.forEach(demande => {
                let dateDemande = new Date(demande.date_demande).toLocaleDateString('fr-FR');
                let motifAffiche = (demande.statut_actuel === 'rejete' && demande.motif_rejet) ? `Motif: ${demande.motif_rejet}` : '';
                
                // Déterminer le statut
                let statusBadge = '';
                let statusIcon = '';
                switch (demande.statut_actuel.toLowerCase()) {
                    case 'accepte':
                    case 'accepté':
                    case 'valide':
                        statusBadge = '<span class="badge bg-success rounded-pill px-3 py-2"><i class="bi bi-check-circle me-1"></i> Accepté</span>';
                        statusIcon = '<i class="bi bi-check-circle-fill text-success fs-1"></i>';
                        break;
                    case 'rejete':
                    case 'rejeté':
                    case 'refuse':
                        statusBadge = '<span class="badge bg-danger rounded-pill px-3 py-2"><i class="bi bi-x-circle me-1"></i> Rejeté</span>';
                        statusIcon = '<i class="bi bi-x-circle-fill text-danger fs-1"></i>';
                        break;
                    default:
                        statusBadge = '<span class="badge bg-warning text-dark rounded-pill px-3 py-2"><i class="bi bi-hourglass-split me-1"></i> En attente</span>';
                        statusIcon = '<i class="bi bi-clock-fill text-warning fs-1"></i>';
                        break;
                }

                let natureClean = demande.nature_demande.replace(/_/g, ' ');

                let card = document.createElement('div');
                card.className = 'card history-card p-4 rounded-4 shadow-sm';
                card.innerHTML = `
                    <div class="row align-items-center">
                        <div class="col-auto">
                            ${statusIcon}
                        </div>
                        <div class="col">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h5 class="fw-bold mb-0" style="color: var(--heading-color);">${demande.nom_document}</h5>
                                <div>${statusBadge}</div>
                            </div>
                            <div class="d-flex flex-wrap gap-3 text-muted small">
                                <div><span class="fw-semibold">Réf:</span> #${demande.id_demande}</div>
                                <div><span class="fw-semibold">Nature:</span> <span class="text-capitalize">${natureClean}</span></div>
                                <div><i class="bi bi-calendar3"></i> ${dateDemande}</div>
                            </div>
                            ${motifAffiche ? `<div class="mt-3 text-danger small bg-danger bg-opacity-10 p-2 rounded"><i class="bi bi-exclamation-triangle"></i> ${motifAffiche}</div>` : ''}
                        </div>
                    </div>
                `;
                list.appendChild(card);
            });
        })
        .catch(error => console.error("Erreur Historique:", error));
}