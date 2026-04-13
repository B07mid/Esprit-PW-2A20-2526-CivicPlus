document.addEventListener("DOMContentLoaded", function() {
    // 1. On récupère l'élément du menu déroulant
    const selectType = document.getElementById('id_type');

    // On vérifie que l'élément existe bien avant de continuer
    if (selectType) {
        fetch('../Controller/GetTypeDocs.php')
            .then(response => response.json())
            .then(data => {
                selectType.innerHTML = '<option value="" disabled selected>-- Choisir un type --</option>';
                
                data.forEach(type => {
                    let option = document.createElement('option');
                    option.value = type.id_type; // L'ID pour la base de données
                    option.textContent = type.libelle; // Le nom affiché (selon ton fichier SQL)
                    selectType.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Erreur:', error);
                selectType.innerHTML = '<option value="">Erreur de chargement</option>';
            });
    }
});