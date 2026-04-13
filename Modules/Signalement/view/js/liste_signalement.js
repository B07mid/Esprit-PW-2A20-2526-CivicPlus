document.addEventListener("DOMContentLoaded", function() {
    chargerSignalements();
});

function chargerSignalements() {
    const tableBody = document.getElementById('signalementsTableBody');
    if (!tableBody) return;

    fetch('../Controller/SignalementController.php?action=getAll')
        .then(response => response.json())
        .then(signalements => {
            tableBody.innerHTML = ''; 
            
            if (signalements.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7">Aucun signalement trouvé.</td></tr>`;
                return;
            }

            signalements.forEach(sig => {
                let tr = document.createElement('tr');
                
                // On stocke les valeurs réelles pour la sauvegarde
                tr.dataset.id_signalement = sig.id_signalement;
                tr.dataset.statut = sig.statut;
                tr.dataset.niveau_priorite = sig.niveau_priorite || 'Normale';

                // Formatage simple de la date
                let dateObj = new Date(sig.date_signalement);
                let dateFormatee = dateObj.toLocaleDateString('fr-FR');

                tr.innerHTML = `
                    <td>#${sig.id_signalement}</td>
                    <td>${sig.num_cin}</td>
                    <td>${sig.titre}</td>
                    <td>${dateFormatee}</td>
                    <td ondblclick="editerStatut(this)" title="Double-cliquer pour modifier">
                        ${sig.statut}
                    </td>
                    <td ondblclick="editerPriorite(this)" title="Double-cliquer pour modifier">
                        ${sig.niveau_priorite || 'Normale'}
                    </td>
                    <td>
                        <button onclick="sauvegarderSignalement(${sig.id_signalement}, this)">Sauvegarder</button>
                        <button onclick="supprimerSignalement(${sig.id_signalement})">Supprimer</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Erreur:', error);
            tableBody.innerHTML = `<tr><td colspan="7">Erreur de chargement.</td></tr>`;
        });
}

// ---------------------------------------------------
// ÉDITION EN LIGNE (DOUBLE CLIC)
// ---------------------------------------------------

function editerStatut(td) {
    if (td.querySelector('select')) return; 
    let tr = td.closest('tr');
    let valStatut = tr.dataset.statut;
    
    td.innerHTML = `
        <select data-champ="statut">
            <option value="ouvert" ${valStatut === 'ouvert' ? 'selected' : ''}>Ouvert</option>
            <option value="en_cours" ${valStatut === 'en_cours' ? 'selected' : ''}>En cours</option>
            <option value="resolu" ${valStatut === 'resolu' ? 'selected' : ''}>Résolu</option>
        </select>
    `;
}

function editerPriorite(td) {
    if (td.querySelector('select')) return;
    let tr = td.closest('tr');
    let valPriorite = tr.dataset.niveau_priorite;
    
    td.innerHTML = `
        <select data-champ="niveau_priorite">
            <option value="Faible" ${valPriorite === 'Faible' ? 'selected' : ''}>Faible</option>
            <option value="Normale" ${valPriorite === 'Normale' ? 'selected' : ''}>Normale</option>
            <option value="Urgente" ${valPriorite === 'Urgente' ? 'selected' : ''}>Urgente</option>
        </select>
    `;
}

// ---------------------------------------------------
// SAUVEGARDE ET SUPPRESSION
// ---------------------------------------------------

function sauvegarderSignalement(id, btn) {
    let tr = btn.closest('tr');
    let formData = new FormData();
    
    formData.append('action', 'update');
    formData.append('id_signalement', id);

    let selectStatut = tr.querySelector('[data-champ="statut"]');
    formData.append('statut', selectStatut ? selectStatut.value : tr.dataset.statut);

    let selectPriorite = tr.querySelector('[data-champ="niveau_priorite"]');
    formData.append('niveau_priorite', selectPriorite ? selectPriorite.value : tr.dataset.niveau_priorite);

    fetch('../Controller/SignalementController.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            alert("Signalement mis à jour !");
            chargerSignalements(); 
        } else {
            alert("Erreur lors de la mise à jour.");
        }
    })
    .catch(error => console.error("Erreur:", error));
}

function supprimerSignalement(id) {
    if(confirm("Voulez-vous vraiment supprimer ce signalement ?")) {
        fetch(`../Controller/SignalementController.php?action=delete&id=${id}`)
            .then(response => response.json())
            .then(data => {
                if(data.success) chargerSignalements();
            });
    }
}