<?php
require_once __DIR__ . '/../config/config.php';

if (!isset($_GET['num_cin']) || empty($_GET['num_cin'])) {
    die('num_cin manquant.');
}

$num_cin = (int) $_GET['num_cin'];

try {
    $stmt = $pdo->prepare("DELETE FROM citoyen WHERE num_cin = :num_cin");
    $stmt->bindValue(':num_cin', $num_cin, PDO::PARAM_INT);
    $stmt->execute();

    header('Location: ../View/user_list.html?success=deleted');
    exit;
} catch (PDOException $e) {
    die("Erreur suppression : " . $e->getMessage());
}


