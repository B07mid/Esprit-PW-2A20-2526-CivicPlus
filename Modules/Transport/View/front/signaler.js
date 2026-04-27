document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("signalForm");
  const messageBox = document.getElementById("formMessage");

  if (!form || !messageBox) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    messageBox.className = "alert d-none mt-3";
    messageBox.innerHTML = "";

    const formData = new FormData(form);

try {
  const response = await fetch("/civicplus/Modules/Transport/Controller/SignalementTransportController.php", {
    method: "POST",
    body: formData
  });

  const rawText = await response.text();
  console.log("HTTP status:", response.status);
  console.log("Raw response:", rawText);

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (jsonError) {
    messageBox.classList.remove("d-none");
    messageBox.classList.add("alert-danger");
    messageBox.innerHTML = `Réponse PHP invalide :<br><pre>${rawText}</pre>`;
    return;
  }

  messageBox.classList.remove("d-none");

  if (data.success) {
    messageBox.classList.add("alert-success");
    messageBox.innerHTML = `✅ ${data.message}<br><strong>ID du signalement :</strong> ${data.report_id}`;
    form.reset();
  } else {
    messageBox.classList.add("alert-danger");
    messageBox.textContent = data.message || "Une erreur est survenue.";
  }
} catch (error) {
  messageBox.classList.remove("d-none");
  messageBox.classList.add("alert-danger");
  messageBox.innerHTML = `Erreur de connexion avec le serveur.<br><small>${error.message}</small>`;
  console.error("Fetch error:", error);
}
  });
});