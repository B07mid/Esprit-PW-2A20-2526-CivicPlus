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

    // Créer le sélecteur de couches Leaflet en haut à droite, élargi par défaut (façon OSM)
    const baseMaps = {
        "Standard (OSM)": osmStandard,
        "Transport (TF)": osmTransport,
        "Cyclisme (TF Cycle)": osmCycle,
        "Cyclisme (CyclOSM)": osmCyclisme,
        "Paysage (TF Landscape)": osmPaysage,
        "Humanitaire (HOT)": osmHumanitaire,
        "Topographique": osmTopo,
        "Satellite (Esri)": esriSatellite
    };
    L.control.layers(baseMaps, null, { collapsed: false }).addTo(map);

    // Groupe de calques persistant pour les marqueurs (toujours visible)
    let osmMarkers = L.layerGroup().addTo(map);
    let localMarkers = L.layerGroup().addTo(map);
    let timeoutId = null;

    // 3. Fonction asynchrone qui connecte la map à l'Overpass API (OSM)
    function fetchPOIs() {
        // Utiliser la boite englobante (Bounding Box) exacte de l'écran (Sud, Ouest, Nord, Est)
        const bounds = map.getBounds();
        const s = bounds.getSouth();
        const w = bounds.getWest();
        const n = bounds.getNorth();
        const e = bounds.getEast();
        const bbox = `${s},${w},${n},${e}`;

        // Requête massive "TOUUUUT" : récupérer n'importe quelle aménité (amenity) dans la zone visualisée
        const overpassQuery = `
            [out:json][timeout:25];
            (
              node["amenity"](${bbox});
              way["amenity"](${bbox});
              relation["amenity"](${bbox});
            );
            out center;
        `;

        // Utilisation du miroir lz4 très rapide et stable de l'API Overpass
        const overpassUrl = "https://lz4.overpass-api.de/api/interpreter";

        fetch(overpassUrl, {
            method: "POST",
            body: overpassQuery
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("L'API a répondu avec l'erreur " + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Nettoyer les anciens marqueurs uniqement SI la requête réussit
            osmMarkers.clearLayers();

            if (data.elements) {
                data.elements.forEach(el => {
                    // Les points peuvent être des Nodes bruts ou le centre calculé d'un Way
                    let elLat = el.lat || (el.center && el.center.lat);
                    let elLon = el.lon || (el.center && el.center.lon);
                    
                    if (elLat && elLon && el.tags && el.tags.amenity) {
                        let color = "gray";
                        const amenity = el.tags.amenity;
                        let typeTr = amenity.charAt(0).toUpperCase() + amenity.slice(1);
                        let iconClass = "bi-geo-alt-fill";
                        
                        // Définition des couleurs spécifiques et icônes
                        if (["townhall", "courthouse", "post_office"].includes(amenity)) {
                            color = "orange";
                            typeTr = "Administration";
                            iconClass = amenity === "post_office" ? "bi-envelope" : "bi-bank2";
                        } else if (["police", "fire_station"].includes(amenity)) {
                            color = "blue";
                            typeTr = amenity === "police" ? "Police" : "Pompiers";
                            iconClass = amenity === "police" ? "bi-shield-shaded" : "bi-fire";
                        } else if (["hospital", "clinic", "pharmacy", "doctors"].includes(amenity)) {
                            color = "red";
                            typeTr = amenity === "pharmacy" ? "Pharmacie" : "Santé";
                            iconClass = amenity === "pharmacy" ? "bi-capsule" : "bi-hospital-fill";
                        } else if (["bus_station", "taxi"].includes(amenity)) {
                            color = "green";
                            typeTr = "Transport";
                            iconClass = amenity === "taxi" ? "bi-taxi-front" : "bi-bus-front-fill";
                        } else if (["school", "university", "college", "kindergarten", "library"].includes(amenity)) {
                            color = "purple";
                            typeTr = amenity === "kindergarten" ? "Maternelle" : "Éducation";
                            iconClass = amenity === "university" ? "bi-mortarboard-fill" : "bi-book-fill";
                        }

                        let name = el.tags.name || "Nom non renseigné";
                        let phone = el.tags["contact:phone"] || el.tags.phone || "";
                        let website = el.tags.website || "";
                        let address = (el.tags["addr:street"] ? el.tags["addr:street"] + (el.tags["addr:housenumber"] ? " " + el.tags["addr:housenumber"] : "") : "") || "";

                        // Création du HTML du popup complet pour OSM
                        let popupContent = `
                            <div dir="auto" style="text-align: start;">
                                <h6 class="mb-1" style="font-weight: 700;">${name}</h6>
                                <span class="badge bg-secondary mb-2">${typeTr}</span>
                        `;
                        
                        if (address !== "") {
                            popupContent += `<p class="mt-1 mb-1" style="font-size: 13px;"><i class="bi bi-geo-alt"></i> ${address}</p>`;
                        }
                        if (phone !== "") {
                            popupContent += `<p class="mt-0 mb-1" style="font-size: 13px;"><i class="bi bi-telephone"></i> ${phone}</p>`;
                        }
                        if (website !== "") {
                            popupContent += `<p class="mt-0 mb-1" style="font-size: 13px;"><i class="bi bi-globe"></i> <a href="${website}" target="_blank">Site web</a></p>`;
                        }
                        
                        popupContent += `</div>`;
                            
                        // Élément HTML personnalisé pour le marqueur stylé Leaflet (DivIcon)
                        const customIcon = L.divIcon({
                            className: 'custom-leaflet-icon',
                            html: `<div class="custom-marker" style="background-color: ${color}"><i class="bi ${iconClass}"></i></div>`,
                            iconSize: [40, 40],
                            iconAnchor: [20, 40], // Pointe vers le bas
                            popupAnchor: [0, -35]  // Position du popup au-dessus
                        });

                        // Initialisation et ajout du marqueur
                        const marker = L.marker([elLat, elLon], { icon: customIcon })
                            .bindPopup(popupContent);
                        
                        osmMarkers.addLayer(marker);
                    }
                });
            }
        })
        .catch(error => {
            // L'API gratuite Overpass de OSM peut parfois saturer (Timeout 504 / Erreur 429)
            console.warn("L'API gratuite a eu un petit ralentissement :", error);
        });
    }

    // 4. Automatisation des appels
    // Lancer immédiatement la recherche
    fetchPOIs();

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

    map.on('moveend', () => {
        // Utilisation d'un Debounce pour ne pas inonder de requêtes l'API gratuite
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fetchPOIs();
        }, 1500); // Exécute après 1.5sec que la Map s'arrête de bouger (incluant les sauts de localisation)
    });

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
