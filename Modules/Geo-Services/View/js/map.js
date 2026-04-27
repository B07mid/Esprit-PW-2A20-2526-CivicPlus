document.addEventListener("DOMContentLoaded", function () {
    // 1. Initialiser la map Leaflet
    const map = L.map('map').setView([36.8065, 10.1815], 12); // Tunis centre

    // 2. Définition du catalogue des couches de base (Base Maps)
    const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    const osmTransport = L.tileLayer('https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=986c6234d9d842a2a7f4cf5bacc01efb', {
        maxZoom: 19,
        attribution: '&copy; Thunderforest, OpenStreetMap'
    });

    const osmCycle = L.tileLayer('https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=986c6234d9d842a2a7f4cf5bacc01efb', {
        maxZoom: 19,
        attribution: '&copy; Thunderforest, OpenStreetMap'
    });

    const osmPaysage = L.tileLayer('https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=986c6234d9d842a2a7f4cf5bacc01efb', {
        maxZoom: 19,
        attribution: '&copy; Thunderforest, OpenStreetMap'
    });

    const osmHumanitaire = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap, Tiles by HOT'
    });

    const osmCyclisme = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap, Tiles by CyclOSM'
    });

    const osmTopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: '&copy; OpenStreetMap, SRTM | Tiles by OpenTopoMap'
    });

    const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '&copy; Esri, Maxar, Earthstar Geographics'
    });

    // Activer la carte Standard par défaut
    osmStandard.addTo(map);

    // Créer le sélecteur de couches Leaflet en haut à droite
    const baseMaps = {
        "<i class='bi bi-map'></i> Standard": osmStandard,
        "<i class='bi bi-bus-front'></i> Transport": osmTransport,
        "<i class='bi bi-layers'></i> Topographique": osmTopo,
        "<i class='bi bi-globe-americas'></i> Satellite": esriSatellite
    };
    L.control.layers(baseMaps, null, { collapsed: true }).addTo(map);

    // Groupe de calques persistant pour les marqueurs (toujours visible)
    let localMarkers = L.layerGroup().addTo(map);
    let timeoutId = null;
    let userCoords = null;
    let routingControl = null;

    // --- RECHERCHE FOURSQUARE & ROUTING --- //

    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const sidebar = document.getElementById('sidebar-results');
    const resultsContent = document.getElementById('results-content');

    // Layer temporaire pour les résultats de recherche
    let searchMarkers = L.layerGroup().addTo(map);

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;

        // Vérification renforcée de la position
        if (!userCoords) {
            alert("Veuillez patienter, géolocalisation en cours...");
            return;
        }

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=tn&limit=10`;
        
        fetch(url)
        .then(res => res.json())
        .then(data => {
            resultsContent.innerHTML = '';
            searchMarkers.clearLayers();
            sidebar.style.display = 'block';

            if (data && data.length > 0) {
                // 1. Calcul de Distance (en mètres)
                data.forEach(place => {
                    place.distance = map.distance(userCoords, L.latLng(place.lat, place.lon));
                });
                
                // 2. Tri par proximité
                data.sort((a, b) => a.distance - b.distance);

                // 3. Rendu de l'Interface Nominatim
                data.forEach((place, index) => {
                    // Formatage de la distance
                    let distText = '';
                    if (place.distance < 1000) {
                        distText = `${Math.round(place.distance)} m`;
                    } else {
                        distText = `${(place.distance / 1000).toFixed(1)} km`;
                    }

                    const placeName = place.name || (place.type ? place.type.charAt(0).toUpperCase() + place.type.slice(1) : 'Lieu sans nom');

                    const card = document.createElement('div');
                    card.className = 'place-card shadow-sm border-0';
                    card.dataset.loaded = "false";
                    card.dataset.loading = "false";
                    
                    card.innerHTML = `
                        <div class="place-info">
                            <h6 class="fw-bold mb-1">${placeName}</h6>
                            <p class="small text-muted mb-1">${place.display_name}</p>
                            <div class="mb-2 text-primary fw-bold"><i class="bi bi-compass"></i> À ${distText}</div>
                            <div class="dynamic-content mt-2"></div>
                            <button class="btn btn-sm btn-outline-primary w-100 info-btn mt-2" type="button">Afficher infos</button>
                            <button class="go-btn btn-go mt-2" data-lat="${place.lat}" data-lon="${place.lon}">
                                Y aller 📍
                            </button>
                        </div>
                    `;
                    resultsContent.appendChild(card);

                    const infoBtn = card.querySelector('.info-btn');
                    infoBtn.addEventListener('click', async () => {
                        if (infoBtn.disabled) return; // Sécurité anti-double clic
                        infoBtn.disabled = true;
                        infoBtn.innerHTML = '⏳...';

                        const contentDiv = card.querySelector('.dynamic-content');
                        const placeName = encodeURIComponent(place.name || place.type);

                        try {
                            const res = await fetch(`../Controller/api_realdata.php?name=${placeName}`).then(r => r.json());

                            if (res.error) {
                                contentDiv.innerHTML = `<span class="text-warning small">${res.error}</span>`;
                                infoBtn.innerHTML = 'Infos ℹ️';
                                infoBtn.disabled = false;
                            } else {
                                let photoHtml = '';
                                // On utilise la référence pour appeler notre proxy PHP
                                if (res.photo_ref) {
                                    photoHtml = `<img src="../Controller/api_photo.php?ref=${encodeURIComponent(res.photo_ref)}" class="img-fluid rounded mb-2 shadow-sm" style="max-height: 140px; width: 100%; object-fit: cover;" alt="photo">`;
                                }

                                contentDiv.innerHTML = `
                                    ${photoHtml}

                                    <div class="d-flex align-items-center p-2 bg-light rounded border">
                                        <img src="${res.icon}" style="width: 24px; height: 24px; margin-right: 10px;" alt="icon">
                                        <div>
                                            <div class="small fw-bold text-dark">${res.address.split(',')[0]}</div>
                                            <div class="small text-warning mt-1">
                                                <strong>⭐ ${res.rating} / 5</strong> <span class="text-muted">(${res.reviews} avis)</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                                infoBtn.style.display = 'none'; // On cache le bouton une fois chargé !
                            }
                        } catch (err) {
                            contentDiv.innerHTML = 'Erreur réseau';
                            infoBtn.innerHTML = 'Réessayer 🔄';
                            infoBtn.disabled = false;
                        }
                    });

                    // Ajout d'un marqueur temporaire sur la carte
                    const marker = L.marker([place.lat, place.lon])
                        .bindPopup(`<strong>${placeName}</strong><br><small>À ${distText}</small>`)
                        .addTo(searchMarkers);
                });

                // Événement pour le bouton 'Y aller' -> Leaflet Routing
                document.querySelectorAll('.btn-go').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const destLat = this.getAttribute('data-lat');
                        const destLng = this.getAttribute('data-lon');
                        startRouting(destLat, destLng);
                        sidebar.style.display = 'none'; // Ferme la sidebar pendant le routing
                    });
                });

            } else {
                resultsContent.innerHTML = '<p class="text-center p-3">Aucun résultat trouvé dans cette zone.</p>';
            }
        })
        .catch(err => console.error("Erreur de recherche Nominatim :", err));
    });

    function startRouting(destLat, destLng) {
        if (!userCoords) {
            alert("Localisation requise pour calculer l'itinéraire !");
            return;
        }

        // Nettoyer l'ancienne route
        if (routingControl) {
            map.removeControl(routingControl);
        }

        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(userCoords.lat, userCoords.lng),
                L.latLng(destLat, destLng)
            ],
            lineOptions: {
                styles: [{ color: '#fd7e14', opacity: 0.8, weight: 6 }]
            },
            createMarker: function() { return null; } // On n'ajoute pas de marqueurs par défaut
        }).addTo(map);
    }



    // 4.1 Récupérer aussi les POIs de la base de données locale (CivicPlus)
    function fetchLocalPOIs() {
        fetch('../Controller/PoiController.php?action=getAll')
            .then(response => response.json())
            .then(data => {
                data.forEach(poi => {
                    let color = "gray";
                    let typeTr = poi.categorie_service || "Inconnu";
                    let iconClass = "bi-geo-alt-fill";
                    
                    if (poi.categorie_service === "administration") {
                        color = "orange";
                        typeTr = "Administration";
                        iconClass = "bi-bank2";
                    } else if (poi.categorie_service === "sante") {
                        color = "red";
                        typeTr = "Santé";
                        iconClass = "bi-hospital-fill";
                    } else if (poi.categorie_service === "transport") {
                        color = "green";
                        typeTr = "Transport";
                        iconClass = "bi-bus-front-fill";
                    } else if (poi.categorie_service === "education") {
                        color = "purple";
                        typeTr = "Éducation";
                        iconClass = "bi-book-fill";
                    }

                    let popupContent = `
                        <div dir="auto" style="text-align: start;">
                            <h6 class="mb-1" style="font-weight: 700;">${poi.nom_poi}</h6>
                            <span class="badge bg-secondary mb-2">${typeTr}</span>
                    `;

                    if (poi.adresse_postale) {
                        popupContent += `<p class="mt-1 mb-1" style="font-size: 13px;"><i class="bi bi-geo-alt"></i> ${poi.adresse_postale}</p>`;
                    }
                    if (poi.contact_tel) {
                        popupContent += `<p class="mt-0 mb-1" style="font-size: 13px;"><i class="bi bi-telephone"></i> ${poi.contact_tel}</p>`;
                    }
                    if (poi.horaires_ouverture) {
                        popupContent += `<p class="mt-0 mb-1" style="font-size: 13px;"><i class="bi bi-clock"></i> ${poi.horaires_ouverture}</p>`;
                    }
                    if (poi.accessible_pmr == 1) {
                        popupContent += `<span class="badge bg-success mt-1"><i class="bi bi-person-wheelchair"></i> Accessible PMR</span>`;
                    }

                    popupContent += `
                            <div class="mt-2 pt-2 border-top" style="font-size: 12px; color: #666;">
                                <i class="bi bi-check-circle-fill text-success"></i> <em>POI certifié CivicPlus</em>
                            </div>
                        </div>
                    `;

                    const customIcon = L.divIcon({
                        className: 'custom-leaflet-icon',
                        html: `<div class="custom-marker" style="background-color: ${color}"><i class="bi ${iconClass}"></i></div>`,
                        iconSize: [40, 40],
                        iconAnchor: [20, 40],
                        popupAnchor: [0, -35]
                    });

                    const marker = L.marker([poi.latitude, poi.longitude], { icon: customIcon })
                        .bindPopup(popupContent);
                    
                    localMarkers.addLayer(marker);
                });
            })
            .catch(error => console.error("Erreur chargement POIs locaux:", error));
    }

    fetchLocalPOIs();



    // 5. Géolocalisation HTML5 & Leaflet
    map.locate({ setView: true, maxZoom: 16 });

    let precisionCircle = null;
    let currentLocationMarker = null;

    map.on('locationfound', function (e) {
        const radius = e.accuracy / 2;

        // Nettoyer si l'utilisateur relance ou change de GPS
        if (currentLocationMarker) map.removeLayer(currentLocationMarker);
        if (precisionCircle) map.removeLayer(precisionCircle);

        // Bulle de précision subtile immersive
        precisionCircle = L.circle(e.latlng, radius, {
            color: '#112f8d',
            fillColor: '#112f8d',
            fillOpacity: 0.15,
            weight: 1
        }).addTo(map);

        // Mettre à jour les coordonnées utilisateur globales
        userCoords = e.latlng;

        // Marqueur Pulse bleu façon "GPS Phone"
        currentLocationMarker = L.circleMarker(e.latlng, {
            radius: 8,
            fillColor: "#007bff",
            color: "#ffffff",
            weight: 3,
            opacity: 1,
            fillOpacity: 1
        }).addTo(map)
        .bindPopup(`<strong style="color: #007bff;">Votre Position</strong><br><small>Précision à ${Math.round(radius)} mètres</small>`)
        .openPopup();
        
        // Note: setView: true de map.locate déclenchera auto 'moveend'
        // Ce qui mettra à jour l'API Overpass tout autour de cette nouvelle coordonnée.
    });

    map.on('locationerror', function (e) {
        alert("La géolocalisation a été refusée ou est inaccessible ! La carte restera sur la position par défaut. Vous pouvez naviguer manuellement.");
    });
});
