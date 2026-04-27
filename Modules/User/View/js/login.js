document.addEventListener('DOMContentLoaded', function () {
  const loginMessage = document.getElementById('loginMessage');
  const params = new URLSearchParams(window.location.search);

  function showMessage(type, message) {
    loginMessage.className = `form-message ${type}`;
    loginMessage.innerHTML = message;
    loginMessage.classList.remove('d-none');
  }

  if (params.get('register') === 'success') {
    showMessage('success', 'Inscription réussie. Vous pouvez maintenant vous connecter.');
  }

  if (params.get('login') === 'success') {
    showMessage('success', 'Connexion réussie.');
  }

  if (params.get('error') === 'notfound') {
    showMessage('error', 'Aucun compte trouvé avec cet email.');
  }

  if (params.get('error') === 'wrongpassword') {
    showMessage('error', 'Mot de passe incorrect.');
  }
});