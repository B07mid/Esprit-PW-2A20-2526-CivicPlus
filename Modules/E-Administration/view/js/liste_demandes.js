document.addEventListener("DOMContentLoaded", function() {
    chargerTableauDemandes();
});

function chargerTableauDemandes() {
    const tableBody = document.getElementById('demandesTableBody');
    if (!tableBody) return;

    fetch('../Controller/DemandeController.php?action=getAll')
        .then(response => response.json())
        .then(demandes => {
            tableBody.innerHTML = ''; 
            
            if (demandes.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="8" class="text-center">Aucune demande de document trouvée.</td></tr>`;
                return;
            }

            demandes.forEach(demande => {
                let tr = document.createElement('tr');
                
                // On stocke les valeurs pour la sauvegarde
                tr.dataset.id_demande = demande.id_demande;
                tr.dataset.statut_actuel = demande.statut_actuel;
                tr.dataset.motif_rejet = demande.motif_rejet || '';

                // Formatage visuel du statut
                let badgeClass = 'bg-secondary';
                let statutAffiche = demande.statut_actuel;
                if(demande.statut_actuel === 'en_attente') { badgeClass = 'bg-warning text-dark'; statutAffiche = 'En attente'; }
                if(demande.statut_actuel === 'approuve') { badgeClass = 'bg-success'; statutAffiche = 'Approuvée'; }
                if(demande.statut_actuel === 'rejete') { badgeClass = 'bg-danger'; statutAffiche = 'Rejetée'; }

                // Formatage de la date
                let dateObj = new Date(demande.date_demande);
                let dateFormatee = dateObj.toLocaleDateString('fr-FR') + ' ' + dateObj.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});

                tr.innerHTML = `
                    <td><strong>#${demande.id_demande}</strong></td>
                    <td>${demande.num_cin}</td>
                    <td>${demande.nom_document}</td>
                    <td class="text-capitalize">${demande.nature_demande.replace('_', ' ')}</td>
                    <td>${dateFormatee}</td>
                    <td ondblclick="editerStatut(this)" title="Double-cliquez pour changer le statut" style="cursor:pointer;">
                        <span class="badge ${badgeClass} fs-6">${statutAffiche}</span>
                    </td>
                    <td ondblclick="editerMotif(this)" title="Double-cliquez pour ajouter un motif" style="cursor:pointer;">
                        ${demande.motif_rejet || '<i class="text-muted">Aucun</i>'}
                    </td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="sauvegarderDemande(${demande.id_demande}, this)">Sauvegarder</button>
                        <button class="btn btn-sm btn-danger" onclick="supprimerDemande(${demande.id_demande})">Supprimer</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Erreur:', error);
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Erreur de connexion.</td></tr>`;
        });
}

// ---------------------------------------------------
// FONCTIONS D'ÉDITION (DOUBLE CLIC)
// ---------------------------------------------------

function editerStatut(td) {
    if (td.querySelector('select')) return; 
    let tr = td.closest('tr');
    let valStatut = tr.dataset.statut_actuel;
    
    td.innerHTML = `
        <select class="form-select form-select-sm" data-champ="statut_actuel">
            <option value="en_attente" ${valStatut === 'en_attente' ? 'selected' : ''}>En attente</option>
            <option value="approuve" ${valStatut === 'approuve' ? 'selected' : ''}>Approuvée</option>
            <option value="rejete" ${valStatut === 'rejete' ? 'selected' : ''}>Rejetée</option>
        </select>
    `;
}

function editerMotif(td) {
    if (td.querySelector('input')) return;
    let tr = td.closest('tr');
    let valMotif = tr.dataset.motif_rejet;
    
    td.innerHTML = `<input type="text" class="form-control form-control-sm" data-champ="motif_rejet" value="${valMotif}" placeholder="Raison du rejet...">`;
}

// ---------------------------------------------------
// FONCTION DE SAUVEGARDE ET SUPPRESSION
// ---------------------------------------------------

function sauvegarderDemande(id, btn) {
    let tr = btn.closest('tr');
    let formData = new FormData();
    
    formData.append('action', 'update');
    formData.append('id_demande', id);

    let selectStatut = tr.querySelector('[data-champ="statut_actuel"]');
    formData.append('statut_actuel', selectStatut ? selectStatut.value : tr.dataset.statut_actuel);

    let inputMotif = tr.querySelector('[data-champ="motif_rejet"]');
    formData.append('motif_rejet', inputMotif ? inputMotif.value : tr.dataset.motif_rejet);

    fetch('../Controller/DemandeController.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            chargerTableauDemandes(); 
        } else {
            alert("Erreur lors de la modification.");
        }
    })
    .catch(error => console.error("Erreur:", error));
}

function supprimerDemande(id) {
    if(confirm("Voulez-vous vraiment supprimer cette demande ?")) {
        fetch(`../Controller/DemandeController.php?action=delete&id=${id}`)
            .then(response => response.json())
            .then(data => {
                if(data.success) chargerTableauDemandes();
            });
    }
}