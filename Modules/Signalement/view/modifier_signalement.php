<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
if (!isset($_SESSION['cin'])) {
    header('Location: ../../User/View/login.html');
    exit();
}

require_once __DIR__ . '/../../../config.php';
require_once __DIR__ . '/../model/Signalement.php';

$database = new Database();
$pdo = $database->getConnection();

$id = intval($_GET['id'] ?? 0);
$cin = $_SESSION['cin'];
$signalement = null;
if ($id > 0) {
    $signalement = Signalement::getOneByCin($pdo, $id, $cin);
}
if (!$signalement || strtolower($signalement['statut'] ?? '') !== 'ouvert') {
    header('Location: liste_signalements_user.html');
    exit();
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modifier signalement</title>
  <link href="../../../assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
  <link href="../../../assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet">
  <link href="../../../assets/css/main.css?v=20260502-3" rel="stylesheet">
</head>
<body class="index-page">
  <div id="header-container" class="sticky-top" style="top:0;z-index:1030;"></div>

  <main class="container py-5">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <div class="card shadow-sm border-0 rounded-4">
          <div class="card-body p-4 p-lg-5">
            <h2 class="h4 mb-3">Modifier mon signalement</h2>
            <p class="text-muted mb-4">Vous pouvez modifier ce signalement tant qu'il est ouvert.</p>

            <form method="POST" action="../controller/SignalementController.php">
              <input type="hidden" name="action" value="citizenUpdate">
              <input type="hidden" name="id_signalement" value="<?php echo (int) $signalement['id_signalement']; ?>">

              <div class="mb-3">
                <label for="titre" class="form-label fw-bold">Titre</label>
                <input
                  type="text"
                  id="titre"
                  name="titre"
                  class="form-control"
                  minlength="10"
                  required
                  value="<?php echo htmlspecialchars($signalement['titre'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"
                >
              </div>

              <div class="mb-4">
                <label for="description" class="form-label fw-bold">Description</label>
                <textarea
                  id="description"
                  name="description"
                  class="form-control"
                  rows="5"
                  minlength="15"
                  required
                ><?php echo htmlspecialchars($signalement['description'] ?? '', ENT_QUOTES, 'UTF-8'); ?></textarea>
              </div>

              <div class="d-flex gap-2">
                <a href="liste_signalements_user.html" class="btn btn-outline-secondary">
                  Annuler
                </a>
                <button type="submit" class="btn" style="background-color:#f68d56;border-color:#f68d56;color:#fff;">
                  <i class="bi bi-check2-circle"></i> Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </main>

  <script src="../../../assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
  <script src="../../../assets/js/load_header.js?v=20260502-2"></script>
  <script src="../../../assets/js/auth.js?v=20260503-1"></script>
</body>
</html>
