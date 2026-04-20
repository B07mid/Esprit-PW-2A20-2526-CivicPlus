document.addEventListener("DOMContentLoaded", function() {
    const selectType = document.getElementById('id_type');

    if (selectType) {
        fetch('../Controller/GetTypeDocs.php')
            .then(response => response.json())
            .then(data => {
                selectType.innerHTML = '<option value="" disabled selected>-- Choisir un type --</option>';
                
                data.forEach(type => {
                    let option = document.createElement('option');
                    option.value = type.id_type;
                    option.textContent = type.libelle;
                    selectType.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Erreur:', error);
                selectType.innerHTML = '<option value="">Erreur de chargement</option>';
            });
    }
});
