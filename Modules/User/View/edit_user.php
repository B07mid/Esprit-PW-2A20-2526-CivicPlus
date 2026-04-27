<?php
require_once __DIR__ . '/../config/config.php';

if (!isset($_GET['num_cin']) || empty($_GET['num_cin'])) {
    die('num_cin manquant.');
}

$num_cin = (int) $_GET['num_cin'];

try {
    $stmt = $pdo->prepare("SELECT * FROM citoyen WHERE num_cin = :num_cin");
    $stmt->bindValue(':num_cin', $num_cin, PDO::PARAM_INT);
    $stmt->execute();
    $citoyen = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$citoyen) {
        die('Citoyen introuvable.');
    }
} catch (PDOException $e) {
    die("Erreur chargement : " . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Modifier citoyen</title>

  <link href="../../../assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet" />
  <link href="../../../assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet" />
  
  <!-- Leaflet CSS & JS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <link href="../../../assets/css/main.css" rel="stylesheet" />
  <link href="../../../assets/css/admin.css" rel="stylesheet" />
</head>
<body class="index-page">
  <div class="container py-5">
    <div class="card shadow-sm">
      <div class="card-body p-4">
        <h2 class="mb-4">Modifier le citoyen</h2>

        <form action="../Controller/update_user.php" method="POST">
          <input type="hidden" name="num_cin_original" value="<?= htmlspecialchars($citoyen['num_cin']) ?>">

          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Num CIN</label>
              <input type="number" name="num_cin" class="form-control" value="<?= htmlspecialchars($citoyen['num_cin']) ?>" required>
            </div>

            <div class="col-md-6">
              <label class="form-label">Nom</label>
              <input type="text" name="nom" class="form-control" value="<?= htmlspecialchars($citoyen['nom']) ?>" required>
            </div>

            <div class="col-md-6">
              <label class="form-label">Prénom</label>
              <input type="text" name="prenom" class="form-control" value="<?= htmlspecialchars($citoyen['prenom']) ?>" required>
            </div>

            <div class="col-md-6">
              <label class="form-label">Date naissance</label>
              <input type="date" name="date_naissance" class="form-control" value="<?= htmlspecialchars($citoyen['date_naissance'] ?? '') ?>">
            </div>

            <div class="col-md-6">
              <label class="form-label">Genre</label>
              <input type="text" name="genre" class="form-control" value="<?= htmlspecialchars($citoyen['genre'] ?? '') ?>">
            </div>

            <div class="col-md-6">
              <label class="form-label">Situation familiale</label>
              <input type="text" name="situation_familiale" class="form-control" value="<?= htmlspecialchars($citoyen['situation_familiale'] ?? '') ?>">
            </div>

            <div class="col-md-6">
              <label class="form-label">Email</label>
              <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($citoyen['email']) ?>" required>
            </div>

            <div class="col-md-6">
              <label class="form-label">Téléphone</label>
              <input type="text" name="numero_telephone" class="form-control" value="<?= htmlspecialchars($citoyen['numero_telephone'] ?? '') ?>">
            </div>

            <div class="col-md-12">
              <label class="form-label">Adresse postale</label>
              <textarea name="adresse_postale" class="form-control"><?= htmlspecialchars($citoyen['adresse_postale'] ?? '') ?></textarea>
            </div>

            <div class="col-md-4">
              <label class="form-label">Code postal</label>
              <input type="text" name="code_postal" class="form-control" value="<?= htmlspecialchars($citoyen['code_postal'] ?? '') ?>">
            </div>

            <div class="col-md-4">
              <label class="form-label">Ville</label>
              <input type="text" name="ville" class="form-control" value="<?= htmlspecialchars($citoyen['ville'] ?? '') ?>">
            </div>

            <div class="col-md-4">
              <label class="form-label">Langue préférée</label>
              <input type="text" name="langue_preferee" class="form-control" value="<?= htmlspecialchars($citoyen['langue_preferee'] ?? '') ?>">
            </div>

            <div class="col-md-6">
              <label class="form-label">Latitude domicile</label>
              <input type="text" name="latitude_domicile" class="form-control" value="<?= htmlspecialchars($citoyen['latitude_domicile'] ?? '') ?>">
            </div>

            <div class="col-md-6">
              <label class="form-label">Longitude domicile</label>
              <input type="text" name="longitude_domicile" class="form-control" value="<?= htmlspecialchars($citoyen['longitude_domicile'] ?? '') ?>">
            </div>

            <div class="col-md-12">
              <div id="location-picker-map" style="height: 300px; width: 100%; border-radius: 8px; border: 1px solid #ced4da; margin-bottom: 10px; z-index: 1;"></div>
              <small class="text-muted"><i class="bi bi-info-circle"></i> Placez le point sur la carte pour générer les coordonnées.</small>
            </div>

            <div class="col-md-6">
              <label class="form-label">2FA active</label>
              <select name="double_authentification_active" class="form-control">
                <option value="0" <?= ((int)($citoyen['double_authentification_active'] ?? 0) === 0) ? 'selected' : '' ?>>0</option>
                <option value="1" <?= ((int)($citoyen['double_authentification_active'] ?? 0) === 1) ? 'selected' : '' ?>>1</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label">Statut compte</label>
              <input type="text" name="statut_compte" class="form-control" value="<?= htmlspecialchars($citoyen['statut_compte'] ?? '') ?>">
            </div>

            <div class="col-md-6">
              <label class="form-label">Points civisme</label>
              <input type="number" name="points_civisme" class="form-control" value="<?= htmlspecialchars($citoyen['points_civisme'] ?? 0) ?>">
            </div>

            <div class="col-md-6">
              <label class="form-label">Niveau badge (Rôle)</label>
              <select name="niveau_badge" class="form-control">
                <option value="Novice" <?= ($citoyen['niveau_badge'] ?? '') === 'Novice' ? 'selected' : '' ?>>Novice</option>
                <option value="Admin" <?= ($citoyen['niveau_badge'] ?? '') === 'Admin' ? 'selected' : '' ?>>Admin</option>
              </select>
            </div>

            <div class="col-md-12">
              <label class="form-label">Préférences IA transport</label>
              <textarea name="preferences_ia_transport" class="form-control"><?= htmlspecialchars($citoyen['preferences_ia_transport'] ?? '') ?></textarea>
            </div>
          </div>

          <div class="mt-4 d-flex gap-2">
            <button type="submit" class="btn btn-primary">Enregistrer</button>
            <a href="user_list.html" class="btn btn-secondary">Retour</a>
          </div>
        </form>
      </div>
    </div>
  </div>
  <script src="../../../assets/js/location-picker.js"></script>
<script src='/civicplus/assets/js/auth.js?v=5'></script>
</body>
</html>



