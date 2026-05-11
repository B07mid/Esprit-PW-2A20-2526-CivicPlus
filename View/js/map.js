let map;
let placesService;
let infoWindow;
let directionsService;
let directionsRenderer;

let userLatLng = null;
let userMarker = null;
let userCircle = null;
let autocompleteMarker = null;
let placeDetailsCard = null;
let currentPlaceForZahma = null;

const searchMarkers = [];
const localMarkers = [];
const localPois = [];

let currentMapTheme = 'light';

// Garde module
let lieuxDeGardeMocks = [];

const carthageLightStyle = [
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#008ec4" }] },
    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f9f5ed" }] },
    { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#f9f5ed" }] },
    { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ visibility: "off" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e3eedd" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#2c3e50" }] }
];

const civicDarkStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#e2e8f0" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#4b5563" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
];

const citizenIconPaths = {
    townHall: "<g fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 18L20 13L28 18\"/><rect x=\"14\" y=\"18\" width=\"12\" height=\"10\" rx=\"1\"/><path d=\"M16 28V22M20 28V22M24 28V22\"/></g>",
    hospital: "<g fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\"><path d=\"M20 14v12\"/><path d=\"M14 20h12\"/></g>",
    police: "<g fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 12l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11v-6l8-3z\"/></g>"
};

const civicCategoryMeta = {
    administration: { label: "Administration", icon: "bi-building", color: "#f68d56" },
    sante: { label: "Sante", icon: "bi-heart-pulse", color: "#dc3545" },
    transport: { label: "Transport", icon: "bi-bus-front", color: "#198754" },
    education: { label: "Education", icon: "bi-mortarboard", color: "#112f8d" },
    autre: { label: "Autre", icon: "bi-geo-alt", color: "#203578" }
};

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getLatLngFromPlace(place) {
    if (!place || !place.geometry || !place.geometry.location) {
        return null;
    }
    return place.geometry.location;
}

function showSidebar(sidebar) {
    if (!sidebar) return;
    sidebar.style.display = "block";
    window.requestAnimationFrame(() => sidebar.classList.add("is-visible"));
}

function hideSidebar(sidebar) {
    if (!sidebar) return;
    sidebar.classList.remove("is-visible");
    window.setTimeout(() => {
        if (!sidebar.classList.contains("is-visible")) {
            sidebar.style.display = "none";
        }
    }, 260);
}

function showGeoToast(message) {
    const toast = document.getElementById("geo-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showGeoToast.timer);
    showGeoToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function animateMarker(marker) {
    if (!marker || typeof marker.setAnimation !== "function" || !google.maps.Animation) {
        return;
    }
    marker.setAnimation(google.maps.Animation.BOUNCE);
    window.setTimeout(() => marker.setAnimation(null), 850);
}

function getCategoryMeta(category) {
    const key = String(category || "autre").toLowerCase();
    return civicCategoryMeta[key] || {
        label: key ? key.charAt(0).toUpperCase() + key.slice(1) : "Autre",
        icon: "bi-geo-alt",
        color: "#203578"
    };
}

function buildGoogleLikePinSvg(color) {
    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
            <path d="M17 1C8.2 1 1 8.1 1 16.9C1 28.8 17 43 17 43S33 28.8 33 16.9C33 8.1 25.8 1 17 1Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
            <circle cx="17" cy="16.8" r="6.3" fill="#ffffff"/>
        </svg>
    `;
}

function createGoogleLikePinIcon(color) {
    return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(buildGoogleLikePinSvg(color))}`,
        scaledSize: new google.maps.Size(34, 44),
        anchor: new google.maps.Point(17, 43)
    };
}

function getPlaceOpenStatus(place, allowClosedStatus = true) {
    const hours = place && place.opening_hours;
    if (!hours) return null;

    if (typeof hours.open_now === "boolean") {
        if (hours.open_now) return { label: "Ouvert", className: "status-open", isOpen: true };
        return allowClosedStatus ? { label: "Ferme", className: "status-closed", isOpen: false } : null;
    }

    if (typeof hours.isOpen === "function") {
        const isOpen = hours.isOpen();
        if (typeof isOpen === "boolean") {
            if (isOpen) return { label: "Ouvert", className: "status-open", isOpen: true };
            return allowClosedStatus ? { label: "Ferme", className: "status-closed", isOpen: false } : null;
        }
    }

    return null;
}

function isDarkModeActive() {
    if (document.documentElement.dataset.theme === "dark" || document.documentElement.dataset.bsTheme === "dark") {
        return true;
    }
    if (document.documentElement.classList.contains("dark-mode")) {
        return true;
    }
    if (document.body && (document.body.classList.contains("dark") || document.body.classList.contains("dark-mode"))) {
        return true;
    }
    if (window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
}

function getActiveMapStyle() {
    return currentMapTheme === 'dark' ? civicDarkStyle : carthageLightStyle;
}

function setupMapStyleListener() {
    function updateMapTheme(newTheme) {
        if (currentMapTheme !== newTheme) {
            currentMapTheme = newTheme;
            if (map) {
                map.setOptions({ styles: getActiveMapStyle() });
                window.dispatchEvent(new CustomEvent('mapThemeChanged', { detail: currentMapTheme }));
            }
        }
    }

    if (window.matchMedia) {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = function (e) {
            const hasExplicitTheme = document.documentElement.hasAttribute('data-theme') || 
                                     document.body.classList.contains('dark') || 
                                     document.body.classList.contains('dark-mode');
            if (!hasExplicitTheme) {
                updateMapTheme(e.matches ? 'dark' : 'light');
            }
        };

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", handleChange);
        } else if (typeof mediaQuery.addListener === "function") {
            mediaQuery.addListener(handleChange);
        }
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme')) {
                const isDark = isDarkModeActive();
                updateMapTheme(isDark ? 'dark' : 'light');
            }
        });
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
}

function buildMarkerSvg(color, iconMarkup) {
    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
            <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="rgba(0,0,0,0.35)" />
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <circle cx="20" cy="20" r="18" fill="${color}" />
                <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1" />
                ${iconMarkup}
            </g>
        </svg>
    `;
}

function createCitizenMarker(position, color, iconMarkup) {
    const svgMarkup = buildMarkerSvg(color, iconMarkup);
    const hasMapId = map && typeof map.get === "function" && map.get("mapId");
    if (hasMapId && google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        const wrapper = document.createElement("div");
        wrapper.className = "poi-marker";
        wrapper.innerHTML = svgMarkup;
        return new google.maps.marker.AdvancedMarkerElement({
            map,
            position,
            content: wrapper,
            gmpClickable: true
        });
    }

    return new google.maps.Marker({
        map,
        position,
        icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarkup)}`,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
        }
    });
}

function initMap() {
    const mapElement = document.getElementById("map");
    if (!mapElement) {
        console.error("Map container #map introuvable.");
        return;
    }

    currentMapTheme = isDarkModeActive() ? 'dark' : 'light';
    const tunisCenter = { lat: 36.8065, lng: 10.1815 };

    map = new google.maps.Map(mapElement, {
        center: tunisCenter,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: true,
        styles: getActiveMapStyle()
    });

    // Theme Switcher Control
    const themeControlDiv = document.createElement("div");
    themeControlDiv.className = "theme-switcher-control";
    themeControlDiv.style.margin = "10px";
    
    themeControlDiv.innerHTML = `<button type="button" class="btn-theme-toggle" style="background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px); border: 1px solid rgba(0,0,0,0.1); padding: 8px 16px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); cursor: pointer; font-weight: 600; color: #0f172a; display: flex; align-items: center; gap: 8px; transition: all 0.3s ease;">
        <span class="theme-text"></span>
    </button>`;
    
    const btnTheme = themeControlDiv.querySelector("button");
    const btnText = btnTheme.querySelector(".theme-text");
    
    function updateThemeUI(theme) {
        if (theme === 'dark') {
            btnText.innerHTML = '<i class="bi bi-sun me-2" aria-hidden="true"></i>Mode Jour';
            btnTheme.style.background = "rgba(15, 23, 42, 0.9)";
            btnTheme.style.color = "#f8fafc";
            btnTheme.style.border = "1px solid rgba(255,255,255,0.1)";
        } else {
            btnText.innerHTML = '<i class="bi bi-moon-stars me-2" aria-hidden="true"></i>Mode Nuit';
            btnTheme.style.background = "rgba(255, 255, 255, 0.9)";
            btnTheme.style.color = "#0f172a";
            btnTheme.style.border = "1px solid rgba(0,0,0,0.1)";
        }
    }
    
    btnTheme.addEventListener("click", () => {
        currentMapTheme = currentMapTheme === 'light' ? 'dark' : 'light';
        map.setOptions({ styles: getActiveMapStyle() });
        updateThemeUI(currentMapTheme);
        window.dispatchEvent(new CustomEvent('mapThemeChanged', { detail: currentMapTheme }));
    });
    
    btnTheme.addEventListener("mouseenter", () => btnTheme.style.transform = "scale(1.05)");
    btnTheme.addEventListener("mouseleave", () => btnTheme.style.transform = "scale(1)");
    
    updateThemeUI(currentMapTheme);
    window.addEventListener('mapThemeChanged', (e) => {
        updateThemeUI(e.detail);
        if (directionsRenderer) {
            directionsRenderer.setOptions({
                polylineOptions: {
                    strokeColor: e.detail === 'dark' ? '#f97316' : '#0f2e5a',
                    strokeOpacity: 0.9,
                    strokeWeight: 5
                }
            });
            // Force re-render of directions if they exist
            const currentRoute = directionsRenderer.getDirections();
            if (currentRoute) {
                directionsRenderer.setDirections(currentRoute);
            }
        }
    });
    
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(themeControlDiv);

    infoWindow = new google.maps.InfoWindow();
    placesService = new google.maps.places.PlacesService(map);
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: {
            strokeColor: currentMapTheme === 'dark' ? '#f97316' : '#0f2e5a',
            strokeOpacity: 0.9,
            strokeWeight: 5
        }
    });

    setupMapStyleListener();

    bindSearchUI();
    bindGardeUI();
    bindMapUtilityControls();
    fetchLocalPOIs();

    map.addListener("click", function(event) {
        if (event.placeId) {
            event.stop();
            if (placeDetailsCard) {
                fetchPlaceDetailsById(event.placeId, placeDetailsCard);
            }
        }
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                const pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                updateUserLocation(pos, position.coords.accuracy);
                map.setCenter(pos);
            },
            function () {
                alert("La geolocalisation a ete refusee ou est inaccessible ! La carte restera sur la position par defaut. Vous pouvez naviguer manuellement.");
            }
        );
    }
}

function bindSearchUI() {
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search-input");
    const sidebar = document.getElementById("sidebar-results");
    const resultsContent = document.getElementById("results-content");
    const resultsCount = document.getElementById("results-count");
    const placeDetails = initPlaceDetailsCard();
    placeDetailsCard = placeDetails;

    if (!searchForm || !searchInput || !sidebar || !resultsContent) {
        return;
    }

    const sidebarClose = sidebar.querySelector(".sidebar-close");
    if (sidebarClose) {
        sidebarClose.addEventListener("click", function () {
            hideSidebar(sidebar);
        });
    }

    document.querySelectorAll(".geo-chip[data-query]").forEach((chip) => {
        chip.addEventListener("click", function () {
            document.querySelectorAll(".geo-chip").forEach((item) => item.classList.remove("active"));
            chip.classList.add("active");
            searchInput.value = chip.dataset.query || "";
            searchForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        });
    });

    document.querySelectorAll(".geo-chip[data-local-filter], #geo-open-officials").forEach((control) => {
        control.addEventListener("click", function () {
            document.querySelectorAll(".geo-chip").forEach((item) => item.classList.remove("active"));
            if (control.classList.contains("geo-chip")) {
                control.classList.add("active");
            }
            renderOfficialPois();
        });
    });

    const autocomplete = new google.maps.places.Autocomplete(searchInput);
    autocomplete.setFields([
        "place_id",
        "name",
        "geometry",
        "formatted_address",
        "photos",
        "rating",
        "reviews",
        "opening_hours"
    ]);
    autocomplete.bindTo("bounds", map);
    autocomplete.addListener("place_changed", function () {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
            return;
        }

        map.panTo(place.geometry.location);
        map.setZoom(15);

        if (autocompleteMarker) {
            autocompleteMarker.setMap(null);
        }

        autocompleteMarker = new google.maps.Marker({
            map,
            position: place.geometry.location,
            title: place.name || "",
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#111827",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2
            }
        });

        if (placeDetails) {
            focusPlaceOnMap(place, 15);
            renderPlaceDetails(place, placeDetails);
            // Fetch full details (includes place_id injection for garde/zahma)
            if (place.place_id) {
                fetchPlaceDetailsById(place.place_id, placeDetails);
            }
        }
    });

    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;

        clearMarkers(searchMarkers);
        resultsContent.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"></div><p class="small fw-semibold mt-2 mb-0">Recherche autour de la carte...</p></div>';
        showSidebar(sidebar);

        const request = {
            query,
            location: map.getCenter(),
            radius: 15000,
            region: "tn"
        };

        placesService.textSearch(request, function (results, status) {
            if (status !== google.maps.places.PlacesServiceStatus.OK || !results || results.length === 0) {
                resultsContent.innerHTML = '<p class="text-center p-3">Aucun résultat trouvé dans cette zone.</p>';
                if (resultsCount) {
                    resultsCount.textContent = "0";
                }
                return;
            }

            if (resultsCount) {
                resultsCount.textContent = results.length.toString();
            }
            resultsContent.innerHTML = "";

            const origin = userLatLng || map.getCenter();
            const enriched = results.map((place) => {
                const distance = origin
                    ? google.maps.geometry.spherical.computeDistanceBetween(origin, place.geometry.location)
                    : null;
                return { place, distance };
            });

            enriched.sort((a, b) => (a.distance || 0) - (b.distance || 0));

            enriched.forEach(({ place, distance }) => {
                const distText = formatDistance(distance);
                const placeName = place.name || "Lieu sans nom";
                const address = place.formatted_address || "";
                const photoUrl = place.photos && place.photos.length > 0
                    ? place.photos[0].getUrl({ maxWidth: 200, maxHeight: 200 })
                    : "";
                const hasRating = Number.isFinite(place.rating);
                const ratingHtml = hasRating ? buildRatingStars(place.rating) : '<span class="rating-muted">Pas de note</span>';
                const openStatus = getPlaceOpenStatus(place, false);

                const card = document.createElement("div");
                card.className = "place-card";
                card.style.animationDelay = `${Math.min(resultsContent.children.length * 35, 280)}ms`;
                card.innerHTML = `
                    <div class="place-card-media">
                        ${photoUrl ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(placeName)}">` : `<div class="place-card-fallback"><i class="bi bi-image"></i></div>`}
                    </div>
                    <div class="place-card-body">
                        <div class="d-flex justify-content-between align-items-start gap-2">
                            <h6 class="place-card-title">${escapeHtml(placeName)}</h6>
                            ${openStatus ? `<span class="place-card-status ${openStatus.className}">${openStatus.label}</span>` : ""}
                        </div>
                        <p class="place-card-address">${escapeHtml(address)}</p>
                        <div class="place-card-meta">
                            <div class="place-card-rating">${ratingHtml}</div>
                            <span class="place-card-distance">${distText}</span>
                        </div>
                        <div class="place-card-actions">
                            <button class="btn btn-sm btn-primary info-btn" type="button">Voir details</button>
                            <button class="btn btn-sm btn-outline-primary btn-go" type="button" data-lat="${place.geometry.location.lat()}" data-lng="${place.geometry.location.lng()}">Y aller</button>
                        </div>
                    </div>
                `;
                resultsContent.appendChild(card);

                const infoBtn = card.querySelector(".info-btn");
                infoBtn.addEventListener("click", function (event) {
                    event.stopPropagation();
                    if (placeDetails) {
                        focusPlaceOnMap(place, 15);
                        renderPlaceDetails(place, placeDetails);
                        if (place.place_id) {
                            fetchPlaceDetailsById(place.place_id, placeDetails);
                        }
                    }
                });

                const goBtn = card.querySelector(".btn-go");
                goBtn.addEventListener("click", function (event) {
                    event.stopPropagation();
                    const destLat = Number(this.getAttribute("data-lat"));
                    const destLng = Number(this.getAttribute("data-lng"));
                    startRouting({ lat: destLat, lng: destLng });
                    hideSidebar(sidebar);
                });

                card.addEventListener("click", function () {
                    if (placeDetails) {
                        focusPlaceOnMap(place, 15);
                        renderPlaceDetails(place, placeDetails);
                        if (place.place_id) {
                            fetchPlaceDetailsById(place.place_id, placeDetails);
                        }
                    }
                });

                const marker = new google.maps.Marker({
                    map,
                    position: place.geometry.location,
                    placeId: place.place_id,
                    animation: google.maps.Animation.DROP,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 6,
                        fillColor: "#fd7e14",
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 2
                    }
                });

                marker.addListener("click", function () {
                    animateMarker(marker);
                    infoWindow.setContent(`<strong>${escapeHtml(placeName)}</strong><br><small>${escapeHtml(address)}</small>`);
                    infoWindow.open(map, marker);
                    if (placeDetails) {
                        focusPlaceOnMap(place, 15);
                        renderPlaceDetails(place, placeDetails);
                        if (place.place_id) {
                            fetchPlaceDetailsById(place.place_id, placeDetails);
                        }
                    }
                });

                searchMarkers.push(marker);
            });
        });
    });
}

function startRouting(destination, travelMode = google.maps.TravelMode.DRIVING) {
    const origin = userLatLng || map.getCenter();
    if (!origin || !destination) {
        alert("Localisation requise pour calculer l'itinéraire !");
        return;
    }

    const directionsLoading = document.getElementById("directions-loading");
    const directionsInfo = document.getElementById("directions-info");
    
    if (directionsLoading) directionsLoading.style.display = "block";
    if (directionsInfo) directionsInfo.style.display = "none";

    directionsService.route(
        {
            origin,
            destination,
            travelMode: travelMode
        },
        function (result, status) {
            if (directionsLoading) directionsLoading.style.display = "none";

            if (status === google.maps.DirectionsStatus.OK && result) {
                directionsRenderer.setDirections(result);
                
                const route = result.routes[0];
                if (route && route.legs && route.legs.length > 0) {
                    const leg = route.legs[0];
                    const directionsDuration = document.getElementById("directions-duration");
                    const directionsDistance = document.getElementById("directions-distance");
                    
                    if (directionsDuration && directionsDistance && directionsInfo) {
                        directionsDuration.textContent = leg.duration.text;
                        directionsDistance.textContent = leg.distance.text;
                        directionsInfo.style.display = "block";
                    }
                }
                return;
            }
            alert("Impossible de calculer l'itinéraire.");
        }
    );
}

function fetchLocalPOIs() {
    fetch("../Controller/PoiController.php?action=getAll")
        .then((response) => response.json())
        .then((data) => {
            localPois.length = 0;
            data.forEach((poi) => {
                const coords = {
                    lat: Number(poi.latitude),
                    lng: Number(poi.longitude)
                };
                if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) {
                    return;
                }

                localPois.push({ ...poi, coords });
                const markerStyle = getPoiMarkerStyle(poi.categorie_service);
                const typeLabel = markerStyle.label;

                const popupContent = buildPoiPopup(poi, typeLabel);

                const marker = new google.maps.Marker({
                    map,
                    position: coords,
                    animation: google.maps.Animation.DROP,
                    icon: createGoogleLikePinIcon(markerStyle.color),
                    title: poi.nom_poi || typeLabel
                });

                marker.addListener("click", function () {
                    animateMarker(marker);
                    infoWindow.setContent(popupContent);
                    infoWindow.open(map, marker);
                    renderOfficialPois(poi.id_poi);
                });

                localMarkers.push(marker);
            });
            updateGeoInsights();
            renderLocalSummary();
        })
        .catch((error) => console.error("Erreur chargement POIs locaux:", error));
}

function getPoiDistance(poi) {
    if (!userLatLng || !poi || !poi.coords) {
        return null;
    }
    return google.maps.geometry.spherical.computeDistanceBetween(userLatLng, poi.coords);
}

function updateGeoInsights() {
    const totalEl = document.getElementById("geo-total-pois");
    const nearestEl = document.getElementById("geo-nearest-poi");
    const categoryEl = document.getElementById("geo-category-count");

    if (totalEl) totalEl.textContent = localPois.length.toString();

    const categories = new Set(localPois.map((poi) => String(poi.categorie_service || "autre").toLowerCase()));
    if (categoryEl) categoryEl.textContent = categories.size.toString();

    if (nearestEl) {
        const distances = localPois
            .map((poi) => getPoiDistance(poi))
            .filter((distance) => distance !== null && Number.isFinite(distance));
        nearestEl.textContent = distances.length ? formatDistance(Math.min(...distances)) : "--";
    }
}

function renderLocalSummary() {
    const subtitle = document.getElementById("geo-local-subtitle");
    const bars = document.getElementById("geo-local-bars");
    if (!bars) return;

    const counts = localPois.reduce((acc, poi) => {
        const key = String(poi.categorie_service || "autre").toLowerCase();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map((entry) => entry[1]), 1);
    bars.innerHTML = "";

    if (subtitle) {
        subtitle.textContent = localPois.length
            ? `${localPois.length} lieux certifies charges sur la carte`
            : "Aucun lieu certifie disponible";
    }

    if (!entries.length) {
        bars.innerHTML = '<p class="mb-0 small">Ajoutez un POI pour alimenter ce radar.</p>';
        return;
    }

    entries.slice(0, 4).forEach(([category, count]) => {
        const meta = getCategoryMeta(category);
        const row = document.createElement("div");
        row.className = "geo-local-bar";
        row.innerHTML = `
            <span>${escapeHtml(meta.label)}</span>
            <span class="geo-local-bar-track"><span class="geo-local-bar-fill" style="width: ${(count / max) * 100}%"></span></span>
            <strong>${count}</strong>
        `;
        bars.appendChild(row);
    });
}

function setOfficialSummaryHidden(isHidden) {
    const summary = document.querySelector(".geo-local-summary");
    const restore = document.getElementById("geo-show-officials");

    if (summary) {
        summary.classList.toggle("is-hidden", isHidden);
    }
    if (restore) {
        restore.classList.toggle("is-visible", isHidden);
    }

    try {
        localStorage.setItem("geoOfficialSummaryHidden", isHidden ? "1" : "0");
    } catch (error) {
        // Ignore storage failures; the UI still works for the current page view.
    }
}

function getOfficialSummaryHiddenPreference() {
    try {
        return localStorage.getItem("geoOfficialSummaryHidden") === "1";
    } catch (error) {
        return false;
    }
}

function renderOfficialPois(focusPoiId = null) {
    const sidebar = document.getElementById("sidebar-results");
    const resultsContent = document.getElementById("results-content");
    const resultsCount = document.getElementById("results-count");
    const resultsHeader = document.querySelector(".results-header");

    if (!sidebar || !resultsContent) return;

    if (placeDetailsCard && placeDetailsCard.card) {
        placeDetailsCard.card.style.display = "none";
    }
    const directionsPanel = document.getElementById("directions-panel");
    if (directionsPanel) directionsPanel.style.display = "none";
    if (resultsHeader) resultsHeader.style.display = "flex";
    resultsContent.style.display = "block";
    resultsContent.innerHTML = "";
    if (resultsCount) resultsCount.textContent = localPois.length.toString();

    if (!localPois.length) {
        resultsContent.innerHTML = '<p class="text-center p-3">Aucun POI officiel pour le moment.</p>';
        showSidebar(sidebar);
        return;
    }

    const sorted = [...localPois].sort((a, b) => {
        if (String(a.id_poi) === String(focusPoiId)) return -1;
        if (String(b.id_poi) === String(focusPoiId)) return 1;
        return (getPoiDistance(a) || Infinity) - (getPoiDistance(b) || Infinity);
    });

    sorted.forEach((poi) => {
        const meta = getCategoryMeta(poi.categorie_service);
        const distance = getPoiDistance(poi);
        const distanceText = distance ? formatDistance(distance) : "Sur carte";
        const card = document.createElement("div");
        card.className = "place-card";
        if (String(poi.id_poi) === String(focusPoiId)) {
            card.style.borderColor = "var(--accent-color)";
        }
        card.innerHTML = `
            <div class="place-card-media official-poi">
                <i class="bi ${escapeHtml(meta.icon)}"></i>
            </div>
            <div class="place-card-body">
                <div class="d-flex justify-content-between align-items-start gap-2">
                    <h6 class="place-card-title">${escapeHtml(poi.nom_poi || "POI CivicPlus")}</h6>
                    <span class="place-card-status status-open">Certifie</span>
                </div>
                <p class="place-card-address">${escapeHtml(poi.adresse_postale || "Adresse non renseignee")}</p>
                <div class="place-card-meta">
                    <div class="place-card-rating"><i class="bi ${escapeHtml(meta.icon)}"></i><span class="rating-value">${escapeHtml(meta.label)}</span></div>
                    <span class="place-card-distance">${escapeHtml(distanceText)}</span>
                </div>
                <div class="place-card-actions">
                    <button class="btn btn-sm btn-primary local-focus" type="button">Centrer</button>
                    <button class="btn btn-sm btn-outline-primary local-route" type="button">Y aller</button>
                </div>
            </div>
        `;

        card.querySelector(".local-focus").addEventListener("click", (event) => {
            event.stopPropagation();
            map.panTo(poi.coords);
            map.setZoom(16);
            const marker = localMarkers[localPois.findIndex((item) => String(item.id_poi) === String(poi.id_poi))];
            animateMarker(marker);
        });

        card.querySelector(".local-route").addEventListener("click", (event) => {
            event.stopPropagation();
            startRouting(poi.coords);
            hideSidebar(sidebar);
        });

        card.addEventListener("click", () => {
            map.panTo(poi.coords);
            map.setZoom(16);
        });

        resultsContent.appendChild(card);
    });

    showSidebar(sidebar);
}

function bindMapUtilityControls() {
    const locateBtn = document.getElementById("geo-locate-btn");
    const fitBtn = document.getElementById("geo-fit-btn");
    const clearRouteBtn = document.getElementById("geo-clear-route-btn");
    const hideOfficialsBtn = document.getElementById("geo-hide-officials");
    const showOfficialsBtn = document.getElementById("geo-show-officials");

    setOfficialSummaryHidden(getOfficialSummaryHiddenPreference());

    if (hideOfficialsBtn) {
        hideOfficialsBtn.addEventListener("click", () => {
            setOfficialSummaryHidden(true);
            showGeoToast("Resume des POI officiels masque.");
        });
    }

    if (showOfficialsBtn) {
        showOfficialsBtn.addEventListener("click", () => {
            setOfficialSummaryHidden(false);
            showGeoToast("Resume des POI officiels affiche.");
        });
    }

    if (locateBtn) {
        locateBtn.addEventListener("click", () => {
            if (!navigator.geolocation) {
                showGeoToast("La geolocalisation n'est pas disponible sur ce navigateur.");
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    updateUserLocation(pos, position.coords.accuracy);
                    map.panTo(pos);
                    map.setZoom(16);
                    showGeoToast("Position mise a jour.");
                },
                () => showGeoToast("Impossible de recuperer votre position.")
            );
        });
    }

    if (fitBtn) {
        fitBtn.addEventListener("click", () => {
            const bounds = new google.maps.LatLngBounds();
            [...localMarkers, ...searchMarkers].forEach((marker) => {
                if (marker && typeof marker.getPosition === "function") {
                    bounds.extend(marker.getPosition());
                }
            });
            if (userLatLng) bounds.extend(userLatLng);
            if (bounds.isEmpty()) {
                showGeoToast("Aucun point a cadrer pour le moment.");
                return;
            }
            map.fitBounds(bounds, 70);
        });
    }

    if (clearRouteBtn) {
        clearRouteBtn.addEventListener("click", () => {
            if (directionsRenderer) {
                directionsRenderer.setDirections({ routes: [] });
            }
            const directionsInfo = document.getElementById("directions-info");
            if (directionsInfo) directionsInfo.style.display = "none";
            showGeoToast("Itineraire efface.");
        });
    }
}



function initPlaceDetailsCard() {
    const card = document.getElementById("place-details-card");
    if (!card) {
        return null;
    }

    const elements = {
        panel: document.getElementById("sidebar-results"),
        card,
        closeButton: document.getElementById("place-details-close"),
        photo: document.getElementById("place-details-photo"),
        carousel: document.getElementById("place-details-carousel"),
        carouselInner: document.getElementById("place-details-carousel-inner"),
        title: document.getElementById("place-details-title"),
        rating: document.getElementById("place-details-rating"),
        address: document.getElementById("place-details-address"),
        status: document.getElementById("place-details-status"),
        hoursToday: document.getElementById("place-details-hours-today"),
        phone: document.getElementById("place-details-phone"),
        extended: document.getElementById("place-details-extended"),
        website: document.getElementById("place-details-website"),
        hoursWeek: document.getElementById("place-details-hours-week"),
        reviews: document.getElementById("place-details-reviews"),
        routeButton: document.getElementById("place-details-route"),
        infoButton: document.getElementById("place-details-more"),
        btnReportZahma: document.getElementById("btn-report-zahma"),
        zahmaSection: document.getElementById("zahma-section"),
        zahmaOptions: document.getElementById("zahma-options"),
        zahmaBadgeContainer: document.getElementById("zahma-badge-container"),
        btnDeclareGarde: document.getElementById("btn-declare-garde"),
        gardeBadge: document.getElementById("garde-badge"),
        directionsPanel: document.getElementById("directions-panel"),
        directionsClose: document.getElementById("directions-close"),
        directionsDuration: document.getElementById("directions-duration"),
        directionsDistance: document.getElementById("directions-distance"),
        directionsInfo: document.getElementById("directions-info"),
        resultsHeader: document.querySelector(".results-header"),
        resultsContent: document.getElementById("results-content")
    };

    if (elements.closeButton) {
        elements.closeButton.addEventListener("click", function () {
            hidePlaceDetails(elements);
        });
    }

    if (elements.routeButton) {
        elements.routeButton.addEventListener("click", function () {
            const lat = Number(elements.routeButton.dataset.lat);
            const lng = Number(elements.routeButton.dataset.lng);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                elements.card.style.display = "none";
                if(elements.resultsHeader) elements.resultsHeader.style.display = "none";
                if(elements.resultsContent) elements.resultsContent.style.display = "none";
                if(elements.directionsPanel) elements.directionsPanel.style.display = "block";
                
                window.currentDestination = { lat, lng };
                window.currentTravelMode = google.maps.TravelMode.DRIVING;
                document.querySelectorAll(".travel-mode-btn").forEach(btn => {
                    btn.classList.remove("active");
                    if (btn.dataset.mode === "DRIVING") btn.classList.add("active");
                });
                
                startRouting(window.currentDestination, window.currentTravelMode);
            }
        });
    }

    if (elements.infoButton) {
        elements.infoButton.addEventListener("click", function () {
            if (elements.extended && elements.extended.style.display === "none") {
                elements.extended.style.display = "block";
                elements.infoButton.textContent = "Masquer infos";
            } else if (elements.extended) {
                elements.extended.style.display = "none";
                elements.infoButton.textContent = "Afficher infos";
            }
        });
    }

    if (elements.btnReportZahma) {
        elements.btnReportZahma.addEventListener("click", function () {
            if (elements.zahmaOptions) {
                elements.zahmaOptions.classList.toggle("show");
            }
        });
    }

    const btnFluide = document.getElementById("btn-fluide");
    const btnLent = document.getElementById("btn-lent");
    const btnBloque = document.getElementById("btn-bloque");

    const handleReportClick = (status, text, colorClass) => {
        if (!currentPlaceForZahma || !currentPlaceForZahma.place_id) return;
        
        if (elements.zahmaOptions) {
            elements.zahmaOptions.classList.remove("show");
        }
        
        let enumStatut = "Fluide";
        if (status === "lent") enumStatut = "Lent";
        if (status === "bloque" || status === "zahma") enumStatut = "Zahma";

        fetch('../Controller/api_zahma.php?action=report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                place_id: currentPlaceForZahma.place_id,
                statut: enumStatut
            })
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                if (elements.zahmaBadgeContainer) {
                    elements.zahmaBadgeContainer.innerHTML = `<span class="badge ${colorClass} py-2 px-3 shadow-sm" style="font-size: 13px; width: 100%; display: block; border-radius: 8px;">État actuel : ${text} (Signalé à l'instant)</span>`;
                    elements.zahmaBadgeContainer.style.display = "block";
                    updateMarkerZahmaStatus(currentPlaceForZahma.place_id, status);
                }
            } else if (data.error === 'not_logged_in') {
                alert("⚠️ Vous devez être connecté pour signaler l'affluence !");
            } else {
                console.error("Erreur serveur lors du signalement :", data.error);
                alert("Erreur lors du signalement: " + (data.message || data.error));
            }
        })
        .catch(e => {
            console.error("Erreur réseau :", e);
            alert("Erreur de connexion lors du signalement !");
        });
    };

    if (btnFluide) btnFluide.addEventListener("click", () => handleReportClick("fluide", "🚀 Vide / Fluide", "bg-success text-white"));
    if (btnLent) btnLent.addEventListener("click", () => handleReportClick("lent", "🐢 File d'attente", "bg-warning text-dark"));
    if (btnBloque) btnBloque.addEventListener("click", () => handleReportClick("bloque", "⛔ Zahma", "bg-danger text-white"));

    // ── Declare/toggle garde ────────────────────────────────────────────────
    if (elements.btnDeclareGarde) {
        elements.btnDeclareGarde.addEventListener("click", () => {
            const place_id = elements.btnDeclareGarde.dataset.placeId;
            const nom_lieu = elements.btnDeclareGarde.dataset.nomLieu || "Lieu inconnu";
            const alreadyDeclared = elements.btnDeclareGarde.dataset.declared === "true";

            if (!place_id) {
                alert("Impossible d'identifier ce lieu.");
                return;
            }

            const action = alreadyDeclared ? 'remove' : 'declare';

            fetch(`../Controller/api_garde.php?action=${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ place_id, nom_lieu })
            })
            .then(r => r.json())
            .then(data => {
                if (data.error === 'not_logged_in') {
                    alert("⚠️ Vous devez être connecté pour déclarer un lieu de garde !");
                    return;
                }
                if (data.success) {
                    const nowDeclared = !alreadyDeclared;
                    elements.btnDeclareGarde.dataset.declared = nowDeclared ? "true" : "false";
                    elements.btnDeclareGarde.style.background = nowDeclared ? "#0dcaf0" : "none";
                    elements.btnDeclareGarde.style.color = nowDeclared ? "#fff" : "#0dcaf0";
                    elements.btnDeclareGarde.title = nowDeclared ? "Retirer la déclaration de garde" : "Déclarer ce lieu de garde";
                    if (elements.gardeBadge) {
                        elements.gardeBadge.style.display = nowDeclared ? "inline" : "none";
                    }
                }
            })
            .catch(() => alert("Erreur de connexion !"));
        });
    }

    if (elements.directionsClose) {
        elements.directionsClose.addEventListener("click", function() {
            elements.directionsPanel.style.display = "none";
            elements.card.style.display = "block";
            if(elements.resultsHeader) elements.resultsHeader.style.display = "flex";
            if(elements.resultsContent) elements.resultsContent.style.display = "block";
            directionsRenderer.setDirections({routes: []});
            if(elements.directionsInfo) elements.directionsInfo.style.display = "none";
        });
    }

    document.querySelectorAll(".travel-mode-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            document.querySelectorAll(".travel-mode-btn").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            
            const mode = this.dataset.mode;
            window.currentTravelMode = google.maps.TravelMode[mode];
            if (window.currentDestination) {
                startRouting(window.currentDestination, window.currentTravelMode);
            }
        });
    });

    return elements;
}

function timeAgo(dateString) {
    if (!dateString) return "à l'instant";
    const date = new Date(dateString.replace(/-/g, "/"));
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "à l'instant";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `il y a ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `il y a ${diffInHours} h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `il y a ${diffInDays} j`;
}

function renderPlaceDetails(place, elements) {
    if (!elements || !elements.card) {
        return;
    }

    currentPlaceForZahma = place;
    
    let isNear = false;
    if (userLatLng && place.geometry && place.geometry.location) {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, place.geometry.location);
        isNear = distance <= 1000;
    }

    if (elements.zahmaSection) {
        elements.zahmaSection.style.display = isNear ? "block" : "none";
    }
    if (elements.zahmaOptions) {
        elements.zahmaOptions.classList.remove("show");
    }
    if (elements.zahmaBadgeContainer) {
        elements.zahmaBadgeContainer.style.display = "none";
        elements.zahmaBadgeContainer.innerHTML = "";
        
        if (place.place_id) {
            fetch(`../Controller/api_zahma.php?action=get&place_id=${place.place_id}`)
                .then(r => r.json())
                .then(data => {
                    if (data.success && data.data && data.data.statut) {
                        const status = data.data.statut.toLowerCase();
                        let text = "🚀 Vide / Fluide";
                        let colorClass = "bg-success text-white";
                        let markerStatus = "fluide";
                        if (status === "lent") { 
                            text = "🐢 File d'attente"; 
                            colorClass = "bg-warning text-dark"; 
                            markerStatus = "lent";
                        } else if (status === "zahma") { 
                            text = "⛔ Zahma"; 
                            colorClass = "bg-danger text-white"; 
                            markerStatus = "zahma";
                        }
                        
                        const timeText = timeAgo(data.data.created_at);
                        
                        elements.zahmaBadgeContainer.innerHTML = `<span class="badge ${colorClass} py-2 px-3 shadow-sm" style="font-size: 13px; width: 100%; display: block; border-radius: 8px;">État actuel : ${text}<br><small>(Signalé ${timeText})</small></span>`;
                        elements.zahmaBadgeContainer.style.display = "block";
                        updateMarkerZahmaStatus(place.place_id, markerStatus);
                    }
                })
                .catch(e => console.error("Error fetching Zahma status:", e));
        }
    }

    if (elements.btnDeclareGarde) {
        // Store place_id in dataset so the click handler is always reliable
        elements.btnDeclareGarde.dataset.placeId  = place.place_id || "";
        elements.btnDeclareGarde.dataset.nomLieu  = place.name || "Lieu inconnu";
        elements.btnDeclareGarde.dataset.declared = "false";
        elements.btnDeclareGarde.style.display    = isNear ? "inline-flex" : "none";
        elements.btnDeclareGarde.style.background = "none";
        elements.btnDeclareGarde.style.color      = "#0dcaf0";
        elements.btnDeclareGarde.disabled         = false;
        elements.btnDeclareGarde.title            = "Déclarer ce lieu de garde";
    }
    if (elements.gardeBadge) {
        elements.gardeBadge.style.display = "none";
    }
    if (isNear && place.place_id) {
        checkGardeStatus(place.place_id, elements.btnDeclareGarde, elements.gardeBadge);
    }

    if (elements.panel) {
        showSidebar(elements.panel);
        elements.panel.scrollTop = 0;
    }

    if (elements.title) {
        elements.title.textContent = place.name || "Lieu";
    }

    if (elements.extended) {
        elements.extended.style.display = "none";
    }
    if (elements.infoButton) {
        elements.infoButton.textContent = "Afficher infos";
    }

    if (elements.address) {
        const addressSpan = elements.address.querySelector('span') || elements.address;
        addressSpan.textContent = place.formatted_address || "";
        elements.address.style.display = place.formatted_address ? "block" : "none";
    }

    if (elements.carousel && elements.carouselInner) {
        elements.carouselInner.innerHTML = "";
        if (place.photos && place.photos.length > 0) {
            place.photos.forEach((photo, index) => {
                const item = document.createElement("div");
                item.className = index === 0 ? "carousel-item active" : "carousel-item";
                const img = document.createElement("img");
                img.src = photo.getUrl({ maxWidth: 400 });
                img.alt = `Photo ${index + 1}`;
                item.appendChild(img);
                elements.carouselInner.appendChild(item);
            });
            elements.carousel.style.display = "block";
        } else {
            elements.carousel.style.display = "none";
        }
    } else if (elements.photo) {
        if (place.photos && place.photos.length > 0) {
            elements.photo.src = place.photos[0].getUrl({ maxWidth: 400 });
            elements.photo.style.display = "block";
        } else {
            elements.photo.removeAttribute("src");
            elements.photo.style.display = "none";
        }
    }

    if (elements.status) {
        const openStatus = getPlaceOpenStatus(place, true);
        const hasHours = !!openStatus;
        if (hasHours) {
            const isOpen = openStatus.isOpen;
            elements.status.textContent = isOpen ? "Ouvert" : "Fermé";
            elements.status.textContent = openStatus.label;
            elements.status.classList.toggle("status-open", isOpen);
            elements.status.classList.toggle("status-closed", !isOpen);
            elements.status.style.display = "inline-flex";
        } else {
            elements.status.textContent = "";
            elements.status.style.display = "none";
            elements.status.classList.remove("status-open", "status-closed");
        }
    }
    
    if (elements.hoursToday) {
        const hoursSpan = elements.hoursToday.querySelector('span');
        if (place.opening_hours && place.opening_hours.weekday_text) {
            const todayIndex = new Date().getDay();
            const gmapIndex = todayIndex === 0 ? 6 : todayIndex - 1;
            if (place.opening_hours.weekday_text[gmapIndex]) {
                const todayText = place.opening_hours.weekday_text[gmapIndex].split(': ').slice(1).join(': ');
                hoursSpan.textContent = todayText;
                elements.hoursToday.style.display = "block";
            } else {
                elements.hoursToday.style.display = "none";
            }
        } else {
            elements.hoursToday.style.display = "none";
        }
    }
    
    if (elements.phone) {
        const phoneSpan = elements.phone.querySelector('span');
        if (place.formatted_phone_number) {
            phoneSpan.textContent = place.formatted_phone_number;
            elements.phone.style.display = "block";
        } else {
            elements.phone.style.display = "none";
        }
    }

    if (elements.website) {
        if (place.website) {
            elements.website.innerHTML = `<a href="${escapeHtml(place.website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(place.website)}</a>`;
            elements.website.style.display = "block";
        } else {
            elements.website.style.display = "none";
        }
    }

    if (elements.hoursWeek) {
        elements.hoursWeek.innerHTML = "";
        if (place.opening_hours && place.opening_hours.weekday_text) {
            place.opening_hours.weekday_text.forEach(dayText => {
                const li = document.createElement("li");
                li.textContent = dayText;
                elements.hoursWeek.appendChild(li);
            });
        } else {
            elements.hoursWeek.innerHTML = "<li>Non disponible</li>";
        }
    }

    if (elements.routeButton) {
        if (place.geometry && place.geometry.location) {
            elements.routeButton.dataset.lat = place.geometry.location.lat();
            elements.routeButton.dataset.lng = place.geometry.location.lng();
            elements.routeButton.disabled = false;
        } else {
            elements.routeButton.dataset.lat = "";
            elements.routeButton.dataset.lng = "";
            elements.routeButton.disabled = true;
        }
    }

    if (elements.rating) {
        if (Number.isFinite(place.rating)) {
            elements.rating.innerHTML = buildRatingStars(place.rating);
        } else {
            elements.rating.textContent = "Aucune note";
        }
    }

    if (elements.reviews) {
        elements.reviews.innerHTML = "";
        if (Array.isArray(place.reviews) && place.reviews.length > 0) {
            place.reviews.forEach((review) => {
                const item = document.createElement("li");
                const author = document.createElement("div");
                author.className = "review-author";
                author.textContent = review.author_name || "Anonyme";
                const text = document.createElement("p");
                text.className = "review-text";
                text.textContent = review.text || "";
                item.appendChild(author);
                item.appendChild(text);
                elements.reviews.appendChild(item);
            });
        } else {
            const item = document.createElement("li");
            item.textContent = "Aucun avis recent.";
            elements.reviews.appendChild(item);
        }
    }

    elements.card.style.display = "block";
    
    if (elements.directionsPanel) {
        elements.directionsPanel.style.display = "none";
    }
    if (elements.resultsHeader) elements.resultsHeader.style.display = "flex";
    if (elements.resultsContent) elements.resultsContent.style.display = "block";
}

function fetchPlaceDetailsById(placeId, elements) {
    if (!placesService || !placeId) {
        return;
    }

    if (elements && elements.infoButton) {
        // Removing the 'Chargement...' logic here since we now just toggle UI
        // And placeDetails is pre-fetched on click.
        // Actually, we should keep it if we still call fetchPlaceDetailsById on click.
        // But wait, we call fetchPlaceDetailsById on list click now, not infoButton click.
    }

    placesService.getDetails(
        {
            placeId,
            fields: [
                "name",
                "formatted_address",
                "formatted_phone_number",
                "website",
                "rating",
                "reviews",
                "photos",
                "opening_hours",
                "geometry"
            ]
        },
        function (details, status) {
            if (status !== google.maps.places.PlacesServiceStatus.OK || !details) {
                return;
            }

            details.place_id = placeId;
            renderPlaceDetails(details, elements);
        }
    );
}

function hidePlaceDetails(elements) {
    if (elements && elements.card) {
        elements.card.style.display = "none";
    }
}

function focusPlaceOnMap(place, targetZoom) {
    if (!map || !place || !place.geometry || !place.geometry.location) {
        return;
    }

    map.panTo(place.geometry.location);
    if (typeof targetZoom === "number" && map.getZoom() < targetZoom) {
        map.setZoom(targetZoom);
    }
}

function buildRatingStars(rating) {
    const normalized = Math.max(0, Math.min(5, rating));
    const fullStars = Math.floor(normalized);
    const halfStar = normalized - fullStars >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    let stars = "";

    for (let i = 0; i < fullStars; i += 1) {
        stars += '<i class="bi bi-star-fill"></i>';
    }
    if (halfStar) {
        stars += '<i class="bi bi-star-half"></i>';
    }
    for (let i = 0; i < emptyStars; i += 1) {
        stars += '<i class="bi bi-star"></i>';
    }

    return `${stars}<span class="rating-value">${normalized.toFixed(1)}/5</span>`;
}

function buildPoiPopup(poi, typeLabel) {
    let popupContent = `
        <div dir="auto" style="text-align: start;">
            <h6 class="mb-1" style="font-weight: 700;">${escapeHtml(poi.nom_poi)}</h6>
            <span class="badge bg-secondary mb-2">${escapeHtml(typeLabel)}</span>
    `;

    if (poi.adresse_postale) {
        popupContent += `<p class="mt-1 mb-1" style="font-size: 13px;"><i class="bi bi-geo-alt"></i> ${escapeHtml(poi.adresse_postale)}</p>`;
    }
    if (poi.contact_tel) {
        popupContent += `<p class="mt-0 mb-1" style="font-size: 13px;"><i class="bi bi-telephone"></i> ${escapeHtml(poi.contact_tel)}</p>`;
    }
    if (poi.horaires_ouverture) {
        popupContent += `<p class="mt-0 mb-1" style="font-size: 13px;"><i class="bi bi-clock"></i> ${escapeHtml(poi.horaires_ouverture)}</p>`;
    }
    if (Number(poi.accessible_pmr) === 1) {
        popupContent += `<span class="badge bg-success mt-1"><i class="bi bi-person-wheelchair"></i> Accessible PMR</span>`;
    }

    popupContent += `
            <div class="mt-2 pt-2 border-top" style="font-size: 12px; color: #666;">
                <i class="bi bi-check-circle-fill text-success"></i> <em>POI certifié CivicPlus</em>
            </div>
        </div>
    `;

    return popupContent;
}

function getPoiMarkerStyle(category) {
    const meta = getCategoryMeta(category);
    return { color: meta.color, label: meta.label };

    switch (category) {
        case "administration":
            return { color: "#ff9f1a", label: "Administration" };
        case "sante":
            return { color: "#ff4d4f", label: "Santé" };
        case "transport":
            return { color: "#2ed573", label: "Transport" };
        case "education":
            return { color: "#8e44ad", label: "Éducation" };
        default:
            return { color: "#8395a7", label: "Inconnu" };
    }
}

function updateUserLocation(latLng, accuracy) {
    userLatLng = latLng;

    if (userMarker) {
        userMarker.setMap(null);
    }
    if (userCircle) {
        userCircle.setMap(null);
    }

    if (Number.isFinite(accuracy)) {
        userCircle = new google.maps.Circle({
            map,
            center: userLatLng,
            radius: accuracy,
            strokeColor: "#112f8d",
            strokeOpacity: 0.6,
            strokeWeight: 1,
            fillColor: "#112f8d",
            fillOpacity: 0.12
        });
    }

    userMarker = new google.maps.Marker({
        map,
        position: userLatLng,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#007bff",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3
        }
    });

    updateGeoInsights();
    renderLocalSummary();
}

function clearMarkers(markers) {
    markers.forEach((marker) => {
        if (marker && typeof marker.setMap === "function") {
            marker.setMap(null);
            return;
        }
        if (marker) {
            marker.map = null;
        }
    });
    markers.length = 0;
}

function formatDistance(distanceInMeters) {
    if (distanceInMeters == null || isNaN(distanceInMeters)) return "";
    return distanceInMeters >= 1000
        ? (distanceInMeters / 1000).toFixed(1) + " km"
        : Math.round(distanceInMeters) + " m";
}



function updateMarkerZahmaStatus(placeId, status) {
    let color = "#fd7e14"; // Default
    let scale = 6;
    if (status === "fluide") { color = "#198754"; scale = 8; }
    else if (status === "lent") { color = "#ffc107"; scale = 8; }
    else if (status === "zahma" || status === "bloque") { color = "#dc3545"; scale = 10; }

    const updateMarker = (marker) => {
        if (marker.placeId === placeId) {
            if (marker.getIcon && marker.getIcon().path === google.maps.SymbolPath.CIRCLE) {
                const currentIcon = marker.getIcon();
                currentIcon.fillColor = color;
                currentIcon.scale = scale;
                marker.setIcon(currentIcon);
                marker.setZIndex(999);
            }
        }
    };

    searchMarkers.forEach(updateMarker);
    
    if (autocompleteMarker && currentPlaceForZahma && autocompleteMarker.getPosition() && currentPlaceForZahma.geometry.location.equals(autocompleteMarker.getPosition())) {
        const currentIcon = autocompleteMarker.getIcon();
        if (currentIcon && currentIcon.path) {
            currentIcon.fillColor = color;
            currentIcon.scale = scale;
            autocompleteMarker.setIcon(currentIcon);
            autocompleteMarker.setZIndex(999);
        }
    }
}

function buildGoogleMapsUrl(apiKey) {
    const encodedKey = encodeURIComponent(apiKey);
    return `https://maps.googleapis.com/maps/api/js?key=${encodedKey}&libraries=places,geometry,marker&callback=initMap`;
}

function loadGoogleMapsScript(apiKey) {
    if (!apiKey) {
        console.error("Google Maps API key manquante.");
        return;
    }

    if (window.google && window.google.maps) {
        initMap();
        return;
    }

    if (document.querySelector('script[data-google-maps="true"]')) {
        return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.src = buildGoogleMapsUrl(apiKey);
    document.body.appendChild(script);
}

function bootstrapGoogleMaps() {
    fetch("../config/services.php")
        .then((response) => response.json())
        .then((config) => {
            const apiKey = (config && config.googleMapsApiKey) ? String(config.googleMapsApiKey).trim() : "";
            loadGoogleMapsScript(apiKey);
        })
        .catch(() => {
            console.error("Impossible de charger la configuration Google Maps.");
        });
}

window.initMap = initMap;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapGoogleMaps);
} else {
    bootstrapGoogleMaps();
}

// =============================================
// MODULE GARDES — connecté à la BD
// =============================================

function timeAgoShort(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString.replace(/-/g, "/"));
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60)  return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff/60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff/3600)} h`;
    return `il y a ${Math.floor(diff/86400)} j`;
}

function renderGardeList(data) {
    const list    = document.getElementById("garde-list");
    const counter = document.getElementById("garde-count-badge");
    const loading = document.getElementById("garde-loading");

    if (loading) loading.style.display = "none";
    if (!list) return;

    list.innerHTML = "";

    if (!data || data.length === 0) {
        if (counter) counter.textContent = "0 lieu signalé";
        list.innerHTML = `<li class="garde-empty"><i class="bi bi-shield-check" aria-hidden="true"></i><br>Aucun service de garde signalé pour le moment.<br><span style="font-size:11px;color:#475569;">Soyez le premier à déclarer un lieu !</span></li>`;
        return;
    }

    if (counter) counter.textContent = `${data.length} lieu${data.length > 1 ? "x" : ""} signalé${data.length > 1 ? "s" : ""}`;

    data.forEach(lieu => {
        const li = document.createElement("li");
        li.className = "garde-item";
        li.innerHTML = `
            <div class="garde-name">🏥 ${lieu.nom_lieu}</div>
            <div class="garde-verified">✅ Vérifié par la communauté — <span style="color:#94a3b8;">${timeAgoShort(lieu.created_at)}</span></div>
        `;
        list.appendChild(li);
    });
}

function loadGardeList() {
    const loading = document.getElementById("garde-loading");
    const list    = document.getElementById("garde-list");
    if (loading) loading.style.display = "block";
    if (list)    list.innerHTML = "";

    fetch('../Controller/api_garde.php?action=getAll')
        .then(r => r.json())
        .then(data => {
            if (data.success) renderGardeList(data.data);
            else renderGardeList([]);
        })
        .catch(() => renderGardeList([]));
}

function bindGardeUI() {
    // ── Sidebar toggle only — declare listener is in initPlaceDetailsCard ───
    const sidebar   = document.getElementById("garde-sidebar");
    const btnToggle = document.getElementById("btn-toggle-garde");
    const btnClose  = document.getElementById("btn-close-garde");

    if (btnToggle && sidebar) {
        btnToggle.addEventListener("click", () => {
            sidebar.classList.toggle("open");
            if (sidebar.classList.contains("open")) loadGardeList();
        });
    }

    if (btnClose && sidebar) {
        btnClose.addEventListener("click", () => sidebar.classList.remove("open"));
    }
}

// Check garde status when opening a POI and restore icon state
function checkGardeStatus(place_id, btnDeclare, gardeBadge) {
    if (!place_id) return;
    fetch(`../Controller/api_garde.php?action=check&place_id=${encodeURIComponent(place_id)}`)
        .then(r => r.json())
        .then(data => {
            if (data.success && data.declared) {
                if (gardeBadge) gardeBadge.style.display = "inline";
                if (btnDeclare) {
                    btnDeclare.dataset.declared = "true";
                    btnDeclare.style.background = "#0dcaf0";
                    btnDeclare.style.color      = "#fff";
                    btnDeclare.title            = "Retirer la déclaration de garde";
                    btnDeclare.disabled         = false; // always clickable (toggle)
                }
            }
        })
        .catch(() => {});
}
