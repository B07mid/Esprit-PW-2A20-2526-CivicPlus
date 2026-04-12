function setError(inputId, errId, msg) {
  const el = document.getElementById(inputId);
  const sp = document.getElementById(errId);
  if (msg) {
    sp.textContent = msg;
    if (el) el.classList.add('invalid');
  } else {
    sp.textContent = '';
    if (el) el.classList.remove('invalid');
  }
}

function clearErrors() {
  document.querySelectorAll('.form-error').forEach(s => s.textContent = '');
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}

function validateForm() {
  let valid = true;

  // CIN — required, positive integer, max 8 digits
  const cin = document.getElementById('num_cin').value.trim();
  if (!cin || parseInt(cin) <= 0) {
    setError('num_cin', 'err_cin', 'CIN number is required and must be positive.'); valid = false;
  } else if (!/^\d{1,8}$/.test(cin)) {
    setError('num_cin', 'err_cin', 'CIN must be a number up to 8 digits.'); valid = false;
  } else { setError('num_cin', 'err_cin', ''); }

  // Project ID — required, positive integer
  const idProjet = document.getElementById('id_projet').value.trim();
  if (!idProjet || parseInt(idProjet) <= 0) {
    setError('id_projet', 'err_projet', 'Project ID is required and must be positive.'); valid = false;
  } else { setError('id_projet', 'err_projet', ''); }

  // Amount — required, > 0
  const montant = parseFloat(document.getElementById('montant').value);
  if (!document.getElementById('montant').value || isNaN(montant) || montant <= 0) {
    setError('montant', 'err_montant', 'Amount must be a positive number.'); valid = false;
  } else { setError('montant', 'err_montant', ''); }

  // Reference — optional, max 100 chars
  const ref = document.getElementById('reference_transaction').value.trim();
  if (ref.length > 100) {
    setError('reference_transaction', 'err_ref', 'Reference cannot exceed 100 characters.'); valid = false;
  } else { setError('reference_transaction', 'err_ref', ''); }

  // Payment status — required
  const statut = document.getElementById('statut_paiement').value;
  if (!statut) {
    setError('statut_paiement', 'err_statut', 'Please select a payment status.'); valid = false;
  } else { setError('statut_paiement', 'err_statut', ''); }

  return valid;
}

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('donationForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    if (!validateForm()) e.preventDefault();
  });

  form.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('blur', validateForm);
  });
});
