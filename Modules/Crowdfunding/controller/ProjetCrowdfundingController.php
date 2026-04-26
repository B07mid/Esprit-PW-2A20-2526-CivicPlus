<?php
require_once '../model/ProjetCrowdfunding.php';
require_once '../config/config.php';

class ProjetCrowdfundingController {

    // Retourne la liste complète de tous les projets crowdfunding en format JSON.
    // Réponse utilisée par les pages admin et citoyen pour afficher les projets.
    public function getAllAction($pdo) {
        header('Content-Type: application/json');
        echo json_encode(ProjetCrowdfunding::getAllProjets($pdo));
        exit();
    }

    // Retourne les données d'un seul projet en JSON, identifié par le paramètre GET 'id'.
    // Utilisé pour pré-remplir le formulaire de donation avec le nom du projet.
    public function getByIdAction($pdo) {
        if (isset($_GET['id'])) {
            header('Content-Type: application/json');
            echo json_encode(ProjetCrowdfunding::getProjetById($pdo, intval($_GET['id'])));
            exit();
        }
    }

    // Traite le formulaire POST de création d'un nouveau projet.
    // Sanitize les entrées, instancie le modèle et redirige vers la liste en cas de succès.
    public function addAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $nouveau = new ProjetCrowdfunding(
                null,
                intval($_POST['num_cin']),
                htmlspecialchars(trim($_POST['titre'])),
                htmlspecialchars(trim($_POST['description'])),
                floatval($_POST['budget_cible']),
                0,
                'en_recherche_financement',
                htmlspecialchars(trim($_POST['ville'])),
                htmlspecialchars(trim($_POST['quartier'])),
                !empty($_POST['latitude'])  ? floatval($_POST['latitude'])  : null,
                !empty($_POST['longitude']) ? floatval($_POST['longitude']) : null
            );
            if ($nouveau->ajouterProjet($pdo)) {
                header('Location: ../view/liste_projets.html?success=1');
                exit();
            }
        }
    }

    // Met à jour les champs d'un projet existant via un POST JSON.
    // Appelé depuis le modal d'édition de la page liste_projets.html.
    public function updateAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $modifie = new ProjetCrowdfunding(
                intval($_POST['id_projet']),
                null,
                htmlspecialchars(trim($_POST['titre']         ?? '')),
                htmlspecialchars(trim($_POST['description']   ?? '')),
                !empty($_POST['budget_cible']) ? floatval($_POST['budget_cible']) : null,
                0,
                htmlspecialchars(trim($_POST['statut_projet'] ?? '')),
                htmlspecialchars(trim($_POST['ville']         ?? '')),
                htmlspecialchars(trim($_POST['quartier']      ?? ''))
            );
            $succes = $modifie->modifierProjet($pdo);
            header('Content-Type: application/json');
            echo json_encode(['success' => $succes]);
            exit();
        }
    }

    // Supprime un projet via son ID passé en GET et retourne le résultat en JSON.
    // Appelé depuis le bouton Supprimer de la liste des projets en backoffice.
    public function deleteAction($pdo) {
        if (isset($_GET['id'])) {
            $succes = ProjetCrowdfunding::supprimerProjet($pdo, intval($_GET['id']));
            header('Content-Type: application/json');
            echo json_encode(['success' => $succes]);
            exit();
        }
    }
}

// =======================================================
// ROUTEUR INTERNE
// =======================================================
if (basename($_SERVER['PHP_SELF']) == 'ProjetCrowdfundingController.php') {
    $controller = new ProjetCrowdfundingController();

    if (isset($_GET['action'])) {
        if ($_GET['action'] === 'getAll')  $controller->getAllAction($pdo);
        if ($_GET['action'] === 'getById') $controller->getByIdAction($pdo);
        if ($_GET['action'] === 'delete')  $controller->deleteAction($pdo);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($_POST['action']) && $_POST['action'] === 'update') {
            $controller->updateAction($pdo);
        } else {
            $controller->addAction($pdo);
        }
    }
}
?>

