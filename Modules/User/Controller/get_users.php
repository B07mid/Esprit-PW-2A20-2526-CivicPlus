<?php
require_once __DIR__ . '/../config/config.php';
header('Content-Type: application/json');

try {
    $sql = "SELECT 
                num_cin,
                nom,
                prenom,
                date_naissance,
                genre,
                situation_familiale,
                email,
                numero_telephone,
                adresse_postale,
                code_postal,
                ville,
                latitude_domicile,
                longitude_domicile,
                double_authentification_active,
                token_reinitialisation,
                date_derniere_connexion,
                statut_compte,
                points_civisme,
                niveau_badge,
                langue_preferee,
                preferences_ia_transport
            FROM citoyen
            ORDER BY num_cin DESC";

    $stmt = $pdo->query($sql);
    $citoyens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'citoyens' => $citoyens]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => "Erreur lors du chargement des citoyens : " . $e->getMessage()]);
}
