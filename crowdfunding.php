<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <title>Crowdfunding - CivicPlus</title>
  <meta name="description" content="">

  <!-- Favicons -->
  <link href="assets/img/RawShape.png" rel="icon">
  <link href="assets/img/RawShape.png" rel="apple-touch-icon">

  <!-- Fonts -->
  <link href="https://fonts.googleapis.com" rel="preconnect">
  <link href="https://fonts.gstatic.com" rel="preconnect" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Raleway:wght@300;400;600;700&family=Ubuntu:wght@300;400;500;700&display=swap" rel="stylesheet">

  <!-- Vendor CSS -->
  <link href="assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
  <link href="assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet">
  <link href="assets/vendor/aos/aos.css" rel="stylesheet">

  <!-- Main CSS -->
  <link href="assets/css/main.css" rel="stylesheet">

  <style>
    .crowdfunding-card {
      border: none;
      border-radius: 12px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      display: block;
      background-color: #f5ede3;
    }
    .crowdfunding-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.12);
      color: inherit;
    }
    .crowdfunding-card .icon {
      width: 64px;
      height: 64px;
      background-color: #e07b39;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.2rem;
    }
    .crowdfunding-card .icon i {
      font-size: 2rem;
      color: #fff;
    }
    .crowdfunding-card h4 {
      color: #e07b39;
      font-weight: 700;
      margin-bottom: 0.6rem;
    }
    .crowdfunding-card p {
      color: #555;
      font-size: 0.95rem;
      margin-bottom: 0;
    }
    .card-disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
    .page-title-area {
      background: linear-gradient(135deg, #1a3c5e 0%, #2d6a9f 100%);
      padding: 60px 0 40px;
      color: #fff;
    }
    .page-title-area h1 {
      font-size: 2.4rem;
      font-weight: 700;
    }
    .page-title-area nav ol li a {
      color: #f0a875;
    }
    .page-title-area nav ol li,
    .page-title-area nav ol li + li::before {
      color: #ccc;
    }
  </style>
</head>

<body class="index-page">

  <!-- Header -->
  <header id="header" class="header d-flex align-items-center sticky-top">
    <div class="container-fluid container-xl position-relative d-flex align-items-center">
      <a href="index.html" class="logo d-flex align-items-center me-auto">
        <img src="assets/img/logo.png" alt="CivicPlus Logo">
        <h1 class="sitename">CivicPlus</h1>
      </a>
      <nav id="navmenu" class="navmenu">
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="index.html#services" class="active">Services</a></li>
        </ul>
        <i class="mobile-nav-toggle d-xl-none bi bi-list"></i>
      </nav>
    </div>
  </header>

  <main>

    <!-- Page Title -->
    <div class="page-title-area">
      <div class="container">
        <h1>Crowdfunding</h1>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.html">Home</a></li>
            <li class="breadcrumb-item active">Crowdfunding</li>
          </ol>
        </nav>
      </div>
    </div>

    <!-- Cards Section -->
    <section class="py-5">
      <div class="container">
        <div class="text-center mb-5" data-aos="fade-up">
          <h2 style="color:#1a3c5e; font-weight:700;">What would you like to do?</h2>
          <p class="text-muted">Choose an option below to get started with CivicPlus crowdfunding.</p>
        </div>

        <div class="row g-4 justify-content-center">

          <!-- Card 1: Create Project -->
          <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="100">
            <a href="Modules/Crowdfunding/view/citoyen_nouveau_projet.html" class="crowdfunding-card p-4 text-center">
              <div class="icon">
                <i class="bi bi-folder-plus"></i>
              </div>
              <h4>Create a Project</h4>
              <p>Submit a new community project and set your crowdfunding goal to attract local support.</p>
            </a>
          </div>

          <!-- Card 2: Donate -->
          <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="200">
            <a href="Modules/Crowdfunding/view/citoyen_nouvelle_donation.html" class="crowdfunding-card p-4 text-center">
              <div class="icon">
                <i class="bi bi-piggy-bank"></i>
              </div>
              <h4>Make a Donation</h4>
              <p>Support an existing project in your neighbourhood by making a secure donation.</p>
            </a>
          </div>

          <!-- Card 3: View All Projects -->
          <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="300">
            <a href="Modules/Crowdfunding/view/liste_projets.html" class="crowdfunding-card p-4 text-center">
              <div class="icon">
                <i class="bi bi-grid-3x3-gap"></i>
              </div>
              <h4>View All Projects</h4>
              <p>Browse all community projects, track funding progress and support the ones you care about.</p>
            </a>
          </div>

        </div>

      </div>
    </section>

  </main>

  <!-- Footer -->
  <footer id="footer" class="footer">
    <div class="container text-center py-4">
      <p>© CivicPlus. All Rights Reserved.</p>
    </div>
  </footer>

  <!-- Vendor JS -->
  <script src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
  <script src="assets/vendor/aos/aos.js"></script>
  <script>AOS.init();</script>
  <script src="assets/js/main.js"></script>

</body>
</html>
