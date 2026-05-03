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

    // --- Validation Dynamique ---
    const form = document.querySelector('form');
    const cinInput = document.getElementById('num_cin');
    const pieceInput = document.getElementById('numero_piece_officielle');
    const fileInput = document.getElementById('chemin_fichier_officiel');
    const delivInput = document.getElementById('date_delivrance');
    const expInput = document.getElementById('date_expiration');
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

        if (pieceInput.value.trim() === "") {
            pieceInput.classList.add("is-invalid"); pieceInput.classList.remove("is-valid");
            isValid = false;
        } else {
            pieceInput.classList.remove("is-invalid"); pieceInput.classList.add("is-valid");
        }

        if (!fileInput.value) {
            fileInput.classList.add("is-invalid"); fileInput.classList.remove("is-valid");
            isValid = false;
        } else {
            fileInput.classList.remove("is-invalid"); fileInput.classList.add("is-valid");
        }

        if (!delivInput.value) {
            delivInput.classList.add("is-invalid"); delivInput.classList.remove("is-valid");
            isValid = false;
        } else {
            delivInput.classList.remove("is-invalid"); delivInput.classList.add("is-valid");
        }

        if (!expInput.value || expInput.value <= delivInput.value) {
            expInput.classList.add("is-invalid"); expInput.classList.remove("is-valid");
            isValid = false;
        } else {
            expInput.classList.remove("is-invalid"); expInput.classList.add("is-valid");
        }

        submitBtn.disabled = !isValid;
        submitBtn.style.opacity = isValid ? "1" : "0.5";
    }

    if(form && submitBtn) {
        [cinInput, selectType, pieceInput, fileInput, delivInput, expInput].forEach(el => {
            el.addEventListener("input", checkFormValidity);
            el.addEventListener("change", checkFormValidity);
        });
        
        form.addEventListener('submit', function(e) {
            checkFormValidity();
            if (submitBtn.disabled) e.preventDefault();
        });
    }
});
