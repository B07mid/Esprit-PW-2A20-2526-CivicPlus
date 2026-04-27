<?php
require_once '../Model/PointInteret.php';
require_once '../config/config.php';
class PoiController {
    
    // ---------------------------------------------------
    // ACTION 1 : Ajouter un POI (C du CRUD)
    // ---------------------------------------------------
    public function ajouterPoiAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $nom_poi = htmlspecialchars(trim($_POST['nom_poi']));
            $latitude = floatval($_POST['latitude']);
            $longitude = floatval($_POST['longitude']);
            $adresse_postale = htmlspecialchars(trim($_POST['adresse_postale']));
            $contact_tel = htmlspecialchars(trim($_POST['contact_tel']));

            $categorie = htmlspecialchars($_POST['categorie_service']);
            if ($categorie === 'autre' && !empty($_POST['nouvelle_categorie'])) {
                $categorie = strtolower(trim(htmlspecialchars($_POST['nouvelle_categorie']))); 
            }

            $horaires = null;
            if (!empty($_POST['heure_ouverture']) && !empty($_POST['heure_fermeture'])) {
                $horaires = $_POST['heure_ouverture'] . ' - ' . $_POST['heure_fermeture'];
            }

            $accessible_pmr = isset($_POST['accessible_pmr']) ? 1 : 0;

            $nouveauPoi = new PointInteret(null, $nom_poi, $categorie, $latitude, $longitude, $adresse_postale, $horaires, $contact_tel, $accessible_pmr);
            $sauvegardeReussie = $nouveauPoi->ajouterPoi($pdo);

            if ($sauvegardeReussie) {
                header("Location: ../view/liste_poi.html?success=1");
                exit();
            }
        }
    }

    // ---------------------------------------------------
    // ACTION 2 : Lire tous les POIs (R du CRUD)
    // ---------------------------------------------------
    public function getPoisAction($pdo) {
        // On indique qu'on renvoie du JSON au navigateur
        header('Content-Type: application/json');
        
        // On récupère les données via le Modèle
        $listePois = PointInteret::getAllPOIs($pdo);
        
        // On affiche le JSON et on arrête l'exécution
        echo json_encode($listePois);
        exit();
    }
    // ---------------------------------------------------
    // ACTION 3 : Supprimer un POI (D du CRUD)
    // ---------------------------------------------------
    public function supprimerPoiAction($pdo) {
        // On vérifie que l'ID a bien été envoyé dans l'URL
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']); // On s'assure que c'est bien un nombre
            
            // On appelle le modèle
            $succes = PointInteret::supprimerPoi($pdo, $id);
            
            // On renvoie un JSON au JavaScript pour lui dire si ça a marché
            echo json_encode(['success' => $succes]);
            exit();
        }
    }
    // Action pour renvoyer les données d'un seul POI au format JSON (pour le formulaire JS)
    public function getPoiByIdAction($pdo) {
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $poi = PointInteret::getPoiById($pdo, $id);
            header('Content-Type: application/json');
            echo json_encode($poi);
            exit();
        }
    }

    // Action pour traiter la soumission du formulaire de modification
    public function modifierPoiAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $id = intval($_POST['id_poi']); 
            
            $nom_poi = htmlspecialchars(trim($_POST['nom_poi']));
            $latitude = floatval($_POST['latitude']);
            $longitude = floatval($_POST['longitude']);
            $adresse_postale = htmlspecialchars(trim($_POST['adresse_postale']));
            $contact_tel = htmlspecialchars(trim($_POST['contact_tel']));
            $categorie = htmlspecialchars(trim($_POST['categorie_service']));
            
            // Pour l'édition en ligne, on reçoit directement le texte des horaires ("10:00 - 17:00")
            $horaires = isset($_POST['horaires_ouverture']) ? htmlspecialchars(trim($_POST['horaires_ouverture'])) : null;
            $accessible_pmr = isset($_POST['accessible_pmr']) ? intval($_POST['accessible_pmr']) : 0;

            // On instancie le modèle avec l'ID pour faire l'UPDATE
            $poiModifie = new PointInteret($id, $nom_poi, $categorie, $latitude, $longitude, $adresse_postale, $horaires, $contact_tel, $accessible_pmr);
            $succes = $poiModifie->modifierPoi($pdo);

            // On renvoie un signal de succès au JavaScript au format JSON
            header('Content-Type: application/json');
            echo json_encode(['success' => $succes]);
            exit();
        }
    }
}

// =======================================================
// ROUTEUR INTERNE (Pour savoir quelle méthode lancer)
// =======================================================

if (basename($_SERVER['PHP_SELF']) == 'PoiController.php') {
    $controller = new PoiController();
    
    // --- LES REQUÊTES GET (Lecture / Suppression) ---
    if (isset($_GET['action'])) {
        if ($_GET['action'] === 'getAll') {
            $controller->getPoisAction($pdo);
        } elseif ($_GET['action'] === 'delete') {
            $controller->supprimerPoiAction($pdo);
        } elseif ($_GET['action'] === 'getOne') { // ⚠️ Nouveau pour l'Update
            $controller->getPoiByIdAction($pdo);
        }
    } 
    // --- LES REQUÊTES POST (Ajout / Modification) ---
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Si le JavaScript envoie l'instruction de modifier
        if (isset($_POST['action']) && $_POST['action'] === 'update') {
            $controller->modifierPoiAction($pdo);
        } else {
            // Sinon, c'est un ajout classique via le formulaire Ajouter_POI.html
            $controller->ajouterPoiAction($pdo);
        }
    }
}
?>


