document.addEventListener("DOMContentLoaded", function() {
    const poiForm = document.getElementById('poiForm');
    
    // Éléments du DOM pour la catégorie
    const selectCategorie = document.getElementById('categorie_service');

    // On appelle notre fichier PHP
    fetch('../Controller/GetCategoriesController.php')
        .then(response => response.json()) // On convertit la réponse en JSON
        .then(categories => {
            // Pour chaque catégorie reçue de la base de données
            categories.forEach(cat => {
                // On crée une nouvelle balise <option>
                let nouvelleOption = document.createElement('option');
                nouvelleOption.value = cat;
                // On met la première lettre en majuscule pour l'affichage
                nouvelleOption.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
                
                // On l'insère juste avant la dernière option (qui est "Autre...")
                selectCategorie.insertBefore(nouvelleOption, selectCategorie.lastElementChild);
            });
        })
        .catch(error => console.error('Erreur lors du chargement des catégories:', error));
    const inputNouvelleCategorie = document.getElementById('nouvelle_categorie');
    const erreurCategorie = document.getElementById('erreurCategorie');

    // Éléments du DOM pour les horaires
    const heureOuverture = document.getElementById('heure_ouverture');
    const heureFermeture = document.getElementById('heure_fermeture');
    const erreurHoraires = document.getElementById('erreurHoraires');

    // 1. Écouteur d'événement pour afficher/masquer le champ personnalisé
    selectCategorie.addEventListener('change', function() {
        if (this.value === 'autre') {
            // Afficher le champ et le rendre obligatoire
            inputNouvelleCategorie.style.display = 'block';
            inputNouvelleCategorie.setAttribute('required', 'true');
        } else {
            // Cacher le champ, le rendre facultatif et vider son contenu
            inputNouvelleCategorie.style.display = 'none';
            inputNouvelleCategorie.removeAttribute('required');
            inputNouvelleCategorie.value = ''; 
        }
    });

    // 2. Contrôle de saisie global à la soumission du formulaire
    poiForm.addEventListener('submit', function(event) {
        let isValid = true;

        // Validation de la nouvelle catégorie
        if (selectCategorie.value === 'autre' && inputNouvelleCategorie.value.trim() === '') {
            erreurCategorie.style.display = 'block';
            inputNouvelleCategorie.classList.add('is-invalid');
            isValid = false;
        } else {
            erreurCategorie.style.display = 'none';
            inputNouvelleCategorie.classList.remove('is-invalid');
        }

        // Validation de la cohérence des horaires
        if (heureOuverture.value && heureFermeture.value) {
            // L'heure d'ouverture doit être strictement inférieure à l'heure de fermeture
            if (heureOuverture.value >= heureFermeture.value) {
                erreurHoraires.innerText = "L'heure de fermeture doit être après l'heure d'ouverture.";
                erreurHoraires.style.display = 'block';
                heureOuverture.classList.add('is-invalid');
                heureFermeture.classList.add('is-invalid');
                isValid = false;
            } else {
                erreurHoraires.style.display = 'none';
                heureOuverture.classList.remove('is-invalid');
                heureFermeture.classList.remove('is-invalid');
            }
        } else if ((heureOuverture.value && !heureFermeture.value) || (!heureOuverture.value && heureFermeture.value)) {
            // Forcer l'utilisateur à remplir les deux heures ou aucune des deux
            erreurHoraires.innerText = "Veuillez remplir les deux champs d'horaires ou les laisser vides.";
            erreurHoraires.style.display = 'block';
            isValid = false;
        }

        // Bloquer l'envoi vers le contrôleur PHP si une erreur est détectée
        if (!isValid) {
            event.preventDefault(); 
        }
    });
});