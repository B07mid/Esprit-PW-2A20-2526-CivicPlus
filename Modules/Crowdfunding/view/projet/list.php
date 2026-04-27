<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <title>Projects - CivicPlus</title>
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
            <li class="current">Projects</li>
          </ol>
        </nav>
      </div>
    </div>

    <section class="section">
      <div class="container" data-aos="fade-up">

        <!-- Flash message -->
        <?php if (!empty($_GET['flash'])): ?>
          <?php if ($_GET['flash'] === 'added'):   echo '<div class="alert alert-success">Project added successfully.</div>';   endif; ?>
          <?php if ($_GET['flash'] === 'updated'): echo '<div class="alert alert-success">Project updated successfully.</div>'; endif; ?>
          <?php if ($_GET['flash'] === 'deleted'): echo '<div class="alert alert-warning">Project deleted.</div>';               endif; ?>
        <?php endif; ?>

        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 class="mb-0">All Projects</h2>
          <a href="index.php?entity=projet&action=add" class="btn btn-primary">
            <i class="bi bi-plus-circle"></i> Add a new project
          </a>
        </div>

        <?php if (empty($projets)): ?>
          <div class="alert alert-info">No projects found.</div>
        <?php else: ?>
          <div class="row g-4">
            <?php foreach ($projets as $p):
              $goal    = max((float)$p['budget_cible'], 0.01);
              $raised  = (float)$p['montant_actuel'];
              $pct     = min(100, round(($raised / $goal) * 100));
            ?>
            <div class="col-lg-4 col-md-6" data-aos="fade-up">
              <div class="card h-100 shadow-sm border-0">
                <div class="card-body d-flex flex-column p-4">

                  <!-- ID badge -->
                  <span class="badge bg-secondary mb-2 align-self-start">#<?= htmlspecialchars($p['id_projet']) ?></span>

                  <!-- Title -->
                  <h5 class="card-title fw-bold mb-1"><?= htmlspecialchars($p['titre']) ?></h5>
                  <p class="text-muted small mb-2"><?= htmlspecialchars($p['ville']) ?>, <?= htmlspecialchars($p['quartier']) ?></p>

                  <!-- Description -->
                  <p class="card-text flex-grow-1" style="font-size:.9rem;">
                    <?= htmlspecialchars(mb_strimwidth($p['description'], 0, 120, '…')) ?>
                  </p>

                  <!-- Funding progress -->
                  <div class="mt-3">
                    <div class="d-flex justify-content-between small mb-1">
                      <span>Raised: <strong>$<?= number_format($raised, 2) ?></strong></span>
                      <span>Goal: <strong>$<?= number_format($goal, 2) ?></strong></span>
                    </div>
                    <div class="progress" style="height:10px;">
                      <div class="progress-bar bg-warning" role="progressbar"
                           style="width:<?= $pct ?>%"
                           aria-valuenow="<?= $pct ?>" aria-valuemin="0" aria-valuemax="100">
                      </div>
                    </div>
                    <div class="text-end small mt-1 text-muted"><?= $pct ?>% funded</div>
                  </div>

                  <!-- Action buttons -->
                  <div class="d-flex gap-2 mt-3">
                    <button class="btn btn-outline-danger btn-sm flex-fill btn-like"
                            data-id="<?= $p['id_projet'] ?>">
                      <i class="bi bi-heart"></i> Like
                    </button>
                    <button class="btn btn-outline-secondary btn-sm flex-fill"
                            data-bs-toggle="collapse"
                            data-bs-target="#comment-<?= $p['id_projet'] ?>">
                      <i class="bi bi-chat"></i> Comment
                    </button>
                    <a href="index.php?entity=projet&action=edit&id=<?= $p['id_projet'] ?>"
                       class="btn btn-outline-primary btn-sm">
                      <i class="bi bi-pencil"></i>
                    </a>
                    <a href="index.php?entity=projet&action=delete&id=<?= $p['id_projet'] ?>"
                       class="btn btn-outline-danger btn-sm"
                       onclick="return confirm('Delete this project?')">
                      <i class="bi bi-trash"></i>
                    </a>
                  </div>

                  <!-- Comment collapse -->
                  <div class="collapse mt-3" id="comment-<?= $p['id_projet'] ?>">
                    <textarea class="form-control form-control-sm" rows="2"
                              placeholder="Write a comment…"></textarea>
                    <button class="btn btn-primary btn-sm mt-2 w-100">Post Comment</button>
                  </div>

                </div>
              </div>
            </div>
            <?php endforeach; ?>
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
  <script>
    document.querySelectorAll('.btn-like').forEach(btn => {
      btn.addEventListener('click', function () {
        const icon = this.querySelector('i');
        if (icon.classList.contains('bi-heart')) {
          icon.classList.replace('bi-heart', 'bi-heart-fill');
          this.classList.replace('btn-outline-danger', 'btn-danger');
          this.innerHTML = '<i class="bi bi-heart-fill"></i> Liked';
        } else {
          icon.classList.replace('bi-heart-fill', 'bi-heart');
          this.classList.replace('btn-danger', 'btn-outline-danger');
          this.innerHTML = '<i class="bi bi-heart"></i> Like';
        }
      });
    });
  </script>

<script src='/Esprit-PW-2A20-2526-CivicPlus/assets/js/auth.js?v=5'></script>
</body>
</html>




