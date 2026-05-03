const API_URL = "../../Controller/TransportNetworkController.php";

const state = {
  lines: [],
  stations: [],
  routes: [],
  options: {
    lignes: [],
    stations: [],
    types: []
  }
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  loadAll();
});

function bindEvents() {
  document.getElementById("lineForm").addEventListener("submit", saveLine);
  document.getElementById("stationForm").addEventListener("submit", saveStation);
  document.getElementById("routeForm").addEventListener("submit", saveRoute);

  document.getElementById("resetLineForm").addEventListener("click", resetLineForm);
  document.getElementById("resetStationForm").addEventListener("click", resetStationForm);
  document.getElementById("resetRouteForm").addEventListener("click", resetRouteForm);

  document.getElementById("lineSearchBtn").addEventListener("click", loadLines);
  document.getElementById("stationSearchBtn").addEventListener("click", loadStations);
  document.getElementById("routeSearchBtn").addEventListener("click", loadRoutes);

  document.getElementById("lineTypeFilter").addEventListener("change", loadLines);
  document.getElementById("routeLineFilter").addEventListener("change", loadRoutes);

  ["lineSearch", "stationSearch", "routeSearch"].forEach((id) => {
    document.getElementById(id).addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        if (id === "lineSearch") loadLines();
        if (id === "stationSearch") loadStations();
        if (id === "routeSearch") loadRoutes();
      }
    });
  });

  document.getElementById("linesTableBody").addEventListener("click", handleLineAction);
  document.getElementById("stationsTableBody").addEventListener("click", handleStationAction);
  document.getElementById("routesTableBody").addEventListener("click", handleRouteAction);
}

async function loadAll() {
  await Promise.all([loadStats(), loadOptions()]);
  await Promise.all([loadLines(), loadStations(), loadRoutes()]);
}

async function apiRequest(action, params = {}, method = "GET") {
  const options = { method };
  let url = `${API_URL}?action=${encodeURIComponent(action)}`;

  if (method === "GET") {
    const query = new URLSearchParams(params);
    const suffix = query.toString();
    if (suffix) url += `&${suffix}`;
  } else {
    options.headers = { "Content-Type": "application/x-www-form-urlencoded" };
    options.body = new URLSearchParams(params).toString();
  }

  const response = await fetch(url, options);
  const rawText = await response.text();
  let result;

  try {
    result = JSON.parse(rawText);
  } catch (error) {
    throw new Error(`Reponse PHP invalide: ${rawText}`);
  }

  if (!result.success) {
    throw new Error(result.message || "Operation impossible.");
  }

  return result;
}

async function loadStats() {
  const result = await apiRequest("stats");
  const stats = result.data || {};

  setText("statLines", stats.total_lignes ?? 0);
  setText("statStations", stats.total_stations ?? 0);
  setText("statRoutes", stats.total_parcours ?? 0);
  setText("statTypes", stats.total_types ?? 0);
  renderTypeStrip(stats.par_type || []);
}

async function loadOptions() {
  const result = await apiRequest("options");
  state.options = result.data || state.options;
  populateTransportTypes();
  populateLineSelects();
  populateStationSelects();
}

async function loadLines() {
  const result = await apiRequest("listLines", {
    search: document.getElementById("lineSearch").value.trim(),
    type: document.getElementById("lineTypeFilter").value
  });

  state.lines = result.data || [];
  renderLines();
}

async function loadStations() {
  const result = await apiRequest("listStations", {
    search: document.getElementById("stationSearch").value.trim()
  });

  state.stations = result.data || [];
  renderStations();
}

async function loadRoutes() {
  const result = await apiRequest("listParcours", {
    search: document.getElementById("routeSearch").value.trim(),
    id_ligne: document.getElementById("routeLineFilter").value
  });

  state.routes = result.data || [];
  renderRoutes();
}

async function saveLine(event) {
  event.preventDefault();

  try {
    const result = await apiRequest("saveLine", formValues("lineForm"), "POST");
    showMessage(result.message || "Ligne enregistree.", "success");
    resetLineForm();
    await reloadNetwork();
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

async function saveStation(event) {
  event.preventDefault();

  try {
    const result = await apiRequest("saveStation", formValues("stationForm"), "POST");
    showMessage(result.message || "Station enregistree.", "success");
    resetStationForm();
    await reloadNetwork();
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

async function saveRoute(event) {
  event.preventDefault();

  const data = formValues("routeForm");
  data.create_reverse = document.getElementById("createReverseRoute").checked ? "1" : "0";

  try {
    const result = await apiRequest("saveParcours", data, "POST");
    showMessage(result.message || "Parcours enregistre.", "success");
    resetRouteForm();
    await reloadNetwork();
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

async function reloadNetwork() {
  await Promise.all([loadStats(), loadOptions()]);
  await Promise.all([loadLines(), loadStations(), loadRoutes()]);
}

function renderLines() {
  const tbody = document.getElementById("linesTableBody");

  if (!state.lines.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Aucune ligne trouvee.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.lines.map((line) => `
    <tr>
      <td class="fw-bold">#${line.id_ligne}</td>
      <td class="text-wrap-cell">${escapeHtml(line.nom_ligne)}</td>
      <td><span class="badge-soft">${escapeHtml(line.type_transport || "Non defini")}</span></td>
      <td>${line.total_parcours ?? 0}</td>
      <td>${line.max_stations ?? 0}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-sm btn-outline-warning" data-action="edit-line" data-id="${line.id_ligne}" title="Modifier">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete-line" data-id="${line.id_ligne}" title="Supprimer">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderStations() {
  const tbody = document.getElementById("stationsTableBody");

  if (!state.stations.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">Aucune station trouvee.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.stations.map((station) => `
    <tr>
      <td class="fw-bold">#${station.id_station}</td>
      <td class="text-wrap-cell">${escapeHtml(station.nom_station)}</td>
      <td>${formatNumber(station.latitude)}</td>
      <td>${formatNumber(station.longitude)}</td>
      <td>${station.total_depart ?? 0}</td>
      <td>${station.total_arrivee ?? 0}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-sm btn-outline-warning" data-action="edit-station" data-id="${station.id_station}" title="Modifier">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete-station" data-id="${station.id_station}" title="Supprimer">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderRoutes() {
  const tbody = document.getElementById("routesTableBody");

  if (!state.routes.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Aucun parcours trouve.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.routes.map((route) => `
    <tr>
      <td class="fw-bold">${escapeHtml(route.nom_ligne)}</td>
      <td><span class="badge-soft">${escapeHtml(route.type_transport || "Non defini")}</span></td>
      <td class="text-wrap-cell">${escapeHtml(route.station_depart)}</td>
      <td class="text-wrap-cell">${escapeHtml(route.station_arrivee)}</td>
      <td>${route.ordre_passage ?? 0}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-sm btn-outline-warning" data-action="edit-route" data-line="${route.id_ligne}" data-station="${route.id_station}" title="Modifier">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete-route" data-line="${route.id_ligne}" data-station="${route.id_station}" title="Supprimer">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderTypeStrip(types) {
  const wrap = document.getElementById("typeStrip");

  if (!types.length) {
    wrap.innerHTML = "";
    return;
  }

  wrap.innerHTML = types.map((item) => `
    <span class="type-pill">${escapeHtml(item.type_transport)}: ${item.total}</span>
  `).join("");
}

function populateTransportTypes() {
  const defaults = ["Metro", "Train", "TGM", "Bus"];
  const types = [...new Set([...defaults, ...(state.options.types || [])].filter(Boolean))];
  const datalist = document.getElementById("transportTypeOptions");
  const filter = document.getElementById("lineTypeFilter");

  datalist.innerHTML = types.map((type) => `<option value="${escapeHtml(type)}"></option>`).join("");
  filter.innerHTML = `<option value="">Tous les types</option>` + types
    .map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`)
    .join("");
}

function populateLineSelects() {
  const lines = state.options.lignes || [];
  const options = lines.map((line) => {
    const label = `${line.nom_ligne}${line.type_transport ? ` - ${line.type_transport}` : ""}`;
    return `<option value="${line.id_ligne}">${escapeHtml(label)}</option>`;
  }).join("");

  document.getElementById("routeLine").innerHTML = `<option value="">Selectionner une ligne</option>${options}`;
  document.getElementById("routeLineFilter").innerHTML = `<option value="">Toutes les lignes</option>${options}`;
}

function populateStationSelects() {
  const stations = state.options.stations || [];
  const options = stations.map((station) => (
    `<option value="${station.id_station}">${escapeHtml(station.nom_station)}</option>`
  )).join("");

  document.getElementById("routeDeparture").innerHTML = `<option value="">Premiere station</option>${options}`;
  document.getElementById("routeArrival").innerHTML = `<option value="">Derniere station</option>${options}`;
}

async function handleLineAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = parseInt(button.dataset.id, 10);
  const line = state.lines.find((item) => parseInt(item.id_ligne, 10) === id);

  if (button.dataset.action === "edit-line" && line) {
    document.getElementById("lineFormTitle").textContent = "Modifier la ligne";
    document.getElementById("lineId").value = line.id_ligne;
    document.getElementById("lineName").value = line.nom_ligne || "";
    document.getElementById("lineType").value = line.type_transport || "";
    document.getElementById("lineName").focus();
  }

  if (button.dataset.action === "delete-line") {
    if (!confirm("Supprimer cette ligne ? Les parcours relies seront supprimes si possible.")) return;

    try {
      const result = await apiRequest("deleteLine", { id_ligne: id }, "POST");
      showMessage(result.message || "Ligne supprimee.", "success");
      await reloadNetwork();
    } catch (error) {
      showMessage(error.message, "danger");
    }
  }
}

async function handleStationAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = parseInt(button.dataset.id, 10);
  const station = state.stations.find((item) => parseInt(item.id_station, 10) === id);

  if (button.dataset.action === "edit-station" && station) {
    document.getElementById("stationFormTitle").textContent = "Modifier la station";
    document.getElementById("stationId").value = station.id_station;
    document.getElementById("stationName").value = station.nom_station || "";
    document.getElementById("stationLatitude").value = station.latitude || "";
    document.getElementById("stationLongitude").value = station.longitude || "";
    document.getElementById("stationName").focus();
  }

  if (button.dataset.action === "delete-station") {
    if (!confirm("Supprimer cette station ? Verifiez qu'elle n'est pas utilisee dans un parcours.")) return;

    try {
      const result = await apiRequest("deleteStation", { id_station: id }, "POST");
      showMessage(result.message || "Station supprimee.", "success");
      await reloadNetwork();
    } catch (error) {
      showMessage(error.message, "danger");
    }
  }
}

async function handleRouteAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const lineId = parseInt(button.dataset.line, 10);
  const stationId = parseInt(button.dataset.station, 10);
  const route = state.routes.find((item) => (
    parseInt(item.id_ligne, 10) === lineId && parseInt(item.id_station, 10) === stationId
  ));

  if (button.dataset.action === "edit-route" && route) {
    document.getElementById("routeFormTitle").textContent = "Modifier le parcours";
    document.getElementById("routeOriginalLine").value = route.id_ligne;
    document.getElementById("routeOriginalStation").value = route.id_station;
    document.getElementById("routeLine").value = route.id_ligne;
    document.getElementById("routeDeparture").value = route.id_station;
    document.getElementById("routeArrival").value = route.id_der_station;
    document.getElementById("routeOrder").value = route.ordre_passage || "";
    document.getElementById("reverseRouteWrap").classList.add("d-none");
    document.getElementById("createReverseRoute").checked = false;
    document.getElementById("routeLine").focus();
  }

  if (button.dataset.action === "delete-route") {
    if (!confirm("Supprimer ce parcours ?")) return;

    try {
      const result = await apiRequest("deleteParcours", { id_ligne: lineId, id_station: stationId }, "POST");
      showMessage(result.message || "Parcours supprime.", "success");
      await reloadNetwork();
    } catch (error) {
      showMessage(error.message, "danger");
    }
  }
}

function resetLineForm() {
  document.getElementById("lineForm").reset();
  document.getElementById("lineId").value = "";
  document.getElementById("lineFormTitle").textContent = "Ajouter une ligne";
}

function resetStationForm() {
  document.getElementById("stationForm").reset();
  document.getElementById("stationId").value = "";
  document.getElementById("stationFormTitle").textContent = "Ajouter une station";
}

function resetRouteForm() {
  document.getElementById("routeForm").reset();
  document.getElementById("routeOriginalLine").value = "";
  document.getElementById("routeOriginalStation").value = "";
  document.getElementById("routeFormTitle").textContent = "Ajouter un parcours";
  document.getElementById("reverseRouteWrap").classList.remove("d-none");
  document.getElementById("createReverseRoute").checked = true;
}

function formValues(formId) {
  const form = document.getElementById(formId);
  const data = {};

  new FormData(form).forEach((value, key) => {
    data[key] = value;
  });

  return data;
}

function showMessage(message, type = "success") {
  const area = document.getElementById("messageArea");
  area.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show mt-3" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
    </div>
  `;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(5) : "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
