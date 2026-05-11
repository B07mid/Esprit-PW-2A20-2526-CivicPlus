<<<<<<< Updated upstream
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
=======
const poiState = {
    items: [],
    query: '',
    category: 'all'
};

document.addEventListener('DOMContentLoaded', function () {
    bindPoiEvents();
    chargerTableau();
});

function bindPoiEvents() {
    document.getElementById('poiSearch')?.addEventListener('input', event => {
        poiState.query = event.target.value.trim();
        renderPois();
    });

    document.getElementById('poiCategoryFilter')?.addEventListener('change', event => {
        poiState.category = event.target.value;
        renderPois();
    });

    document.getElementById('poiClearFilters')?.addEventListener('click', () => {
        poiState.query = '';
        poiState.category = 'all';
        const search = document.getElementById('poiSearch');
        const filter = document.getElementById('poiCategoryFilter');
        if (search) search.value = '';
        if (filter) filter.value = 'all';
        renderPois();
    });
}

function chargerTableau() {
    fetch('../Controller/PoiController.php?action=getAll', { cache: 'no-store' })
        .then(response => response.json())
        .then(pois => {
            poiState.items = Array.isArray(pois) ? pois : [];
            populateCategories();
            updatePoiStats();
            renderPois();
        })
        .catch(error => {
            console.error('Erreur lors du chargement des POI:', error);
            setPoiTableMessage('Erreur de connexion a la base de donnees.', 'danger');
        });
}

function populateCategories() {
    const select = document.getElementById('poiCategoryFilter');
    if (!select) return;

    const categories = Array.from(new Set(poiState.items.map(poi => poi.categorie_service || 'Autre'))).sort();
    select.innerHTML = '<option value="all">Toutes les categories</option>' + categories
        .map(category => `<option value="${escAttr(category)}">${escHtml(category)}</option>`)
        .join('');
    select.value = poiState.category;
}

function updatePoiStats() {
    const categories = new Set(poiState.items.map(poi => poi.categorie_service || 'Autre'));
    const pmr = poiState.items.filter(poi => Number(poi.accessible_pmr) === 1).length;
    const noPhone = poiState.items.filter(poi => !String(poi.contact_tel || '').trim()).length;

    setText('statPoiTotal', poiState.items.length);
    setText('statPoiCategories', categories.size);
    setText('statPoiPmr', pmr);
    setText('statPoiNoPhone', noPhone);
}

function renderPois() {
    const rows = filteredPois();
    const tableBody = document.getElementById('poiTableBody');
    if (!tableBody) return;

    if (!rows.length) {
        setPoiTableMessage('Aucun point d interet ne correspond aux filtres.', 'muted');
        return;
    }

    tableBody.innerHTML = rows.map(poiRowHtml).join('');
}

function filteredPois() {
    const query = normalizeText(poiState.query);
    return poiState.items.filter(poi => {
        const category = poi.categorie_service || 'Autre';
        const haystack = normalizeText([
            poi.nom_poi,
            category,
            poi.adresse_postale,
            poi.contact_tel,
            poi.horaires_ouverture
        ].join(' '));

        if (poiState.category !== 'all' && category !== poiState.category) return false;
        if (query && !haystack.includes(query)) return false;
        return true;
    });
}

function poiRowHtml(poi) {
    const id = Number(poi.id_poi) || 0;
    const lat = poi.latitude || '';
    const lng = poi.longitude || '';
    const mapUrl = lat && lng ? `https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lng)}` : '';
    const pmr = Number(poi.accessible_pmr) === 1;

    return `
        <tr data-id="${id}"
            data-latitude="${escAttr(lat)}"
            data-longitude="${escAttr(lng)}"
            data-nom_poi="${escAttr(poi.nom_poi || '')}"
            data-categorie_service="${escAttr(poi.categorie_service || '')}"
            data-adresse_postale="${escAttr(poi.adresse_postale || '')}"
            data-horaires_ouverture="${escAttr(poi.horaires_ouverture || '')}"
            data-contact_tel="${escAttr(poi.contact_tel || '')}"
            data-accessible_pmr="${pmr ? '1' : '0'}">
            <td ondblclick="editerTexte(this, 'nom_poi')" title="Double-cliquer pour modifier">
                <div class="fw-bold">${escHtml(poi.nom_poi || 'Sans nom')}</div>
                <div class="small text-muted">#${id}</div>
            </td>
            <td ondblclick="editerTexte(this, 'categorie_service')" title="Double-cliquer pour modifier">
                <span class="badge bg-light text-dark border text-capitalize">${escHtml(poi.categorie_service || 'Autre')}</span>
            </td>
            <td ondblclick="editerTexte(this, 'adresse_postale')" title="Double-cliquer pour modifier">${escHtml(poi.adresse_postale || '--')}</td>
            <td ondblclick="editerTexte(this, 'horaires_ouverture')" title="Double-cliquer pour modifier">${escHtml(poi.horaires_ouverture || '--')}</td>
            <td ondblclick="editerTexte(this, 'contact_tel')" title="Double-cliquer pour modifier">${escHtml(poi.contact_tel || '--')}</td>
            <td ondblclick="editerPMR(this)" title="Double-cliquer pour modifier">${pmr ? '<span class="badge bg-success">Oui</span>' : '<span class="badge bg-secondary">Non</span>'}</td>
            <td>${mapUrl ? `<a class="btn btn-sm btn-outline-primary" href="${escAttr(mapUrl)}" target="_blank" rel="noopener"><i class="bi bi-geo-alt"></i></a>` : '<span class="text-muted">--</span>'}</td>
            <td>
                <div class="d-flex flex-wrap gap-2">
                    <button class="btn btn-sm btn-outline-primary" onclick="sauvegarderModification(${id}, this)" title="Sauvegarder"><i class="bi bi-save"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="supprimerPoi(${id})" title="Supprimer"><i class="bi bi-trash"></i></button>
                </div>
            </td>
        </tr>`;
}

function editerTexte(td, champ) {
    if (td.querySelector('input')) return;
    const tr = td.closest('tr');
    const valeurActuelle = tr.dataset[champ] || '';
    td.innerHTML = `<input type="text" class="form-control form-control-sm" data-champ="${champ}" value="${escAttr(valeurActuelle)}">`;
}

function editerPMR(td) {
    if (td.querySelector('select')) return;
    const tr = td.closest('tr');
    const valPMR = tr.dataset.accessible_pmr;
    td.innerHTML = `
        <select class="form-select form-select-sm" data-champ="accessible_pmr">
            <option value="1" ${valPMR === '1' ? 'selected' : ''}>Oui</option>
            <option value="0" ${valPMR === '0' ? 'selected' : ''}>Non</option>
        </select>`;
}

function sauvegarderModification(id, btn) {
    const tr = btn.closest('tr');
    const formData = new FormData();
>>>>>>> Stashed changes
    formData.append('action', 'update');
    formData.append('id_poi', id);
    formData.append('latitude', tr.dataset.latitude);
    formData.append('longitude', tr.dataset.longitude);

<<<<<<< Updated upstream
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
=======
    ['nom_poi', 'categorie_service', 'adresse_postale', 'horaires_ouverture', 'contact_tel', 'accessible_pmr'].forEach(champ => {
        const inputActif = tr.querySelector(`[data-champ="${champ}"]`);
        formData.append(champ, inputActif ? inputActif.value : tr.dataset[champ]);
    });

    fetch('../Controller/PoiController.php', { method: 'POST', body: formData })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showPoiFlash('Modification enregistree.', 'success');
                chargerTableau();
            } else {
                showPoiFlash('Erreur lors de la modification.', 'danger');
            }
        })
        .catch(() => showPoiFlash('Erreur de sauvegarde.', 'danger'));
}

function supprimerPoi(id) {
    if (!confirm('Voulez-vous vraiment supprimer ce point d interet ?')) return;
    fetch(`../Controller/PoiController.php?action=delete&id=${encodeURIComponent(id)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showPoiFlash('Point d interet supprime.', 'warning');
                chargerTableau();
            } else {
                showPoiFlash('Suppression impossible.', 'danger');
            }
        })
        .catch(() => showPoiFlash('Erreur de suppression.', 'danger'));
}

function setPoiTableMessage(message, type) {
    const body = document.getElementById('poiTableBody');
    if (!body) return;
    const klass = type === 'danger' ? 'text-danger' : 'text-muted';
    body.innerHTML = `<tr><td colspan="8" class="text-center py-4 ${klass}">${escHtml(message)}</td></tr>`;
}

function showPoiFlash(message, type) {
    const box = document.getElementById('poiFlash');
    if (!box) return;
    box.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${escHtml(message)}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button></div>`;
    setTimeout(() => { box.innerHTML = ''; }, 3000);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
}

function normalizeText(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function escHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escAttr(value) {
    return escHtml(value).replace(/`/g, '&#096;');
}
>>>>>>> Stashed changes
