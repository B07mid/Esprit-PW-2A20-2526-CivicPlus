document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("signalForm");
  const messageBox = document.getElementById("formMessage");
  const momentInput = document.getElementById("moment");

  if (!form || !messageBox) return;

  function formatLocalDateTime(date) {
    const pad = (value) => String(value).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function setTodayMoment() {
    if (!momentInput) return;

    const now = new Date();
    const startOfToday = new Date(now);
    const endOfToday = new Date(now);

    startOfToday.setHours(0, 0, 0, 0);
    endOfToday.setHours(23, 59, 0, 0);

    momentInput.value = formatLocalDateTime(now);
    momentInput.min = formatLocalDateTime(startOfToday);
    momentInput.max = formatLocalDateTime(endOfToday);
    momentInput.readOnly = true;
  }

  setTodayMoment();

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    messageBox.className = "alert d-none mt-3";
    messageBox.innerHTML = "";

    setTodayMoment();

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
    setTodayMoment();
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

  form.addEventListener("reset", () => {
    setTimeout(setTodayMoment, 0);
  });
});
