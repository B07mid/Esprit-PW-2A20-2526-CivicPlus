<?php
require_once '../Model/PortfolioDocument.php';
require_once '../config/config.php';

class PortfolioController {
    
    // Renvoyer les documents d'un citoyen
    public function getByCinAction($pdo) {
        if (isset($_GET['cin'])) {
            $cin = intval($_GET['cin']);
            header('Content-Type: application/json');
            echo json_encode(PortfolioDocument::getDocumentsByCin($pdo, $cin));
            exit();
        }
    }

    // Ajouter un document au portfolio
    public function addAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $num_cin = $_POST['num_cin'] ?? '';
            $id_type = $_POST['id_type'] ?? '';
            $numero_piece_officielle = $_POST['numero_piece_officielle'] ?? '';
            $date_delivrance = $_POST['date_delivrance'] ?? '';
            $date_expiration = $_POST['date_expiration'] ?? '';

            $chemin_fichier_officiel = '';
            if (isset($_FILES['chemin_fichier_officiel']) && $_FILES['chemin_fichier_officiel']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = '../uploads/portfolio/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                $fileName = time() . '_' . basename($_FILES['chemin_fichier_officiel']['name']);
                $targetFilePath = $uploadDir . $fileName;

                if (move_uploaded_file($_FILES['chemin_fichier_officiel']['tmp_name'], $targetFilePath)) {
                    $chemin_fichier_officiel = 'uploads/portfolio/' . $fileName;
                }
            }

            if ($num_cin && $id_type && $numero_piece_officielle && $chemin_fichier_officiel && $date_delivrance && $date_expiration) {
                PortfolioDocument::create($pdo, [
                    'num_cin' => $num_cin,
                    'id_type' => $id_type,
                    'numero_piece_officielle' => $numero_piece_officielle,
                    'chemin_fichier_officiel' => $chemin_fichier_officiel,
                    'date_delivrance' => $date_delivrance,
                    'date_expiration' => $date_expiration,
                    'statut_document' => 'valide'
                ]);
                header('Location: ../view/citoyen_portfolio.html?success=1');
                exit();
            } else {
                echo "Erreur : Tous les champs sont obligatoires.";
            }
        }
    }
}

// ROUTEUR INTERNE
if (basename($_SERVER['PHP_SELF']) == 'PortfolioController.php') {
    $controller = new PortfolioController();
    
    if (isset($_GET['action'])) {
        if ($_GET['action'] === 'getByCin') {
            $controller->getByCinAction($pdo);
        } elseif ($_GET['action'] === 'add') {
            $controller->addAction($pdo);
        }
    }
}
?>


