<?php
// On inclut le Modèle et la connexion à la BDD
require_once '../Model/DemandeDocument.php';
require_once '../config/config.php';

class DemandeController {
    
    // Renvoyer toutes les demandes (Read)
    public function getAllAction($pdo) {
        header('Content-Type: application/json');
        echo json_encode(DemandeDocument::getAllDemandes($pdo));
        exit();
    }

    // Supprimer (Delete)
    public function deleteAction($pdo) {
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $succes = DemandeDocument::supprimerDemande($pdo, $id);
            echo json_encode(['success' => $succes]);
            exit();
        }
    }

    // Ajouter (Create)
    public function addAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $num_cin = intval($_POST['num_cin']);
            $id_type = intval($_POST['id_type']);
            $nature_demande = htmlspecialchars(trim($_POST['nature_demande']));
            
            // Pour l'instant, on simule le chemin du scan (tu coderas l'upload de fichier plus tard)
            $chemin_scan = "uploads/scan_default.jpg";

            $nouvelleDemande = new DemandeDocument(null, $num_cin, $id_type, $nature_demande, $chemin_scan, 'en_attente');
            
            if ($nouvelleDemande->ajouterDemande($pdo)) {
                // Redirection vers la vue liste (à adapter selon le nom de ton fichier HTML)
                header("Location: ../view/liste_demandes.html?success=1");
                exit();
            }
        }
    }

    // Modifier "en ligne" (Update) - Principalement pour changer le statut ou ajouter un motif de rejet
    public function updateAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $id = intval($_POST['id_demande']);
            $statut = htmlspecialchars(trim($_POST['statut_actuel']));
            $motif = isset($_POST['motif_rejet']) ? htmlspecialchars(trim($_POST['motif_rejet'])) : null;

            // On instancie la demande juste avec l'ID, le statut et le motif pour la modification
            $demandeModifiee = new DemandeDocument($id, null, null, null, null, $statut, null, $motif);
            $succes = $demandeModifiee->modifierDemande($pdo);

            header('Content-Type: application/json');
            echo json_encode(['success' => $succes]);
            exit();
        }
    }
}

// =======================================================
// ROUTEUR INTERNE
// =======================================================
if (basename($_SERVER['PHP_SELF']) == 'DemandeController.php') {
    $controller = new DemandeController();
    
    // Requêtes GET (Lecture et Suppression)
    if (isset($_GET['action'])) {
        if ($_GET['action'] === 'getAll') {
            $controller->getAllAction($pdo);
        } elseif ($_GET['action'] === 'delete') {
            $controller->deleteAction($pdo);
        }
    } 
    // Requêtes POST (Ajout et Modification)
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($_POST['action']) && $_POST['action'] === 'update') {
            $controller->updateAction($pdo);
        } else {
            $controller->addAction($pdo);
        }
    }
}
?>


