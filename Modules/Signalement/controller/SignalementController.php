<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../model/Signalement.php';
require_once __DIR__ . '/../model/Intervention.php';
require_once __DIR__ . '/../../../config.php';

class SignalementController {
    public function getAllAction($pdo) {
        $signalements = Signalement::getAll($pdo);
        // ARCHIVAGE INTELLIGENT : On ne montre que les dossiers récents
        $signalements = Signalement::appliquerPolitiqueRetention($signalements);
        
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array_values($signalements), JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        exit();
    }

    public function getByCinAction($pdo) {
        if (isset($_GET['cin'])) {
            $signalements = Signalement::getByCin($pdo, $_GET['cin']);
            // ARCHIVAGE INTELLIGENT : On filtre les vieux dossiers
            $signalements = Signalement::appliquerPolitiqueRetention($signalements);
            
            // MÉTIER : On enrichit chaque signalement avec sa progression calculée
            $enriched = [];
            foreach ($signalements as $sig) {
                // On récupère l'intervention liée pour calculer la progression
                $interv = Intervention::getBySignalement($pdo, $sig['id_signalement']);
                $sig['progression'] = 0;
                $sig['temps_estime'] = 'Non planifié';
                
                if ($interv) {
                    // On instancie l'intervention pour utiliser sa méthode métier
                    $iObj = new Intervention(
                        $interv['id_intervention'], 
                        $interv['id_signalement'], 
                        $interv['type_intervention'], 
                        $interv['equipe_responsable'], 
                        $interv['date_planification'], 
                        $interv['statut_intervention'], 
                        $interv['commentaire_technicien']
                    );
                    $sig['progression'] = $iObj->getProgressionNumerique();
                    $sig['temps_estime'] = Intervention::estimerTempsResolution($interv['type_intervention']);
                } else if ($sig['statut'] === 'ouvert') {
                    $sig['progression'] = 10;
                }
                
                $enriched[] = $sig;
            }

            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(array_values($enriched), JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
            exit();
        }
    }

    public function addAction($pdo) {
        try {
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $num_cin = isset($_POST['num_cin']) ? intval($_POST['num_cin']) : 0;
                $titre = htmlspecialchars(trim($_POST['titre'] ?? 'Sans titre'));
                $description = htmlspecialchars(trim($_POST['description'] ?? ''));
                $latitude = !empty($_POST['latitude']) ? floatval($_POST['latitude']) : null;
                $longitude = !empty($_POST['longitude']) ? floatval($_POST['longitude']) : null;
                
                // MOTEUR D'ÉVALUATION DES RISQUES (SMART CITY LOGIC)
                $text_to_analyze = strtolower($titre . " " . $description);
                $niveau_priorite = 'Normale'; // Valeur par défaut

                if (preg_match('/gaz|explosion|incendie|danger|mort|accident|grave|electrique|cable/i', $text_to_analyze)) {
                    $niveau_priorite = 'Urgente';
                } elseif (preg_match('/fuite|inondation|canalisation|eau|noir|obscurité/i', $text_to_analyze)) {
                    $niveau_priorite = 'Moyenne';
                } else if (preg_match('/dechet|ordure|proprete|poubelle/i', $text_to_analyze)) {
                    $niveau_priorite = 'Faible';
                }

                $photo_url = 'default.png';

                if (isset($_FILES['photo']) && $_FILES['photo']['error'] === 0) {
                    $uploadDir = __DIR__ . '/../../../assets/img/signalements/';
                    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
                    $fileName = time() . '_' . basename($_FILES['photo']['name']);
                    if (move_uploaded_file($_FILES['photo']['tmp_name'], $uploadDir . $fileName)) {
                        $photo_url = $fileName;
                    }
                }

                // FORCE SOS SI COCHÉ PAR LE CITOYEN
                if (!empty($_POST['is_sos']) && $_POST['is_sos'] === 'true') {
                    $niveau_priorite = 'SOS_VITALE';
                }

                $nouveau = new Signalement(null, $num_cin, $titre, $description, $photo_url, 'ouvert', $niveau_priorite, null, $latitude, $longitude);
                
                // MÉTIER : Calcul automatique de la priorité si elle n'est pas forcée
                if ($niveau_priorite === 'Normale' || empty($niveau_priorite)) {
                    $niveau_priorite = $nouveau->calculerPrioriteAutomatique();
                    // On peut aussi extraire la rue ici si besoin
                }
                
                $succes = $nouveau->ajouterSignalement($pdo);
                
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => $succes], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
                exit();
            }
        } catch (Exception $e) {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
            exit();
        }
    }

    public function updateCompleteAction($pdo) {
        $id = intval($_POST['id_signalement']);
        $titre = htmlspecialchars($_POST['titre']);
        $description = htmlspecialchars($_POST['description']);
        $succes = Signalement::update($pdo, $id, $titre, $description);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => $succes], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        exit();
    }

    public function updateAdminAction($pdo) {
        $id = intval($_POST['id_signalement']);
        $statut = $_POST['statut'];
        $priorite = $_POST['niveau_priorite'];
        $succes = Signalement::updateStatutPriorite($pdo, $id, $statut, $priorite);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => $succes], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        exit();
    }

    public function deleteAction($pdo) {
        if (isset($_GET['id'])) {
            $succes = Signalement::supprimer($pdo, intval($_GET['id']));
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => $succes], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
            exit();
        }
    }
}

// Initialisation de la base de données
$database = new Database();
$pdo = $database->getConnection();

// Routeur
$controller = new SignalementController();

if (isset($_GET['action'])) {
    if ($_GET['action'] === 'getAll') $controller->getAllAction($pdo);
    elseif ($_GET['action'] === 'getByCin') $controller->getByCinAction($pdo);
    elseif ($_GET['action'] === 'delete') $controller->deleteAction($pdo);
    elseif ($_GET['action'] === 'getChartData') {
        $chart = Signalement::getEvolutionResolutions($pdo);
        $kpis = Signalement::getGlobalKPIs($pdo);
        header('Content-Type: application/json');
        echo json_encode([
            'chart' => $chart,
            'kpis' => $kpis
        ]);
        exit();
    }
} 

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action'])) {
        if ($_POST['action'] === 'updateComplete') $controller->updateCompleteAction($pdo);
        elseif ($_POST['action'] === 'updateAdmin') $controller->updateAdminAction($pdo);
        else $controller->addAction($pdo);
    } else {
        $controller->addAction($pdo);
    }
}
?>