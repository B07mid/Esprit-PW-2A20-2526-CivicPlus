(function () {
  "use strict";

  const controllerUrl = new URL("../Controller/AssistanceController.php", window.location.href);
  const form = document.getElementById("assistance-ticket-form");
  const subject = document.getElementById("assistance-subject");
  const category = document.getElementById("assistance-category");
  const description = document.getElementById("assistance-description");
  const formMessage = document.getElementById("assistance-form-message");
  const ticketHistory = document.getElementById("assistance-ticket-history");
  const robotHistory = document.getElementById("assistance-robot-history");
  const refreshButton = document.getElementById("assistance-refresh");
  const humanPanel = document.getElementById("human-assistance-panel");

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

  function badgeClass(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9_-]/g, "");
  }

  function emptyState(text) {
    return '<div class="assistance-history-empty">' + escapeHtml(text) + "</div>";
  }

  function renderTickets(tickets) {
    if (!tickets.length) {
      ticketHistory.innerHTML = emptyState("Aucune demande humaine pour le moment.");
      return;
    }

    ticketHistory.innerHTML = tickets.map((ticket) => {
      const reply = ticket.admin_reponse
        ? '<div class="assistance-reply"><strong>Reponse administration</strong><p>' + escapeHtml(ticket.admin_reponse) + "</p></div>"
        : '<div class="assistance-reply"><strong>En attente</strong><p>Un administrateur n a pas encore repondu.</p></div>';

      return [
        '<article class="assistance-ticket">',
        '<div class="assistance-ticket-top">',
        '<div><h3>#' + escapeHtml(ticket.id_ticket) + " - " + escapeHtml(ticket.sujet) + "</h3>",
        '<p>' + escapeHtml(ticket.description) + "</p></div>",
        '<span class="assistance-badge ' + badgeClass(ticket.statut) + '">' + escapeHtml(ticket.statut) + "</span>",
        "</div>",
        reply,
        '<div class="assistance-meta">',
        '<span class="assistance-badge">' + escapeHtml(ticket.categorie) + "</span>",
        '<span class="assistance-badge ' + badgeClass(ticket.moderation) + '">' + escapeHtml(ticket.moderation) + "</span>",
        '<span class="assistance-badge">' + escapeHtml(formatDate(ticket.date_creation)) + "</span>",
        "</div>",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderRobotChats(chats) {
    if (!chats.length) {
      robotHistory.innerHTML = emptyState("Aucune conversation CivicBot enregistree pour le moment.");
      return;
    }

    robotHistory.innerHTML = chats.map((chat) => [
      '<article class="assistance-ticket">',
      '<div class="assistance-ticket-top">',
      '<div><h3>CivicBot</h3><p>' + escapeHtml(chat.message_utilisateur) + "</p></div>",
      '<span class="assistance-badge">' + escapeHtml(chat.source_reponse) + "</span>",
      "</div>",
      '<div class="assistance-reply"><strong>Reponse robot</strong><p>' + escapeHtml(chat.reponse_robot) + "</p></div>",
      '<div class="assistance-meta"><span class="assistance-badge">' + escapeHtml(formatDate(chat.date_creation)) + "</span></div>",
      "</article>"
    ].join("")).join("");
  }

  async function loadHistory() {
    ticketHistory.innerHTML = emptyState("Chargement de votre historique...");
    robotHistory.innerHTML = emptyState("Chargement de vos conversations...");

    try {
      const url = new URL(controllerUrl.href);
      url.searchParams.set("action", "mine");
      const response = await fetch(url.href, { credentials: "same-origin" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        const message = data.message || "Impossible de charger l historique.";
        ticketHistory.innerHTML = emptyState(message);
        robotHistory.innerHTML = emptyState(message);
        return;
      }

      renderTickets(data.tickets || []);
      renderRobotChats(data.robotChats || []);
    } catch (error) {
      ticketHistory.innerHTML = emptyState("Connexion impossible. Verifiez XAMPP puis reessayez.");
      robotHistory.innerHTML = emptyState("Connexion impossible. Verifiez XAMPP puis reessayez.");
    }
  }

  async function createTicket(event) {
    event.preventDefault();
    formMessage.textContent = "Envoi en cours...";

    const url = new URL(controllerUrl.href);
    url.searchParams.set("action", "createTicket");

    try {
      const response = await fetch(url.href, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({
          sujet: subject.value,
          categorie: category.value,
          description: description.value
        })
      });
      const data = await response.json();

      formMessage.textContent = data.message || (data.success ? "Demande envoyee." : "Erreur.");

      if (response.ok && data.success) {
        form.reset();
        loadHistory();
      }
    } catch (error) {
      formMessage.textContent = "Connexion impossible. Verifiez XAMPP puis reessayez.";
    }
  }

  document.querySelectorAll("[data-assistance-mode='human']").forEach((button) => {
    button.addEventListener("click", () => {
      humanPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => subject.focus(), 300);
    });
  });

  if (form) {
    form.addEventListener("submit", createTicket);
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", loadHistory);
  }

  loadHistory();
})();
