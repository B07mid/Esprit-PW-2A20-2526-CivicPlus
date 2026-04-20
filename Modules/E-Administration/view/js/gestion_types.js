document.addEventListener("DOMContentLoaded", function() {
    chargerTypes();

    // Gérer l'ajout sans recharger la page
    const formAjout = document.getElementById("formAjoutType");
    if(formAjout) {
        formAjout.addEventListener("submit", function(e) {
            e.preventDefault(); // On bloque l'envoi classique
            
            let formData = new FormData(this);
            
            fetch('../Controller/TypeDocumentController.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if(data.success) {
                    chargerTypes(); // On rafraîchit la table à droite
                    formAjout.reset(); // On vide le formulaire à gauche
                } else {
                    alert("Erreur lors de l'ajout.");
                }
            })
            .catch(error => console.error("Erreur:", error));
        });
    }
});

// Charger la table
function chargerTypes() {
    const tableBody = document.getElementById('typesTableBody');
    if (!tableBody) return;

    fetch('../Controller/TypeDocumentController.php?action=getAll')
        .then(response => response.json())
        .then(types => {
            tableBody.innerHTML = '';
            
            if (types.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="4" class="text-center">Aucun type de document configuré.</td></tr>`;
                return;
            }

            types.forEach(type => {
                let tr = document.createElement('tr');
                
                // On stocke les valeurs pour l'édition en ligne
                tr.dataset.id_type = type.id_type;
                tr.dataset.libelle = type.libelle;
                tr.dataset.duree = type.duree_validite_mois || '';

                tr.innerHTML = `
                    <td>${type.id_type}</td>
                    <td ondblclick="editerTexte(this, 'libelle')" title="Double-cliquer pour modifier"><strong>${type.libelle}</strong></td>
                    <td ondblclick="editerNombre(this, 'duree')" title="Double-cliquer pour modifier">${type.duree_validite_mois ? type.duree_validite_mois + ' mois' : '-'}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-success me-1" onclick="sauvegarderType(${type.id_type}, this)">Sauvegarder</button>
                        <button class="btn btn-sm btn-danger" onclick="supprimerType(${type.id_type})">Supprimer</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        })
        .catch(error => console.error('Erreur:', error));
}

// --- ÉDITION EN LIGNE (DOUBLE CLIC) ---

function editerTexte(td, champ) {
    if (td.querySelector('input')) return;
    let val = td.closest('tr').dataset[champ];
    td.innerHTML = `<input type="text" class="form-control form-control-sm" data-champ="${champ}" value="${val}">`;
}

function editerNombre(td, champ) {
    if (td.querySelector('input')) return;
    let val = td.closest('tr').dataset[champ];
    td.innerHTML = `<input type="number" class="form-control form-control-sm" data-champ="${champ}" value="${val}" placeholder="Mois">`;
}

// --- SAUVEGARDER ET SUPPRIMER ---

function sauvegarderType(id, btn) {
    let tr = btn.closest('tr');
    let formData = new FormData();
    
    formData.append('action', 'update');
    formData.append('id_type', id);

    let inputLibelle = tr.querySelector('[data-champ="libelle"]');
    formData.append('libelle', inputLibelle ? inputLibelle.value : tr.dataset.libelle);

    let inputDuree = tr.querySelector('[data-champ="duree"]');
    formData.append('duree_validite_mois', inputDuree ? inputDuree.value : tr.dataset.duree);

    fetch('../Controller/TypeDocumentController.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            chargerTypes(); // Recharge pour afficher le texte normal
        } else {
            alert("Erreur de sauvegarde.");
        }
    })
    .catch(error => console.error("Erreur:", error));
}

function supprimerType(id) {
    if(confirm("Attention : Supprimer ce type risque d'échouer si des demandes citoyennes y sont déjà liées. Continuer ?")) {
        fetch(`../Controller/TypeDocumentController.php?action=delete&id=${id}`)
            .then(response => response.json())
            .then(data => {
                if(data.success) {
                    chargerTypes();
                } else {
                    alert("Impossible de supprimer ce type (il est probablement utilisé par des demandes existantes).");
                }
            });
    }
}