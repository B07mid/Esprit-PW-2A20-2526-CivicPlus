<?php
require_once '../Model/TypeDocument.php';
require_once '../config/config.php';

class TypeDocumentController {
    
    public function getAllAction($pdo) {
        header('Content-Type: application/json');
        echo json_encode(TypeDocument::getAllTypes($pdo));
        exit();
    }

    public function addAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $libelle = htmlspecialchars(trim($_POST['libelle']));
            $duree = !empty($_POST['duree_validite_mois']) ? intval($_POST['duree_validite_mois']) : null;

            $nouveauType = new TypeDocument(null, $libelle, $duree);
            $succes = $nouveauType->ajouterType($pdo);

            header('Content-Type: application/json');
            echo json_encode(['success' => $succes]);
            exit();
        }
    }

    public function updateAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $id = intval($_POST['id_type']);
            $libelle = htmlspecialchars(trim($_POST['libelle']));
            $duree = !empty($_POST['duree_validite_mois']) ? intval($_POST['duree_validite_mois']) : null;

            $typeModifie = new TypeDocument($id, $libelle, $duree);
            $succes = $typeModifie->modifierType($pdo);

            header('Content-Type: application/json');
            echo json_encode(['success' => $succes]);
            exit();
        }
    }

    public function deleteAction($pdo) {
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $succes = TypeDocument::supprimerType($pdo, $id);
            echo json_encode(['success' => $succes]);
            exit();
        }
    }
}

// ROUTEUR INTERNE
if (basename($_SERVER['PHP_SELF']) == 'TypeDocumentController.php') {
    $controller = new TypeDocumentController();
    
    if (isset($_GET['action'])) {
        if ($_GET['action'] === 'getAll') $controller->getAllAction($pdo);
        elseif ($_GET['action'] === 'delete') $controller->deleteAction($pdo);
    } 
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($_POST['action']) && $_POST['action'] === 'update') {
            $controller->updateAction($pdo);
        } else {
            $controller->addAction($pdo); // Le formulaire d'ajout classique AJAX
        }
    }
}
?>


