document.addEventListener("DOMContentLoaded", function() {
    // Au chargement de la page, on appelle la fonction qui remplit le tableau
    chargerTableau();
});

// On met le chargement dans une fonction pour pouvoir rafraîchir facilement après une modif
function chargerTableau() {
    const tableBody = document.getElementById('poiTableBody');
    if (!tableBody) return;

    fetch('../Controller/PoiController.php?action=getAll')
        .then(response => response.json())
        .then(pois => {
            tableBody.innerHTML = ''; // On vide le tableau avant de le remplir
            
            if (pois.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Aucun Point d'Intérêt n'a été trouvé.</td></tr>`;
                return;
            }

            pois.forEach(poi => {
                let tr = document.createElement('tr');
                
                // On stocke les vraies valeurs dans des data-attributs cachés pour la sauvegarde
                tr.dataset.latitude = poi.latitude;
                tr.dataset.longitude = poi.longitude;
                tr.dataset.nom_poi = poi.nom_poi;
                tr.dataset.categorie_service = poi.categorie_service;
                tr.dataset.adresse_postale = poi.adresse_postale || '';
                tr.dataset.horaires_ouverture = poi.horaires_ouverture || '';
                tr.dataset.contact_tel = poi.contact_tel || '';
                tr.dataset.accessible_pmr = poi.accessible_pmr;

                let pmrAffiche = poi.accessible_pmr == 1 ? '<span class="badge bg-success">Oui</span>' : '<span class="badge bg-secondary">Non</span>';
                
                // On ajoute ondblclick sur chaque <td> pour permettre l'édition en ligne
                tr.innerHTML = `
                    <td ondblclick="editerTexte(this, 'nom_poi')" title="Double-cliquez pour modifier"><strong>${poi.nom_poi}</strong></td>
                    <td ondblclick="editerTexte(this, 'categorie_service')" class="text-capitalize" title="Double-cliquez pour modifier">${poi.categorie_service}</td>
                    <td ondblclick="editerTexte(this, 'adresse_postale')" title="Double-cliquez pour modifier">${poi.adresse_postale || '-'}</td>
                    <td ondblclick="editerTexte(this, 'horaires_ouverture')" title="Double-cliquez pour modifier">${poi.horaires_ouverture || '-'}</td>
                    <td ondblclick="editerTexte(this, 'contact_tel')" title="Double-cliquez pour modifier">${poi.contact_tel || '-'}</td>
                    <td ondblclick="editerPMR(this)" title="Double-cliquez pour modifier">${pmrAffiche}</td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="sauvegarderModification(${poi.id_poi}, this)">Sauvegarder</button>
                        <button class="btn btn-sm btn-danger" onclick="supprimerPoi(${poi.id_poi})">Supprimer</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des POI:', error);
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Erreur de connexion à la base de données.</td></tr>`;
        });
}

// ---------------------------------------------------
// FONCTIONS POUR L'ÉDITION EN LIGNE (DOUBLE CLIC)
// ---------------------------------------------------

// Transforme une cellule texte en champ <input>
function editerTexte(td, champ) {
    if (td.querySelector('input')) return; // Si c'est déjà un input, on ne fait rien
    
    let tr = td.closest('tr');
    let valeurActuelle = tr.dataset[champ]; // On récupère la vraie valeur sans le formatage HTML
    
    td.innerHTML = `<input type="text" class="form-control form-control-sm" data-champ="${champ}" value="${valeurActuelle}">`;
}

// Transforme la cellule PMR en menu déroulant (Oui/Non)
function editerPMR(td) {
    if (td.querySelector('select')) return;
    
    let tr = td.closest('tr');
    let valPMR = tr.dataset.accessible_pmr;
    
    td.innerHTML = `
        <select class="form-select form-select-sm" data-champ="accessible_pmr">
            <option value="1" ${valPMR == 1 ? 'selected' : ''}>Oui</option>
            <option value="0" ${valPMR == 0 ? 'selected' : ''}>Non</option>
        </select>
    `;
}

// ---------------------------------------------------
// FONCTION POUR SAUVEGARDER (LE BOUTON SAUVEGARDER)
// ---------------------------------------------------
function sauvegarderModification(id, btn) {
    let tr = btn.closest('tr');
    let formData = new FormData();
    
    // On précise au PHP qu'on veut faire un UPDATE
    formData.append('action', 'update');
    formData.append('id_poi', id);
    formData.append('latitude', tr.dataset.latitude);
    formData.append('longitude', tr.dataset.longitude);

    // Liste des champs modifiables
    const champs = ['nom_poi', 'categorie_service', 'adresse_postale', 'horaires_ouverture', 'contact_tel', 'accessible_pmr'];

    // Pour chaque champ, on regarde s'il y a un input actif. Sinon, on prend l'ancienne valeur stockée.
    champs.forEach(champ => {
        let inputActif = tr.querySelector(`[data-champ="${champ}"]`);
        if (inputActif) {
            formData.append(champ, inputActif.value);
        } else {
            formData.append(champ, tr.dataset[champ]);
        }
    });

    // Envoi au PHP en arrière-plan
    fetch('../Controller/PoiController.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            alert("Modification enregistrée avec succès !");
            chargerTableau(); // On recharge le tableau pour effacer les inputs et afficher le texte propre
        } else {
            alert("Erreur lors de la modification.");
        }
    })
    .catch(error => console.error("Erreur de sauvegarde:", error));
}

// ---------------------------------------------------
// FONCTION POUR SUPPRIMER
// ---------------------------------------------------
function supprimerPoi(id) {
    if(confirm("Êtes-vous sûr de vouloir supprimer ce Point d'Intérêt définitivement ?")) {
        fetch(`../Controller/PoiController.php?action=delete&id=${id}`)
            .then(response => response.json())
            .then(data => {
                if(data.success) {
                    alert("Le Point d'Intérêt a été supprimé !");
                    chargerTableau(); // Plus besoin de recharger toute la page, juste le tableau !
                } else {
                    alert("Erreur : Impossible de supprimer ce POI.");
                }
            })
            .catch(error => {
                console.error("Erreur lors de la suppression:", error);
                alert("Une erreur de communication est survenue.");
            });
    }
}