document.addEventListener("DOMContentLoaded", function () {
    const mapContainer = document.getElementById('location-picker-map');
    // Si aucun conteneur de carte n'est sur la page, on ne fait rien.
    if (!mapContainer) return;

    // Détection des inputs
    let latInput = document.getElementById('latitude') || document.getElementById('latitude_domicile') || document.querySelector('input[name="latitude"]') || document.querySelector('input[name="latitude_domicile"]');
    let lngInput = document.getElementById('longitude') || document.getElementById('longitude_domicile') || document.querySelector('input[name="longitude"]') || document.querySelector('input[name="longitude_domicile"]');

    if (!latInput || !lngInput) {
        console.warn("Location picker: Inputs de latitude/longitude non trouvés.");
        return;
    }

    // Assigner un ID si non existant (pour Leaflet s'il veut s'attacher)
    if (!latInput.id) latInput.id = "picker_lat";
    if (!lngInput.id) lngInput.id = "picker_lng";

    // Valeur de départ. Par défaut: Tunis.
    let initLat = parseFloat(latInput.value);
    let initLng = parseFloat(lngInput.value);
    let hasDefaultValue = !isNaN(initLat) && !isNaN(initLng);

    let defaultLat = hasDefaultValue ? initLat : 36.8065;
    let defaultLng = hasDefaultValue ? initLng : 10.1815;

    // Initialisation Leaflet
    const map = L.map('location-picker-map').setView([defaultLat, defaultLng], hasDefaultValue ? 15 : 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Initialisation du marqueur glissant
    const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

    // Detect ville / quartier inputs
    let villeInput    = document.getElementById('ville')    || document.querySelector('input[name="ville"]');
    let quartierInput = document.getElementById('quartier') || document.querySelector('input[name="quartier"]');

    // Fonction de mise à jour des inputs
    function updateInputs(latlng) {
        latInput.value = latlng.lat.toFixed(6);
        lngInput.value = latlng.lng.toFixed(6);
        reverseGeocode(latlng.lat, latlng.lng);
    }

    // Reverse geocode via Nominatim
    function reverseGeocode(lat, lng) {
        var url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat='
                  + lat + '&lon=' + lng + '&accept-language=fr';
        fetch(url, { headers: { 'Accept': 'application/json' } })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var addr = data.address || {};
                // Ville: city > town > village > county
                var ville = addr.city || addr.town || addr.village || addr.county || '';
                // Quartier: suburb > neighbourhood > quarter > district
                var quartier = addr.suburb || addr.neighbourhood || addr.quarter || addr.district || addr.residential || '';
                if (villeInput    && ville)    { villeInput.value    = ville; }
                if (quartierInput && quartier) { quartierInput.value = quartier; }
            })
            .catch(function() { /* silently ignore geocoding errors */ });
    }

    // Quand l'utilisateur glisse le pointeur
    marker.on('dragend', function (e) {
        updateInputs(marker.getLatLng());
    });

    // Quand l'utilisateur clique n'importe où sur la map
    map.on('click', function (e) {
        marker.setLatLng(e.latlng);
        updateInputs(e.latlng);
    });

    // Optionnel: Si l'utilisateur tape à la commande directement dans l'input, on déplace le point
    function onInputTyping() {
        let lat = parseFloat(latInput.value);
        let lng = parseFloat(lngInput.value);
        if (!isNaN(lat) && !isNaN(lng)) {
            let newLatLng = new L.LatLng(lat, lng);
            marker.setLatLng(newLatLng);
            map.flyTo(newLatLng, 15);
        }
    }
    latInput.addEventListener('input', onInputTyping);
    lngInput.addEventListener('input', onInputTyping);

    // Si pas de valeur par défaut, on tente de géolocaliser l'utilisateur
    if (!hasDefaultValue) {
        map.locate({setView: true, maxZoom: 16});
        map.on('locationfound', function(e) {
            marker.setLatLng(e.latlng);
            updateInputs(e.latlng);
        });
        map.on('locationerror', function(e) {
            console.log("Géolocalisation automatique échouée ou refusée.");
            // Le marqueur reste sur Tunis par défaut
            updateInputs({lat: 36.8065, lng: 10.1815});
        });
    }
});
