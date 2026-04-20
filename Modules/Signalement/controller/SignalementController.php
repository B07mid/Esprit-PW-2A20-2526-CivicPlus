<?php
require_once '../Model/Signalement.php';
require_once '../config/config.php';

class SignalementController {
    
    // Renvoyer tous les signalements (Pour le tableau Admin)
    public function getAllAction($pdo) {
        header('Content-Type: application/json');
        echo json_encode(Signalement::getAllSignalements($pdo));
        exit();
    }

    // Renvoyer les signalements d'un citoyen (Pour l'historique Citoyen)
    public function getByCinAction($pdo) {
        if (isset($_GET['cin'])) {
            $cin = intval($_GET['cin']);
            header('Content-Type: application/json');
            echo json_encode(Signalement::getSignalementsByCin($pdo, $cin));
            exit();
        }
    }

    // Ajouter un signalement (Soumission du formulaire Citoyen)
    public function addAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $num_cin = intval($_POST['num_cin']);
            $titre = htmlspecialchars(trim($_POST['titre']));
            $description = htmlspecialchars(trim($_POST['description']));
            $niveau_priorite = isset($_POST['niveau_priorite']) ? htmlspecialchars(trim($_POST['niveau_priorite'])) : 'Normale';
            
            // Simulation de l'upload de photo pour l'instant
            $photo_url = "uploads/incident_default.jpg";

            // On instancie le modèle (statut 'ouvert' par défaut)
            $nouveauSignalement = new Signalement(null, $num_cin, $titre, $description, $photo_url, 'ouvert', $niveau_priorite);
            
            if ($nouveauSignalement->ajouterSignalement($pdo)) {
                // Redirection vers l'historique du citoyen
                header("Location: ../view/liste_signalements.html?success=1");
                exit();
            }
        }
    }

    // Modifier le statut/priorité "en ligne" (Tableau Admin)
    public function updateAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $id = intval($_POST['id_signalement']);
            $statut = htmlspecialchars(trim($_POST['statut']));
            $niveau_priorite = isset($_POST['niveau_priorite']) ? htmlspecialchars(trim($_POST['niveau_priorite'])) : null;

            $signalementModifie = new Signalement($id, null, null, null, null, $statut, $niveau_priorite);
            $succes = $signalementModifie->modifierSignalement($pdo);

            header('Content-Type: application/json');
            echo json_encode(['success' => $succes]);
            exit();
        }
    }

    // Supprimer
    public function deleteAction($pdo) {
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $succes = Signalement::supprimerSignalement($pdo, $id);
            echo json_encode(['success' => $succes]);
            exit();
        }
    }
}

// =======================================================
// ROUTEUR INTERNE
// =======================================================
if (basename($_SERVER['PHP_SELF']) == 'SignalementController.php') {
    $controller = new SignalementController();
    
    // Requêtes GET
    if (isset($_GET['action'])) {
        if ($_GET['action'] === 'getAll') {
            $controller->getAllAction($pdo);
        } elseif ($_GET['action'] === 'getByCin') {
            $controller->getByCinAction($pdo);
        } elseif ($_GET['action'] === 'delete') {
            $controller->deleteAction($pdo);
        }
    } 
    // Requêtes POST
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($_POST['action']) && $_POST['action'] === 'update') {
            $controller->updateAction($pdo);
        } else {
            $controller->addAction($pdo);
        }
    }
}
?>


