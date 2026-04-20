<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <title>Edit Donation - CivicPlus</title>
  <link href="../../assets/img/RawShape.png" rel="icon">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Raleway:wght@300;400;600;700&family=Ubuntu:wght@300;400;500;700&display=swap" rel="stylesheet">
  <link href="../../assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
  <link href="../../assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet">
  <link href="../../assets/vendor/aos/aos.css" rel="stylesheet">
  <link href="../../assets/css/main.css" rel="stylesheet">
</head>
<body class="index-page">

  <header id="header" class="header d-flex align-items-center sticky-top">
    <div class="container-fluid container-xl position-relative d-flex align-items-center">
      <a href="../../index.html" class="logo d-flex align-items-center me-auto">
        <img src="../../assets/img/logo.png" alt="CivicPlus Logo">
        <h1 class="sitename">CivicPlus</h1>
      </a>
      <nav id="navmenu" class="navmenu">
        <ul>
          <li><a href="../../index.html">Home</a></li>
          <li><a href="../../crowdfunding.php" class="active">Crowdfunding</a></li>
        </ul>
        <i class="mobile-nav-toggle d-xl-none bi bi-list"></i>
      </nav>
    </div>
  </header>

  <main>

    <!-- Page Title -->
    <div class="page-title dark-background">
      <div class="container">
        <h1>Donations</h1>
        <nav class="breadcrumbs">
          <ol>
            <li><a href="../../index.html">Home</a></li>
            <li><a href="../../crowdfunding.php">Crowdfunding</a></li>
            <li><a href="index.php?entity=donation&action=list">Donations</a></li>
            <li class="current">Edit Donation #<?= htmlspecialchars($donation['id_don']) ?></li>
          </ol>
        </nav>
      </div>
    </div>

    <!-- EDIT DONATION FORM -->
    <section class="section">
      <div class="container" data-aos="fade-up">
        <div class="row justify-content-center">
          <div class="col-lg-7">
            <h2 class="mb-1">Edit Donation</h2>
            <p class="text-muted mb-4">Update the details below and save.</p>

            <!-- Validation errors -->
            <?php if (!empty($errors)): ?>
              <div class="alert alert-danger">
                <ul class="mb-0">
                  <?php foreach ($errors as $e): ?>
                    <li><?= htmlspecialchars($e) ?></li>
                  <?php endforeach; ?>
                </ul>
              </div>
            <?php endif; ?>

            <form method="post" action="index.php?entity=donation&action=edit&id=<?= htmlspecialchars($donation['id_don']) ?>" id="donationForm" novalidate>

              <div class="mb-3">
                <label for="num_cin" class="form-label">CIN Number *</label>
                <input type="number" id="num_cin" name="num_cin" min="1" class="form-control"
                       value="<?= htmlspecialchars($donation['num_cin']) ?>">
                <span class="text-danger small" id="err_cin"></span>
              </div>

              <div class="mb-3">
                <label for="id_projet" class="form-label">Project ID *</label>
                <input type="number" id="id_projet" name="id_projet" min="1" class="form-control"
                       value="<?= htmlspecialchars($donation['id_projet']) ?>">
                <span class="text-danger small" id="err_projet"></span>
              </div>

              <div class="mb-3">
                <label for="montant" class="form-label">Amount ($) *</label>
                <input type="number" id="montant" name="montant" min="0.01" step="any"
                       class="form-control" value="<?= htmlspecialchars($donation['montant']) ?>">
                <span class="text-danger small" id="err_montant"></span>
              </div>

              <div class="mb-3">
                <label for="reference_transaction" class="form-label">Transaction Reference</label>
                <input type="text" id="reference_transaction" name="reference_transaction" maxlength="100"
                       class="form-control" value="<?= htmlspecialchars($donation['reference_transaction'] ?? '') ?>">
                <span class="text-danger small" id="err_ref"></span>
              </div>

              <div class="mb-3">
                <label for="statut_paiement" class="form-label">Payment Status *</label>
                <select id="statut_paiement" name="statut_paiement" class="form-select">
                  <option value="" disabled>— Select a status —</option>
                  <?php
                    $statuts = ['en_attente' => 'Pending', 'confirmé' => 'Confirmed', 'annulé' => 'Cancelled'];
                    foreach ($statuts as $val => $label):
                      $sel = ($donation['statut_paiement'] === $val) ? 'selected' : '';
                  ?>
                  <option value="<?= $val ?>" <?= $sel ?>><?= $label ?></option>
                  <?php endforeach; ?>
                </select>
                <span class="text-danger small" id="err_statut"></span>
              </div>

              <div class="d-flex gap-2">
                <a href="index.php?entity=donation&action=list" class="btn btn-outline-secondary">
                  <i class="bi bi-arrow-left"></i> Cancel
                </a>
                <button type="submit" class="btn btn-primary">
                  <i class="bi bi-check-circle"></i> Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </section>

  </main>

  <footer id="footer" class="footer">
    <div class="container text-center py-4">
      <p>© CivicPlus. All Rights Reserved.</p>
    </div>
  </footer>

  <script src="../../assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
  <script src="../../assets/vendor/aos/aos.js"></script>
  <script>AOS.init();</script>
  <script src="../../assets/js/main.js"></script>
  <script src="view/donation/donation_validation.js"></script>

<script src='/Esprit-PW-2A20-2526-CivicPlus/assets/js/auth.js?v=5'></script>
</body>
</html>




