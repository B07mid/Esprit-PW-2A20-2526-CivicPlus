document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('registerForm');
  const password = document.getElementById('mot_de_passe');
  const confirmPassword = document.getElementById('confirm_mot_de_passe');
  const cin = document.getElementById('num_cin');
  const phone = document.getElementById('numero_telephone');
  const email = document.getElementById('email');
  const latitude = document.getElementById('latitude_domicile');
  const longitude = document.getElementById('longitude_domicile');
  const formMessage = document.getElementById('formMessage');
  const turnstileWidget = document.getElementById('turnstileWidget');

  function showMessage(type, message) {
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    formMessage.className = `alert ${alertClass} mb-3`;
    formMessage.setAttribute('role', 'alert');
    formMessage.setAttribute('tabindex', '-1');
    formMessage.innerHTML = message;
    formMessage.classList.remove('d-none');
    formMessage.focus({ preventScroll: true });
  }

  function clearMessage() {
    formMessage.className = 'alert d-none mb-3';
    formMessage.innerHTML = '';
  }

  function showTurnstileStatus(message, type) {
    if (!turnstileWidget) {
      return;
    }

    turnstileWidget.innerHTML = `<div class="alert alert-${type} mb-0">${message}</div>`;
  }

  function loadTurnstileScript() {
    if (window.turnstile && typeof window.turnstile.render === 'function') {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-turnstile-script]');

      if (existingScript) {
        existingScript.addEventListener('load', resolve, { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.turnstileScript = 'true';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function renderLocalDevCaptcha() {
    if (!turnstileWidget) {
      return;
    }

    let tokenInput = form.querySelector('[name="cf-turnstile-response"]');

    if (!tokenInput) {
      tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'cf-turnstile-response';
      form.appendChild(tokenInput);
    }

    tokenInput.value = 'XXXX.DUMMY.TOKEN.XXXX';
    turnstileWidget.innerHTML = `
      <div class="border rounded-3 bg-white p-3 d-flex align-items-center justify-content-between" style="max-width: 320px;">
        <div>
          <div class="fw-bold text-success">Verification captcha active</div>
          <small class="text-muted">Mode local Cloudflare Turnstile</small>
        </div>
        <i class="bi bi-shield-check text-success fs-4"></i>
      </div>
    `;
  }

  function renderTurnstile(siteKey) {
    if (!turnstileWidget || !siteKey) {
      return;
    }

    if (siteKey === '1x00000000000000000000AA') {
      renderLocalDevCaptcha();
      return;
    }

    if (!/^https?:$/.test(window.location.protocol)) {
      showTurnstileStatus('Ouvrez cette page avec http://localhost/civicplus/... pour afficher le captcha.', 'warning');
      return;
    }

    showTurnstileStatus('Chargement de la verification captcha...', 'light');

    const timeout = setTimeout(() => {
      showTurnstileStatus('Captcha non charge. Verifiez votre connexion internet puis actualisez la page.', 'warning');
    }, 10000);

    loadTurnstileScript()
      .then(() => {
        clearTimeout(timeout);
        turnstileWidget.innerHTML = '';
        window.turnstile.render('#turnstileWidget', {
          sitekey: siteKey,
          theme: 'light'
        });
      })
      .catch(() => {
        clearTimeout(timeout);
        showTurnstileStatus('Captcha indisponible. Verifiez votre connexion internet puis actualisez la page.', 'warning');
      });
  }

  fetch('../config/services.php')
    .then(response => response.json())
    .then(config => renderTurnstile(config.turnstileSiteKey))
    .catch(() => {
      if (turnstileWidget) {
        turnstileWidget.innerHTML = '<div class="alert alert-warning mb-0">Verification captcha indisponible.</div>';
      }
    });

  const params = new URLSearchParams(window.location.search);

  if (params.get('error') === 'email_exists') {
    showMessage('error', 'Cet email existe deja.');
  }

  if (params.get('error') === 'cin_exists') {
    showMessage('error', 'Ce numero CIN existe deja.');
  }

  if (params.get('error') === 'register_failed') {
    showMessage('error', "Erreur lors de l'inscription.");
  }

  if (params.get('error') === 'attente_existe') {
    showMessage('error', 'Une verification est deja en attente pour cet email ou ce CIN. Verifiez votre boite mail.');
  }

  if (params.get('error') === 'email_send_failed') {
    showMessage('error', "Impossible d'envoyer l'email de verification. Verifiez la configuration Brevo.");
  }

  if (params.get('error_message')) {
    showMessage('error', params.get('error_message').replace(/\|/g, '<br>'));
  }

  form.addEventListener('submit', function (e) {
    clearMessage();

    let errors = [];

    const cinValue = cin.value.trim();
    const phoneValue = phone.value.trim();
    const emailValue = email.value.trim();
    const passwordValue = password.value;
    const confirmPasswordValue = confirmPassword.value;
    const latitudeValue = latitude.value.trim();
    const longitudeValue = longitude.value.trim();
    const turnstileResponse = form.querySelector('[name="cf-turnstile-response"]');

    if (!/^\d{8}$/.test(cinValue)) {
      errors.push('Le numero CIN doit contenir exactement 8 chiffres.');
    }

    if (phoneValue !== '' && !/^\d{8,15}$/.test(phoneValue)) {
      errors.push('Le numero de telephone doit contenir entre 8 et 15 chiffres.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      errors.push('Veuillez entrer une adresse email valide.');
    }

    if (passwordValue.length < 6) {
      errors.push('Le mot de passe doit contenir au moins 6 caracteres.');
    }

    if (passwordValue !== confirmPasswordValue) {
      errors.push('Les mots de passe ne correspondent pas.');
    }

    if (latitudeValue !== '' && isNaN(latitudeValue)) {
      errors.push('La latitude doit etre une valeur numerique.');
    }

    if (longitudeValue !== '' && isNaN(longitudeValue)) {
      errors.push('La longitude doit etre une valeur numerique.');
    }

    if (!turnstileResponse || !turnstileResponse.value) {
      errors.push('Veuillez completer la verification captcha.');
    }

    if (errors.length > 0) {
      e.preventDefault();
      showMessage('error', errors.join('<br>'));
      formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});
