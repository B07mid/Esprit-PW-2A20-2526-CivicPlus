document.addEventListener('DOMContentLoaded', function () {
  const loginMessage = document.getElementById('loginMessage');
  const params = new URLSearchParams(window.location.search);

  if (!loginMessage) {
    return;
  }

  function showMessage(type, message) {
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    loginMessage.className = `alert ${alertClass} mb-3`;
    loginMessage.setAttribute('role', 'alert');
    loginMessage.setAttribute('tabindex', '-1');
    loginMessage.innerHTML = message;
    loginMessage.classList.remove('d-none');
    loginMessage.focus({ preventScroll: true });
    loginMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (params.get('register') === 'success') {
    showMessage('success', 'Inscription réussie. Vous pouvez maintenant vous connecter.');
  }

  if (params.get('register') === 'check_email') {
    showMessage('success', 'Vérification envoyée. Ouvrez votre email pour activer le compte avant connexion.');
  }

  if (params.get('register') === 'verified') {
    showMessage('success', 'Email vérifié. Votre compte est actif, vous pouvez vous connecter.');
  }

  if (params.get('login') === 'success') {
    showMessage('success', 'Connexion réussie.');
  }

  if (params.get('error') === 'notfound' || params.get('error') === 'email') {
    showMessage('error', 'Aucun compte trouvé avec cet identifiant.');
  }

  if (params.get('error') === 'wrongpassword' || params.get('error') === 'password') {
    showMessage('error', 'Mot de passe incorrect.');
  }

  if (params.get('error') === 'empty') {
    showMessage('error', 'Veuillez remplir tous les champs.');
  }

  if (params.get('error') === 'server') {
    showMessage('error', 'Erreur serveur. Réessayez plus tard.');
  }
});
