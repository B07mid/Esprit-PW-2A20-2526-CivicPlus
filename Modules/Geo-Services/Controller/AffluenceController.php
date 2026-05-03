<?php
require_once __DIR__ . '/../../../config.php';
require_once __DIR__ . '/../Model/Affluence.php';

$database = new Database();
$pdo = $database->getConnection();

$action = $_REQUEST['action'] ?? '';

if ($action === 'getAll') {
    $data = Affluence::getAll($pdo);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
} 
elseif ($action === 'get') {
    $id = intval($_GET['id']);
    $data = Affluence::getById($pdo, $id);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
} 
elseif ($action === 'create') {
    $id_poi = intval($_POST['id_poi']);
    $jour = htmlspecialchars($_POST['jour_semaine']);
    $heure = htmlspecialchars($_POST['heure_enregistrement']);
    $niveau = intval($_POST['niveau_foule']);
    $comm = htmlspecialchars($_POST['commentaire'] ?? '');

    $affluence = new Affluence(null, $id_poi, $jour, $heure, $niveau, $comm);
    $success = $affluence->add($pdo);
    
    header('Content-Type: application/json');
    echo json_encode(['success' => $success]);
    exit();
} 
elseif ($action === 'update') {
    $id = intval($_POST['id_affluence']);
    $id_poi = intval($_POST['id_poi']);
    $jour = htmlspecialchars($_POST['jour_semaine']);
    $heure = htmlspecialchars($_POST['heure_enregistrement']);
    $niveau = intval($_POST['niveau_foule']);
    $comm = htmlspecialchars($_POST['commentaire'] ?? '');

    $affluence = new Affluence($id, $id_poi, $jour, $heure, $niveau, $comm);
    $success = $affluence->update($pdo);
    
    header('Content-Type: application/json');
    echo json_encode(['success' => $success]);
    exit();
} 
elseif ($action === 'delete') {
    $id = intval($_GET['id']);
    $success = Affluence::delete($pdo, $id);
    header('Content-Type: application/json');
    echo json_encode(['success' => $success]);
    exit();
}

// Fallback error
header('Content-Type: application/json');
echo json_encode(['success' => false, 'error' => 'Action inconnue']);
?>
