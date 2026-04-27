document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('verifyEmailForm');
  const email = document.getElementById('email');
  const code = document.getElementById('verification_code');
  const message = document.getElementById('verifyMessage');
  const intro = document.getElementById('verificationIntro');
  const successPanel = document.getElementById('verificationSuccess');
  const params = new URLSearchParams(window.location.search);

  function showMessage(type, text) {
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    message.className = `alert ${alertClass} mb-3`;
    message.setAttribute('role', 'alert');
    message.innerHTML = text;
    message.classList.remove('d-none');
  }

  if (params.get('email')) {
    email.value = params.get('email');
  }

  if (params.get('success') === '1') {
    intro.classList.add('d-none');
    message.classList.add('d-none');
    form.classList.add('d-none');
    successPanel.classList.remove('d-none');
    return;
  }

  if (params.get('sent') === '1') {
    showMessage('success', 'Code envoyé. Vérifiez votre boîte email puis entrez le code ici.');
  }

  if (params.get('verify') === 'invalid') {
    showMessage('error', 'Code invalide. Vérifiez les 6 chiffres reçus par email.');
  }

  if (params.get('verify') === 'expired') {
    showMessage('error', "Code expiré. Recommencez l'inscription pour recevoir un nouveau code.");
  }

  if (params.get('verify') === 'duplicate') {
    showMessage('error', 'Un compte existe déjà avec cet email ou ce CIN.');
  }

  if (params.get('verify') === 'failed') {
    showMessage('error', 'Vérification impossible pour le moment.');
  }

  code.addEventListener('input', function () {
    code.value = code.value.replace(/\D+/g, '').slice(0, 6);
  });

  form.addEventListener('submit', function (event) {
    const value = code.value.trim();

    if (!/^\d{6}$/.test(value)) {
      event.preventDefault();
      showMessage('error', 'Entrez le code à 6 chiffres.');
    }
  });
});
