<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <title>Donations - CivicPlus</title>
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
            <li class="current">Donations</li>
          </ol>
        </nav>
      </div>
    </div>

    <section class="section">
      <div class="container" data-aos="fade-up">

        <!-- Flash message -->
        <?php if (!empty($_GET['flash'])): ?>
          <?php if ($_GET['flash'] === 'added'):   echo '<div class="alert alert-success">Donation added successfully.</div>';   endif; ?>
          <?php if ($_GET['flash'] === 'updated'): echo '<div class="alert alert-success">Donation updated successfully.</div>'; endif; ?>
          <?php if ($_GET['flash'] === 'deleted'): echo '<div class="alert alert-warning">Donation deleted.</div>';               endif; ?>
        <?php endif; ?>

        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 class="mb-0">All Donations</h2>
          <a href="index.php?entity=donation&action=add" class="btn btn-primary">
            <i class="bi bi-plus-circle"></i> Add a new donation
          </a>
        </div>

        <?php if (empty($donations)): ?>
          <div class="alert alert-info">No donations found.</div>
        <?php else: ?>
          <div class="table-responsive">
            <table class="table table-bordered table-hover align-middle">
              <thead class="table-dark">
                <tr>
                  <th>#</th>
                  <th>CIN</th>
                  <th>Project ID</th>
                  <th>Amount ($)</th>
                  <th>Reference</th>
                  <th>Payment Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($donations as $d): ?>
                <tr>
                  <td><?= htmlspecialchars($d['id_don']) ?></td>
                  <td><?= htmlspecialchars($d['num_cin']) ?></td>
                  <td><?= htmlspecialchars($d['id_projet']) ?></td>
                  <td><?= number_format((float)$d['montant'], 2) ?></td>
                  <td><?= htmlspecialchars($d['reference_transaction'] ?? '—') ?></td>
                  <td><?= htmlspecialchars($d['statut_paiement']) ?></td>
                  <td><?= htmlspecialchars($d['date_don']) ?></td>
                  <td>
                    <a href="index.php?entity=donation&action=edit&id=<?= $d['id_don'] ?>" class="btn btn-sm btn-outline-primary me-1">
                      <i class="bi bi-pencil"></i> Edit
                    </a>
                    <a href="index.php?entity=donation&action=delete&id=<?= $d['id_don'] ?>"
                       class="btn btn-sm btn-outline-danger"
                       onclick="return confirm('Delete this donation?')">
                      <i class="bi bi-trash"></i> Delete
                    </a>
                  </td>
                </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        <?php endif; ?>

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

<script src='/Esprit-PW-2A20-2526-CivicPlus/assets/js/auth.js?v=5'></script>
</body>
</html>




