document.addEventListener("DOMContentLoaded", function() {

    // Gestion de l'affichage du nom du fichier sélectionné
    const fileInput = document.getElementById("photo_incident");
    const fileNameDisplay = document.getElementById("fileName");

    fileInput.addEventListener("change", function() {
        if (this.files && this.files[0]) {
            fileNameDisplay.innerText = "Fichier sélectionné : " + this.files[0].name;
        } else {
            fileNameDisplay.innerText = "";
        }
    });

    // Validation du formulaire avant l'envoi
    const form = document.getElementById("formSignalement");

    form.addEventListener("submit", function(event) {
        
        let cin = document.getElementById("cin").value;
        let titre = document.getElementById("titre").value.trim();
        let description = document.getElementById("description").value.trim();
        let file = fileInput.files[0];

        // 1. Validation du CIN (exactement 8 chiffres)
        if (!/^[0-9]{8}$/.test(cin)) {
            alert("❌ Le numéro CIN est invalide. Il doit contenir exactement 8 chiffres.");
            event.preventDefault(); // Bloque l'envoi
            return;
        }

        // 2. Validation du Titre et de la Description
        if (titre.length < 5) {
            alert("❌ Le titre de l'incident est trop court.");
            event.preventDefault();
            return;
        }

        if (description.length < 10) {
            alert("❌ Veuillez fournir une description un peu plus détaillée (minimum 10 caractères).");
            event.preventDefault();
            return;
        }

        // 3. Validation de la photo (Optionnelle mais recommandée, on limite le poids)
        if (file) {
            // Limite de taille à 5 Mo (5 * 1024 * 1024 octets)
            if (file.size > 5 * 1024 * 1024) {
                alert("❌ La photo est trop lourde (maximum 5 Mo).");
                event.preventDefault();
                return;
            }

            // Vérification du type de fichier
            let allowedTypes = ["image/jpeg", "image/png"];
            if (!allowedTypes.includes(file.type)) {
                alert("❌ Format de photo non valide. Veuillez utiliser du JPG ou du PNG.");
                event.preventDefault();
                return;
            }
        }
    });
});