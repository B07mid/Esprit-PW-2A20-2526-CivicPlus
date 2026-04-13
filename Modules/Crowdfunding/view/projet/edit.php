<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <title>Edit Project - CivicPlus</title>
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
        <h1>Projects</h1>
        <nav class="breadcrumbs">
          <ol>
            <li><a href="../../index.html">Home</a></li>
            <li><a href="../../crowdfunding.php">Crowdfunding</a></li>
            <li><a href="index.php?entity=projet&action=list">Projects</a></li>
            <li class="current">Edit Project #<?= htmlspecialchars($projet['id_projet']) ?></li>
          </ol>
        </nav>
      </div>
    </div>

    <!-- EDIT PROJECT FORM -->
    <section class="section">
      <div class="container" data-aos="fade-up">
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <h2 class="mb-1">Edit Project</h2>
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

            <form method="post" action="index.php?entity=projet&action=edit&id=<?= htmlspecialchars($projet['id_projet']) ?>" id="projectForm" novalidate>

              <div class="mb-3">
                <label for="num_cin" class="form-label">CIN Number *</label>
                <input type="number" id="num_cin" name="num_cin" min="1" class="form-control"
                       value="<?= htmlspecialchars($projet['num_cin']) ?>">
                <span class="text-danger small" id="err_cin"></span>
              </div>

              <div class="mb-3">
                <label for="projTitle" class="form-label">Project Title *</label>
                <input type="text" id="projTitle" name="projTitle" placeholder="e.g. Community Sports Arena"
                       class="form-control" value="<?= htmlspecialchars($projet['titre']) ?>">
                <span class="text-danger small" id="err_title"></span>
              </div>

              <div class="mb-3">
                <label for="projStatus" class="form-label">Status *</label>
                <select id="projStatus" name="statut_projet" class="form-select">
                  <option value="" disabled>— Select a status —</option>
                  <?php
                    $statuts = ['en_recherche_financement' => 'Seeking Funding', 'financé' => 'Funded',
                                'en_cours' => 'In Progress', 'terminé' => 'Completed', 'annulé' => 'Cancelled'];
                    foreach ($statuts as $val => $label):
                      $sel = ($projet['statut_projet'] === $val) ? 'selected' : '';
                  ?>
                  <option value="<?= $val ?>" <?= $sel ?>><?= $label ?></option>
                  <?php endforeach; ?>
                </select>
                <span class="text-danger small" id="err_status"></span>
              </div>

              <div class="mb-3">
                <label for="projCity" class="form-label">City *</label>
                <input type="text" id="projCity" name="projCity" placeholder="e.g. Tunis"
                       class="form-control" value="<?= htmlspecialchars($projet['ville']) ?>">
                <span class="text-danger small" id="err_city"></span>
              </div>

              <div class="mb-3">
                <label for="projNeighborhood" class="form-label">Neighborhood *</label>
                <input type="text" id="projNeighborhood" name="projNeighborhood" placeholder="e.g. Bab El Bhar"
                       class="form-control" value="<?= htmlspecialchars($projet['quartier']) ?>">
                <span class="text-danger small" id="err_neighborhood"></span>
              </div>

              <div class="mb-3">
                <label for="projDesc" class="form-label">Description *</label>
                <textarea id="projDesc" name="projDesc" rows="5" class="form-control"
                  placeholder="Describe the project goals, expected impact…"><?= htmlspecialchars($projet['description']) ?></textarea>
                <span class="text-danger small" id="err_desc"></span>
              </div>

              <div class="mb-3">
                <label for="projBudget" class="form-label">Budget Goal ($) *</label>
                <input type="number" id="projBudget" name="projBudget" min="1" step="any"
                       class="form-control" value="<?= htmlspecialchars($projet['budget_cible']) ?>">
                <span class="text-danger small" id="err_budget"></span>
              </div>

              <div class="mb-3">
                <label for="projRaised" class="form-label">Amount Raised So Far ($)</label>
                <input type="number" id="projRaised" name="projRaised" min="0" step="any"
                       class="form-control" value="<?= htmlspecialchars($projet['montant_actuel']) ?>">
                <span class="text-danger small" id="err_raised"></span>
              </div>

              <div class="mb-3">
                <label for="latitude" class="form-label">Latitude</label>
                <input type="number" id="latitude" name="latitude" step="any"
                       class="form-control" value="<?= htmlspecialchars($projet['latitude']) ?>">
                <span class="text-danger small" id="err_lat"></span>
              </div>

              <div class="mb-3">
                <label for="longitude" class="form-label">Longitude</label>
                <input type="number" id="longitude" name="longitude" step="any"
                       class="form-control" value="<?= htmlspecialchars($projet['longitude']) ?>">
                <span class="text-danger small" id="err_lng"></span>
              </div>

              <div class="d-flex gap-2">
                <a href="index.php?entity=projet&action=list" class="btn btn-outline-secondary">
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
  <script src="view/projet/projet_validation.js"></script>

</body>
</html>
