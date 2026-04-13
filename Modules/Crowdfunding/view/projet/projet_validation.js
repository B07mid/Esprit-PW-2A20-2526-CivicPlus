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

  // Title — required, min 3 chars
  const title = document.getElementById('projTitle').value.trim();
  if (!title) {
    setError('projTitle', 'err_title', 'Project title is required.'); valid = false;
  } else if (title.length < 3) {
    setError('projTitle', 'err_title', 'Title must be at least 3 characters.'); valid = false;
  } else { setError('projTitle', 'err_title', ''); }

  // Status — required
  const status = document.getElementById('projStatus').value;
  if (!status) {
    setError('projStatus', 'err_status', 'Please select a status.'); valid = false;
  } else { setError('projStatus', 'err_status', ''); }

  // City — required
  const city = document.getElementById('projCity').value.trim();
  if (!city) {
    setError('projCity', 'err_city', 'City is required.'); valid = false;
  } else { setError('projCity', 'err_city', ''); }

  // Neighborhood — required
  const neighbor = document.getElementById('projNeighborhood').value.trim();
  if (!neighbor) {
    setError('projNeighborhood', 'err_neighborhood', 'Neighborhood is required.'); valid = false;
  } else { setError('projNeighborhood', 'err_neighborhood', ''); }

  // Description — required, min 10 chars
  const desc = document.getElementById('projDesc').value.trim();
  if (!desc) {
    setError('projDesc', 'err_desc', 'Description is required.'); valid = false;
  } else if (desc.length < 10) {
    setError('projDesc', 'err_desc', 'Description must be at least 10 characters.'); valid = false;
  } else { setError('projDesc', 'err_desc', ''); }

  // Budget — required, > 0
  const budget = parseFloat(document.getElementById('projBudget').value);
  if (!document.getElementById('projBudget').value || isNaN(budget) || budget <= 0) {
    setError('projBudget', 'err_budget', 'Budget goal must be a positive number.'); valid = false;
  } else { setError('projBudget', 'err_budget', ''); }

  // Raised — optional, must be >= 0 and <= budget
  const raisedVal = document.getElementById('projRaised').value;
  if (raisedVal !== '') {
    const raised = parseFloat(raisedVal);
    if (isNaN(raised) || raised < 0) {
      setError('projRaised', 'err_raised', 'Amount raised cannot be negative.'); valid = false;
    } else if (!isNaN(budget) && raised > budget) {
      setError('projRaised', 'err_raised', 'Amount raised cannot exceed the budget goal.'); valid = false;
    } else { setError('projRaised', 'err_raised', ''); }
  } else { setError('projRaised', 'err_raised', ''); }

  // Latitude — optional, -90 to 90
  const latVal = document.getElementById('latitude').value;
  if (latVal !== '') {
    const lat = parseFloat(latVal);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('latitude', 'err_lat', 'Latitude must be between -90 and 90.'); valid = false;
    } else { setError('latitude', 'err_lat', ''); }
  } else { setError('latitude', 'err_lat', ''); }

  // Longitude — optional, -180 to 180
  const lngVal = document.getElementById('longitude').value;
  if (lngVal !== '') {
    const lng = parseFloat(lngVal);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('longitude', 'err_lng', 'Longitude must be between -180 and 180.'); valid = false;
    } else { setError('longitude', 'err_lng', ''); }
  } else { setError('longitude', 'err_lng', ''); }

  return valid;
}

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('projectForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    if (!validateForm()) e.preventDefault();
  });

  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('blur', validateForm);
  });
});
