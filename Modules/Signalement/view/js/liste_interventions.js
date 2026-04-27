document.addEventListener("DOMContentLoaded", function () {
    console.log("Initialisation de la liste des interventions...");
    chargerInterventions();
});

function chargerInterventions() {
    const tableBody = document.getElementById('interventionsTableBody');
    if (!tableBody) return;

    fetch('../controller/InterventionController.php?action=getAll')
        .then(response => response.text())
        .then(text => {
            console.log("Données reçues:", text);
            try {
                const interventions = JSON.parse(text);
                tableBody.innerHTML = '';

                if (interventions.length === 0) {
                    tableBody.innerHTML = `<tr><td colspan="7" class="text-center p-3">Aucune intervention planifiée.</td></tr>`;
                    return;
                }

                interventions.forEach(inter => {
                    let tr = document.createElement('tr');
                    let dateFormatee = inter.date_planification ? new Date(inter.date_planification).toLocaleDateString('fr-FR') : "---";
                    let statut = inter.statut_intervention || "En attente";

                    tr.innerHTML = `
                        <td>#${inter.id_intervention}</td>
                        <td>
                            <strong>${inter.titre_signalement || 'Sans titre'}</strong><br>
                            <small class="text-muted">Signalement #${inter.id_signalement}</small>
                        </td>
                        <td>${inter.equipe_responsable || '---'}</td>
                        <td>${inter.type_intervention || '---'}</td>
                        <td>${dateFormatee}</td>
                        <td>${statut}</td>
                        <td>
                            <a href="javascript:void(0)" class="text-dark me-3" onclick="ouvrirModification(${inter.id_signalement})" style="text-decoration:underline;">
                                Modifier
                            </a>
                            <a href="javascript:void(0)" class="text-dark" onclick="supprimerIntervention(${inter.id_intervention})" style="text-decoration:underline;">
                                Supprimer
                            </a>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            } catch (e) {
                console.error("Erreur parsing:", e);
                tableBody.innerHTML = `<tr><td colspan="7" class="text-danger">Erreur de données: ${text}</td></tr>`;
            }
        });
}

function ouvrirModification(id_sig) {
    console.log("Ouverture modification pour signalement:", id_sig);
    const modalEl = document.getElementById('interventionModal');
    if (!modalEl) return;

    // Réinitialiser et afficher le modal immédiatement
    document.getElementById('formIntervention').reset();
    document.getElementById('inter_id_signalement').value = id_sig;
    
    let myModal = new bootstrap.Modal(modalEl);
    myModal.show();
    
    // Charger les données en arrière-plan
    fetch(`../controller/InterventionController.php?action=get&id_signalement=${id_sig}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('inter_type').value = data.data.type || "";
                document.getElementById('inter_equipe').value = data.data.equipe || "";
                document.getElementById('inter_date').value = data.data.date || "";
                document.getElementById('inter_statut').value = data.data.statut || "en_attente";
                document.getElementById('inter_comm').value = data.data.comm || "";
            }
        })
        .catch(err => {
            console.error("Erreur chargement données:", err);
        });
}

function supprimerIntervention(id) {
    if (confirm("Confirmez-vous la suppression de cette intervention ?")) {
        fetch(`../controller/InterventionController.php?action=delete&id=${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    chargerInterventions();
                } else {
                    alert("Erreur lors de la suppression.");
                }
            });
    }
}

// Gestion de la sauvegarde
document.getElementById('formIntervention')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // --- CONTRÔLE DE SAISIE LOGIQUE ---
    const datePlanif = new Date(document.getElementById('inter_date').value);
    const aujourdhui = new Date();
    aujourdhui.setHours(0,0,0,0); // On ne garde que la date, pas l'heure
    
    const statut = document.getElementById('inter_statut').value;
    const commentaires = document.getElementById('inter_comm').value.trim();

    // 1. Vérifier la date (ne pas planifier dans le passé)
    if (datePlanif < aujourdhui) {
        alert("⚠️ Logique : Vous ne pouvez pas planifier une intervention à une date passée.");
        return;
    }

    // 2. Vérifier les commentaires si terminé
    if (statut === 'termine' && commentaires.length < 5) {
        alert("⚠️ Logique : Pour marquer une intervention comme 'Terminée', vous devez rédiger un court compte-rendu dans les commentaires techniques.");
        return;
    }

    // --- FIN DES CONTRÔLES ---

    const formData = new FormData(this);
    formData.append('action', 'update');

    fetch('../controller/InterventionController.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Fermer le modal
            const modalEl = document.getElementById('interventionModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
            
            chargerInterventions();
            
            // MÉTIER : Alerte de charge
            if (data.charge_alerte) {
                alert("✅ Succès !\n" + data.charge_alerte);
            } else {
                alert("✅ Modification enregistrée avec succès !");
            }
        } else {
            // MÉTIER : Affichage de l'erreur de verrouillage (Workflow Lock)
            alert("❌ Action refusée : " + (data.error || "Une erreur est survenue."));
        }
    });
});
