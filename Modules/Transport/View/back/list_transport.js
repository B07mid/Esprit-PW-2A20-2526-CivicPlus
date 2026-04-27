const API_URL = "../../Controller/SignalementTransportBackController.php";

document.addEventListener("DOMContentLoaded", () => {
  loadSignalements();
  loadStats();
  bindFilters();
});

function bindFilters() {
  const searchInput = document.getElementById("searchId");
  const statutSelect = document.getElementById("filterStatut");
  const prioriteSelect = document.getElementById("filterPriorite");
  const btnFilter = document.getElementById("btnFilter");

  if (btnFilter) {
    btnFilter.addEventListener("click", () => {
      loadSignalements();
      loadStats();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        loadSignalements();
        loadStats();
      }
    });
  }

  const form = document.getElementById("editTransportForm");
  if (form) {
    form.addEventListener("submit", submitEditForm);
  }
}

async function loadSignalements() {
  try {
    const searchId = document.getElementById("searchId")?.value.trim() || "";
    const statut = document.getElementById("filterStatut")?.value || "";
    const priorite = document.getElementById("filterPriorite")?.value || "";

    const url = `${API_URL}?action=list&search_id=${encodeURIComponent(searchId)}&statut=${encodeURIComponent(statut)}&priorite=${encodeURIComponent(priorite)}`;
    const response = await fetch(url);
    const text = await response.text();
console.log(text);
const result = JSON.parse(text);

    const tbody = document.getElementById("transportTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!result.success || !result.data || result.data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4">Aucun signalement trouvé.</td>
        </tr>
      `;
      return;
    }

    result.data.forEach(item => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td class="issue-ref">TR-${String(item.id_signalement_tr).padStart(3, "0")}</td>
        <td>${escapeHtml(item.type_transport || "Métro")}</td>
        <td>${escapeHtml(item.type_probleme || "")}</td>
        <td>${escapeHtml(item.localisation || "Tunis")}</td>
        <td>${formatDateFr(item.date_signalement)}</td>
        <td>${getStatusBadge(item.pris_en_compte_ia)}</td>
        <td>${getPriorityBadge(item.priorite_label)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-outline-primary" onclick="viewItem(${item.id_signalement_tr})" title="Voir">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-warning" onclick="openEditModal(${item.id_signalement_tr})" title="Modifier">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteItem(${item.id_signalement_tr})" title="Supprimer">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error(error);
  }
}

async function loadStats() {
  try {
    const response = await fetch(`${API_URL}?action=stats`);
    const text = await response.text();
console.log(text);
const result = JSON.parse(text);

    if (!result.success) return;

    const stats = result.data;

    setText("statTotal", stats.total_incidents ?? 0);
    setText("statPending", stats.en_attente ?? 0);
    setText("statHigh", stats.haute_priorite ?? 0);
    setText("statResolved", stats.resolus ?? 0);
  } catch (error) {
    console.error(error);
  }
}

async function deleteItem(id) {
  const ok = confirm("Voulez-vous vraiment supprimer ce signalement ?");
  if (!ok) return;

  try {
    const response = await fetch(`${API_URL}?action=delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `id=${encodeURIComponent(id)}`
    });

    const text = await response.text();
console.log(text);
const result = JSON.parse(text);

    if (result.success) {
      loadSignalements();
      loadStats();
    } else {
      alert("Suppression échouée.");
    }
  } catch (error) {
    console.error(error);
    alert("Erreur lors de la suppression.");
  }
}

async function viewItem(id) {
  try {
    const response = await fetch(`${API_URL}?action=getOne&id=${id}`);
    const text = await response.text();
    console.log(text);

    const result = JSON.parse(text);

    if (!result.success || !result.data) {
      alert("Signalement introuvable.");
      return;
    }

    const item = result.data;

alert(
  `Signalement #${item.id_signalement_tr}\n\n` +
  `CIN : ${item.num_cin}\n` +
  `Nom : ${item.nom}\n` +
  `Prénom : ${item.prenom}\n` +
  `Description : ${item.description || ""}`
);
  } catch (error) {
    console.error(error);
    alert("Erreur lors de l'affichage du signalement.");
  }
}
async function openEditModal(id) {
  try {
    const response = await fetch(`${API_URL}?action=getOne&id=${id}`);
    const text = await response.text();
console.log(text);
const result = JSON.parse(text);

    if (!result.success || !result.data) {
      alert("Signalement introuvable.");
      return;
    }

    const item = result.data;

    document.getElementById("edit_id_signalement").value = item.id_signalement_tr;
    document.getElementById("edit_type_probleme").value = item.type_probleme || "";
    document.getElementById("edit_description").value = item.description || "";
    document.getElementById("edit_pris_en_compte_ia").value = item.pris_en_compte_ia;

    const modal = new bootstrap.Modal(document.getElementById("editTransportModal"));
    modal.show();
  } catch (error) {
    console.error(error);
  }
}

async function submitEditForm(e) {
  e.preventDefault();

  const id = document.getElementById("edit_id_signalement").value;
  const typeProbleme = document.getElementById("edit_type_probleme").value;
  const description = document.getElementById("edit_description").value;
  const statut = document.getElementById("edit_pris_en_compte_ia").value;

  try {
    const response = await fetch(`${API_URL}?action=update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `id_signalement=${encodeURIComponent(id)}&type_probleme=${encodeURIComponent(typeProbleme)}&description=${encodeURIComponent(description)}&pris_en_compte_ia=${encodeURIComponent(statut)}`
    });

    const text = await response.text();
console.log(text);
const result = JSON.parse(text);

    if (result.success) {
      const modalEl = document.getElementById("editTransportModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      loadSignalements();
      loadStats();
    } else {
      alert("Modification échouée.");
    }
  } catch (error) {
    console.error(error);
    alert("Erreur lors de la modification.");
  }
}

function getStatusBadge(value) {
  if (parseInt(value, 10) === 0) {
    return `<span class="badge-soft badge-status-open">En attente</span>`;
  }
  if (parseInt(value, 10) === 1) {
    return `<span class="badge-soft badge-status-closed">Résolu</span>`;
  }
  if (parseInt(value, 10) === 2) {
    return `<span class="badge-soft badge-status-progress">En cours</span>`;
  }
  return `<span class="badge-soft bg-secondary">Inconnu</span>`;
}

function getPriorityBadge(label) {
  if (label === "Haute") {
    return `<span class="badge-soft badge-priority-high">Haute</span>`;
  }
  return `<span class="badge-soft badge-priority-low">Faible</span>`;
}

function formatDateFr(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("fr-FR");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
