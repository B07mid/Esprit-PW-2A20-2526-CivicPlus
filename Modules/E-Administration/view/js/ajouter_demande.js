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

    // --- Validation Dynamique ---
    const form = document.querySelector('form');
    const cinInput = document.getElementById('num_cin');
    const natureInput = document.getElementById('nature_demande');
    const fileInput = document.getElementById('chemin_scan_identite');
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

    function checkFormValidity() {
        if(!form || !submitBtn) return;
        let isValid = true;

        if (!/^[0-9]{8}$/.test(cinInput.value)) {
            cinInput.classList.add("is-invalid"); cinInput.classList.remove("is-valid");
            isValid = false;
        } else {
            cinInput.classList.remove("is-invalid"); cinInput.classList.add("is-valid");
        }

        if (!selectType.value) {
            selectType.classList.add("is-invalid"); selectType.classList.remove("is-valid");
            isValid = false;
        } else {
            selectType.classList.remove("is-invalid"); selectType.classList.add("is-valid");
        }

        if (!natureInput.value) {
            natureInput.classList.add("is-invalid"); natureInput.classList.remove("is-valid");
            isValid = false;
        } else {
            natureInput.classList.remove("is-invalid"); natureInput.classList.add("is-valid");
        }

        if (!fileInput.value) {
            fileInput.classList.add("is-invalid"); fileInput.classList.remove("is-valid");
            isValid = false;
        } else {
            fileInput.classList.remove("is-invalid"); fileInput.classList.add("is-valid");
        }

        submitBtn.disabled = !isValid;
        submitBtn.style.opacity = isValid ? "1" : "0.5";
    }

    if(form && submitBtn) {
        [cinInput, selectType, natureInput, fileInput].forEach(el => {
            el.addEventListener("input", checkFormValidity);
            el.addEventListener("change", checkFormValidity);
        });
        form.addEventListener('submit', function(e) {
            checkFormValidity();
            if (submitBtn.disabled) e.preventDefault();
        });
    }
});