(function () {
  "use strict";

  if (window.CivicBot) {
    return;
  }

  const script = document.currentScript;
  const rootUrl = script ? new URL("../../", script.src) : new URL("/civicplus/", window.location.origin);
  const endpointUrl = new URL("Modules/CivicBot/Controller/CivicBotController.php", rootUrl);
  const imageUrl = new URL("assets/img/CivicBot.png", rootUrl);

  const quickOptions = [
    {
      icon: "bi-person-vcard",
      label: "Mon profil",
      prompt: "Résume mon profil CivicPlus et signale les informations importantes."
    },
    {
      icon: "bi-exclamation-triangle",
      label: "Mes signalements",
      prompt: "Quel est l'état de mes derniers signalements urbains et transport ?"
    },
    {
      icon: "bi-file-earmark-check",
      label: "Mes demandes",
      prompt: "Résume mes demandes administratives et mes documents disponibles."
    },
    {
      icon: "bi-piggy-bank",
      label: "Mes projets",
      prompt: "Fais le point sur mes projets crowdfunding et mes donations."
    }
  ];

  let root;
  let panel;
  let input;
  let sendButton;
  let messages;
  let options;
  let busy = false;
  const history = [];

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (text) {
      element.textContent = text;
    }
    return element;
  }

  function addMessage(role, text) {
    const item = createElement("div", "civicbot-message " + role);
    const bubble = createElement("div", "civicbot-bubble");
    bubble.textContent = text;
    item.appendChild(bubble);
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;

    if (role === "user" || role === "model") {
      history.push({ role, text });
      while (history.length > 8) {
        history.shift();
      }
    }

    return item;
  }

  function addTyping() {
    const item = createElement("div", "civicbot-message model");
    const bubble = createElement("div", "civicbot-bubble");
    const typing = createElement("span", "civicbot-typing");
    typing.setAttribute("aria-label", "CivicBot rédige une réponse");
    typing.appendChild(createElement("span"));
    typing.appendChild(createElement("span"));
    typing.appendChild(createElement("span"));
    bubble.appendChild(typing);
    item.appendChild(bubble);
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  }

  function setBusy(nextBusy) {
    busy = nextBusy;
    sendButton.disabled = nextBusy;
    input.disabled = nextBusy;
    options.querySelectorAll("button").forEach((button) => {
      button.disabled = nextBusy;
    });
  }

  function resizeInput() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 112) + "px";
  }

  async function sendMessage(text) {
    const message = text.trim();
    if (!message || busy) {
      return;
    }

    openPanel();
    input.value = "";
    resizeInput();
    addMessage("user", message);
    const typing = addTyping();
    setBusy(true);

    try {
      const response = await fetch(endpointUrl.href, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({
          message,
          history: history.slice(0, -1)
        })
      });

      const data = await response.json().catch(() => ({}));
      typing.remove();

      if (!response.ok || !data.success) {
        addMessage("system", data.message || "CivicBot n'a pas pu répondre pour le moment.");
        return;
      }

      addMessage("model", data.reply || "Je n'ai pas trouvé d'information utile dans vos données autorisées.");
    } catch (error) {
      typing.remove();
      addMessage("system", "Connexion indisponible. Vérifiez que XAMPP et MySQL sont lancés, puis réessayez.");
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  function openPanel() {
    root.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    setTimeout(() => input.focus(), 80);
  }

  function closePanel() {
    root.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  }

  function togglePanel() {
    if (root.classList.contains("is-open")) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function buildOptions() {
    quickOptions.forEach((option) => {
      const button = createElement("button", "civicbot-option");
      button.type = "button";
      button.innerHTML = '<i class="bi ' + option.icon + '"></i><span></span>';
      button.querySelector("span").textContent = option.label;
      button.addEventListener("click", () => sendMessage(option.prompt));
      options.appendChild(button);
    });
  }

  function buildWidget() {
    root = createElement("div", "civicbot-shell");
    root.id = "civicbot";

    const launcher = createElement("button", "civicbot-launcher");
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Ouvrir CivicBot");
    launcher.innerHTML = '<img alt="" src="' + imageUrl.href + '"><span class="civicbot-launcher-badge"></span>';
    launcher.addEventListener("click", togglePanel);

    panel = createElement("section", "civicbot-panel");
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("aria-label", "Assistant CivicBot");

    const header = createElement("div", "civicbot-header");
    const avatar = createElement("div", "civicbot-avatar");
    avatar.innerHTML = '<img alt="" src="' + imageUrl.href + '">';

    const title = createElement("div", "civicbot-title");
    title.innerHTML = "<strong>CivicBot</strong><span>Assistant sécurisé de votre espace CivicPlus</span>";

    const close = createElement("button", "civicbot-close");
    close.type = "button";
    close.setAttribute("aria-label", "Fermer CivicBot");
    close.innerHTML = '<i class="bi bi-x-lg"></i>';
    close.addEventListener("click", closePanel);

    header.appendChild(avatar);
    header.appendChild(title);
    header.appendChild(close);

    messages = createElement("div", "civicbot-messages");
    options = createElement("div", "civicbot-options");

    const form = createElement("form", "civicbot-form");
    input = createElement("textarea", "civicbot-input");
    input.rows = 1;
    input.maxLength = 900;
    input.placeholder = "Posez une question sur votre espace CivicPlus...";
    input.setAttribute("aria-label", "Message pour CivicBot");

    sendButton = createElement("button", "civicbot-send");
    sendButton.type = "submit";
    sendButton.setAttribute("aria-label", "Envoyer");
    sendButton.innerHTML = '<i class="bi bi-send"></i>';

    form.appendChild(input);
    form.appendChild(sendButton);

    panel.appendChild(header);
    panel.appendChild(messages);
    panel.appendChild(options);
    panel.appendChild(form);
    root.appendChild(panel);
    root.appendChild(launcher);
    document.body.appendChild(root);

    buildOptions();
    addMessage("model", "Bonjour, je suis CivicBot. Je peux vous aider à comprendre votre profil, vos signalements, vos demandes administratives, vos documents, vos projets et vos dons. Je consulte uniquement les informations liées à votre session.");

    input.addEventListener("input", resizeInput);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage(input.value);
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      sendMessage(input.value);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closePanel();
      }
    });

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest('[href="#civicbot"], [data-civicbot-open]');
      if (!trigger) {
        return;
      }
      event.preventDefault();
      openPanel();
    });

    if (window.location.hash === "#civicbot") {
      openPanel();
    }
  }

  window.CivicBot = {
    open: openPanel,
    close: closePanel,
    send: sendMessage
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildWidget);
  } else {
    buildWidget();
  }
})();
