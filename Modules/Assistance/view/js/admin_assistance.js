(function () {
  "use strict";

  const controllerUrl = new URL("../Controller/AssistanceController.php", window.location.href);
  const ticketBody = document.getElementById("admin-assistance-ticket-body");
  const robotBody = document.getElementById("admin-assistance-robot-body");
  const refreshButton = document.getElementById("admin-assistance-refresh");
  const openCount = document.getElementById("assistance-open-count");
  const flaggedCount = document.getElementById("assistance-flagged-count");
  const robotCount = document.getElementById("assistance-robot-count");

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char];
    });
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
  }

  function userLabel(row) {
    const name = [row.prenom, row.nom].filter(Boolean).join(" ").trim();
    return [
      '<strong>' + escapeHtml(name || "Utilisateur") + "</strong>",
      '<div class="text-muted small">CIN: ' + escapeHtml(row.num_cin || "-") + "</div>",
      row.email ? '<div class="text-muted small">' + escapeHtml(row.email) + "</div>" : ""
    ].join("");
  }

  function setCounts(counts) {
    openCount.textContent = counts.open_human || 0;
    flaggedCount.textContent = counts.flagged || 0;
    robotCount.textContent = counts.robot_chats || 0;
  }

  function emptyRow(colspan, text) {
    return '<tr><td colspan="' + colspan + '" class="text-center text-muted py-4">' + escapeHtml(text) + "</td></tr>";
  }

  function renderTickets(tickets) {
    if (!tickets.length) {
      ticketBody.innerHTML = emptyRow(5, "Aucune demande humaine.");
      return;
    }

    ticketBody.innerHTML = tickets.map((ticket) => [
      '<tr data-ticket-id="' + escapeHtml(ticket.id_ticket) + '">',
      "<td>" + userLabel(ticket) + "</td>",
      "<td>",
      '<strong>#' + escapeHtml(ticket.id_ticket) + " - " + escapeHtml(ticket.sujet) + "</strong>",
      '<div class="text-muted small">' + escapeHtml(ticket.categorie) + " - " + escapeHtml(formatDate(ticket.date_creation)) + "</div>",
      '<div class="small mt-1">' + escapeHtml(ticket.description) + "</div>",
      "</td>",
      "<td>",
      '<select class="form-select form-select-sm assistance-admin-status">',
      option("ouvert", ticket.statut, "Ouvert"),
      option("en_cours", ticket.statut, "En cours"),
      option("resolu", ticket.statut, "Resolu"),
      option("ferme", ticket.statut, "Ferme"),
      "</select>",
      '<select class="form-select form-select-sm mt-2 assistance-admin-moderation">',
      option("fine", ticket.moderation, "Fine"),
      option("flagged", ticket.moderation, "Flag"),
      option("banned", ticket.moderation, "Ban"),
      option("deleted", ticket.moderation, "Supprimer"),
      "</select>",
      "</td>",
      '<td><textarea class="form-control form-control-sm assistance-admin-reply" rows="4" placeholder="Reponse visible par le citoyen">' + escapeHtml(ticket.admin_reponse || "") + "</textarea></td>",
      '<td><button type="button" class="btn btn-sm btn-success assistance-admin-save"><i class="bi bi-check2 me-1"></i>Valider</button></td>',
      "</tr>"
    ].join("")).join("");
  }

  function option(value, current, label) {
    return '<option value="' + value + '"' + (value === current ? " selected" : "") + ">" + label + "</option>";
  }

  function renderRobotChats(chats) {
    if (!chats.length) {
      robotBody.innerHTML = emptyRow(5, "Aucun chat robot.");
      return;
    }

    robotBody.innerHTML = chats.map((chat) => [
      "<tr>",
      "<td>" + userLabel(chat) + "</td>",
      '<td class="small">' + escapeHtml(chat.message_utilisateur) + "</td>",
      '<td class="small">' + escapeHtml(chat.reponse_robot) + "</td>",
      "<td>" + escapeHtml(chat.source_reponse) + "</td>",
      "<td>" + escapeHtml(formatDate(chat.date_creation)) + "</td>",
      "</tr>"
    ].join("")).join("");
  }

  async function request(action, options) {
    const url = new URL(controllerUrl.href);
    url.searchParams.set("action", action);
    const response = await fetch(url.href, Object.assign({ credentials: "same-origin" }, options || {}));
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Erreur assistance.");
    }
    return data;
  }

  async function loadAll() {
    ticketBody.innerHTML = emptyRow(5, "Chargement...");
    robotBody.innerHTML = emptyRow(5, "Chargement...");

    try {
      const [tickets, robots] = await Promise.all([
        request("adminTickets"),
        request("adminRobot")
      ]);

      setCounts(tickets.counts || robots.counts || {});
      renderTickets(tickets.tickets || []);
      renderRobotChats(robots.chats || []);
    } catch (error) {
      ticketBody.innerHTML = emptyRow(5, error.message);
      robotBody.innerHTML = emptyRow(5, error.message);
    }
  }

  async function saveTicket(row) {
    const id = row.getAttribute("data-ticket-id");
    const button = row.querySelector(".assistance-admin-save");
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Envoi';

    try {
      await request("updateTicket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({
          id_ticket: id,
          statut: row.querySelector(".assistance-admin-status").value,
          moderation: row.querySelector(".assistance-admin-moderation").value,
          admin_reponse: row.querySelector(".assistance-admin-reply").value
        })
      });
      await loadAll();
    } catch (error) {
      alert(error.message);
      button.disabled = false;
      button.innerHTML = '<i class="bi bi-check2 me-1"></i>Valider';
    }
  }

  ticketBody.addEventListener("click", (event) => {
    const button = event.target.closest(".assistance-admin-save");
    if (!button) return;
    const row = button.closest("tr[data-ticket-id]");
    if (row) saveTicket(row);
  });

  if (refreshButton) {
    refreshButton.addEventListener("click", loadAll);
  }

  loadAll();
})();
