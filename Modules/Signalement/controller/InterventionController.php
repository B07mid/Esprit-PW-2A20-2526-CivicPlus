<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once __DIR__ . '/../../../config.php';
require_once __DIR__ . '/../model/Intervention.php';

class InterventionController {
    
    // Récupérer l'intervention d'un signalement en JSON
    public function getBySignalementAction($pdo) {
        if (isset($_GET['id_signalement'])) {
            $id = intval($_GET['id_signalement']);
            $intervention = Intervention::getBySignalement($pdo, $id);
            
            header('Content-Type: application/json');
            if ($intervention) {
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'type' => $intervention['type_intervention'],
                        'equipe' => $intervention['equipe_responsable'],
                        'date' => $intervention['date_planification'],
                        'statut' => $intervention['statut_intervention'],
                        'comm' => $intervention['commentaires_techniques']
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Aucune intervention planifiée.']);
            }
            exit();
        }
    }

    // Créer une nouvelle intervention
    public function createAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $id_sig = intval($_POST['id_signalement']);
            $type = htmlspecialchars($_POST['type_intervention']);
            $equipe = htmlspecialchars($_POST['equipe_responsable']);
            $date_p = $_POST['date_planification'];
            $statut = 'en_attente';
            $comm = htmlspecialchars($_POST['commentaires_techniques']);

            // MÉTIER : Vérification de la charge de l'équipe (Optimisation)
            $charge = Intervention::getChargeEquipe($pdo, $equipe);
            $alerteCharge = ($charge > 3) ? "Attention : Équipe surchargée ($charge tâches)." : null;

            // MÉTIER : Estimation de durée (Réassurance)
            $estimation = Intervention::estimerTempsResolution($type);

            $intervention = new Intervention(null, $id_sig, $type, $equipe, $date_p, $statut, $comm);
            $succes = $intervention->ajouterIntervention($pdo);

            header('Content-Type: application/json');
            echo json_encode([
                'success' => $succes, 
                'charge_alerte' => $alerteCharge,
                'estimation' => $estimation
            ]);
            exit();
        }
    }

    // Mettre à jour une intervention existante
    public function updateAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $id_sig = intval($_POST['id_signalement']);
            $type = htmlspecialchars($_POST['type_intervention']);
            $equipe = htmlspecialchars($_POST['equipe_responsable']);
            $date_p = $_POST['date_planification'];
            $statut = htmlspecialchars($_POST['statut_intervention']);
            $comm = htmlspecialchars($_POST['commentaires_techniques']);
            $date_res = !empty($_POST['date_resolution']) ? $_POST['date_resolution'] : null;

            // MÉTIER : Verrouillage de clôture (Workflow Lock)
            if ($statut === 'termine' || $statut === 'terminée') {
                $interventionTemp = new Intervention(null, $id_sig, $type, $equipe, $date_p, $statut, $comm);
                if (!$interventionTemp->peutEtreTerminee()) {
                    header('Content-Type: application/json');
                    echo json_encode([
                        'success' => false, 
                        'error' => "Action refusée : Vous devez fournir un rapport technique détaillé (min. 10 car.) avant de terminer l'intervention."
                    ]);
                    exit();
                }
            }

            $sql = "UPDATE intervention SET 
                    type_intervention = :type, 
                    equipe_responsable = :equipe, 
                    date_planification = :date_p, 
                    date_resolution = :date_res,
                    statut_intervention = :statut, 
                    commentaires_techniques = :comm 
                    WHERE id_signalement = :id_sig";
            
            $stmt = $pdo->prepare($sql);
            $succes = $stmt->execute([
                'type' => $type,
                'equipe' => $equipe,
                'date_p' => $date_p,
                'date_res' => $date_res,
                'statut' => $statut,
                'comm' => $comm,
                'id_sig' => $id_sig
            ]);

            // SIMULATION D'ENVOI D'EMAIL CITOYEN
            $emailSent = false;
            if ($succes && ($statut === 'termine' || $statut === 'terminée')) {
                // On récupère le CIN du signalement pour simuler l'envoi au citoyen
                $sqlSig = "SELECT num_cin, titre FROM signalement WHERE id_signalement = :id_sig";
                $stmtSig = $pdo->prepare($sqlSig);
                $stmtSig->execute(['id_sig' => $id_sig]);
                $sigData = $stmtSig->fetch(PDO::FETCH_ASSOC);

                if ($sigData) {
                    $emailContent = "[" . date('Y-m-d H:i:s') . "] EMAIL ENVOYÉ AU CITOYEN (CIN: " . $sigData['num_cin'] . ")\n";
                    $emailContent .= "Sujet : Votre signalement '" . $sigData['titre'] . "' a été résolu !\n";
                    $emailContent .= "Message : Notre équipe technique a terminé l'intervention. Connectez-vous à votre espace pour voir le rapport détaillé.\n";
                    $emailContent .= "--------------------------------------------------\n";
                    
                    // On écrit dans un fichier log pour simuler l'envoi d'email
                    file_put_contents(__DIR__ . '/../../../emails_envoyes.log', $emailContent, FILE_APPEND);
                    $emailSent = true;
                }
            }

            header('Content-Type: application/json');
            echo json_encode([
                'success' => $succes,
                'email_envoye' => $emailSent
            ]);
            exit();
        }
    }

    // Récupérer toutes les interventions (Jointure)
    public function getAllAction($pdo) {
        $interventions = Intervention::getAllWithSignalement($pdo);
        header('Content-Type: application/json');
        echo json_encode($interventions);
        exit();
    }

    public function deleteAction($pdo) {
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $succes = Intervention::supprimerIntervention($pdo, $id);
            header('Content-Type: application/json');
            echo json_encode(['success' => $succes]);
            exit();
        }
    }
}

// Initialisation de la base de données
$database = new Database();
$pdo = $database->getConnection();

// Routeur simple pour le contrôleur
$controller = new InterventionController();
if (isset($_GET['action'])) {
    if ($_GET['action'] === 'get') {
        $controller->getBySignalementAction($pdo);
    } elseif ($_GET['action'] === 'getAll') {
        $controller->getAllAction($pdo);
    } elseif ($_GET['action'] === 'delete') {
        $controller->deleteAction($pdo);
    }
} elseif (isset($_POST['action'])) {
    if ($_POST['action'] === 'create') {
        $controller->createAction($pdo);
    } elseif ($_POST['action'] === 'update') {
        $controller->updateAction($pdo);
    }
}
?>
