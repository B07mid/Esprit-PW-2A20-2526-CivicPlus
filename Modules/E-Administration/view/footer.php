<?php
if (!headers_sent()) {
    header('Content-Type: text/html; charset=UTF-8');
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$script_dir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
$base_url = preg_replace('#/Modules/E-Administration/view$#', '', $script_dir);
if ($base_url === '/' || $base_url === '.') {
    $base_url = '';
}
?>
<footer id="footer" class="footer civic-footer">
  <div class="container footer-top">
    <div class="row gy-4 align-items-start">
      <div class="col-lg-4 col-md-6">
        <a href="<?php echo $base_url; ?>/index.html" class="civic-footer-brand d-inline-flex align-items-center">
          <img src="<?php echo $base_url; ?>/assets/img/RawShape.png" alt="CivicPlus" width="34" height="34">
          <span>CivicPlus</span>
        </a>
        <p class="civic-footer-text mt-3">
          Une plateforme citoyenne pour simplifier les démarches publiques, signaler les incidents et mieux utiliser les services de la ville.
        </p>
        <div class="civic-footer-contact">
          <a href="tel:+21622504470"><i class="bi bi-telephone"></i> 22 504 470</a>
          <a href="mailto:civicplus00@gmail.com"><i class="bi bi-envelope"></i> civicplus00@gmail.com</a>
          <span><i class="bi bi-geo-alt"></i> Bloc H - ESPRIT, Ariana Petite</span>
        </div>
      </div>

      <div class="col-lg-2 col-md-6 footer-links">
        <h4>Liens utiles</h4>
        <ul>
          <li><i class="bi bi-chevron-right"></i> <a href="<?php echo $base_url; ?>/index.html#hero">Accueil</a></li>
          <li><i class="bi bi-chevron-right"></i> <a href="<?php echo $base_url; ?>/index.html#about">Concept</a></li>
          <li><i class="bi bi-chevron-right"></i> <a href="<?php echo $base_url; ?>/index.html#services">Services</a></li>
          <li><i class="bi bi-chevron-right"></i> <a href="<?php echo $base_url; ?>/index.html#team">Équipe</a></li>
        </ul>
      </div>

      <div class="col-lg-3 col-md-6 footer-links">
        <h4>Nos services</h4>
        <ul>
          <li><i class="bi bi-chevron-right"></i> <a href="<?php echo $base_url; ?>/Modules/E-Administration/view/index.html">E-Administration</a></li>
          <li><i class="bi bi-chevron-right"></i> <a href="<?php echo $base_url; ?>/Modules/Transport/View/front/index.html">Smart Transport</a></li>
          <li><i class="bi bi-chevron-right"></i> <a href="<?php echo $base_url; ?>/Modules/Signalement/view/index.html">Signalement urbain</a></li>
          <li><i class="bi bi-chevron-right"></i> <a href="<?php echo $base_url; ?>/Modules/Crowdfunding/view/index.html">Crowdfunding</a></li>
          <li><i class="bi bi-chevron-right"></i> <a href="<?php echo $base_url; ?>/Modules/Geo-Services/View/index.html">Geo-Services</a></li>
        </ul>
      </div>

      <div class="col-lg-3 col-md-6">
        <h4>Rester connecté</h4>
        <p class="civic-footer-text">
          Accédez rapidement à votre espace citoyen et suivez vos demandes, signalements et contributions.
        </p>
        <div class="civic-footer-actions">
          <?php if (isset($_SESSION['user_id'])): ?>
            <a href="<?php echo $base_url; ?>/Modules/E-Administration/view/citoyen_portfolio.html" class="civic-footer-btn">Mon espace</a>
            <a href="<?php echo $base_url; ?>/Modules/User/View/citoyen_profile.html" class="civic-footer-btn civic-footer-btn-outline">Mon compte</a>
          <?php else: ?>
            <a href="<?php echo $base_url; ?>/Modules/User/View/login.html" class="civic-footer-btn">Connexion</a>
            <a href="<?php echo $base_url; ?>/Modules/User/View/register.html" class="civic-footer-btn civic-footer-btn-outline">Créer un compte</a>
          <?php endif; ?>
        </div>
      </div>
    </div>
  </div>

  <div class="container copyright text-center">
    <p>© <span>2026</span> <strong class="px-1 sitename">CivicPlus</strong> <span>Tous droits réservés.</span></p>
    <div class="credits">Conçu par <strong>NOVA</strong> - ESPRIT</div>
  </div>
</footer>
