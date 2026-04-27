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

  function showMessage(type, message) {
    formMessage.className = `form-message ${type}`;
    formMessage.innerHTML = message;
    formMessage.classList.remove('d-none');
  }

  function clearMessage() {
    formMessage.className = 'form-message d-none';
    formMessage.innerHTML = '';
  }

  const params = new URLSearchParams(window.location.search);

  if (params.get('error') === 'email_exists') {
    showMessage('error', 'Cet email existe déjà.');
  }

  if (params.get('error') === 'cin_exists') {
    showMessage('error', 'Ce numéro CIN existe déjà.');
  }

  if (params.get('error') === 'register_failed') {
    showMessage('error', "Erreur lors de l'inscription.");
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

    if (!/^\d{8}$/.test(cinValue)) {
      errors.push('Le numéro CIN doit contenir exactement 8 chiffres.');
    }

    if (phoneValue !== '' && !/^\d{8,15}$/.test(phoneValue)) {
      errors.push('Le numéro de téléphone doit contenir entre 8 et 15 chiffres.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      errors.push('Veuillez entrer une adresse email valide.');
    }

    if (passwordValue.length < 6) {
      errors.push('Le mot de passe doit contenir au moins 6 caractères.');
    }

    if (passwordValue !== confirmPasswordValue) {
      errors.push('Les mots de passe ne correspondent pas.');
    }

    if (latitudeValue !== '' && isNaN(latitudeValue)) {
      errors.push('La latitude doit être une valeur numérique.');
    }

    if (longitudeValue !== '' && isNaN(longitudeValue)) {
      errors.push('La longitude doit être une valeur numérique.');
    }

    if (errors.length > 0) {
      e.preventDefault();
      showMessage('error', errors.join('<br>'));
      formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});