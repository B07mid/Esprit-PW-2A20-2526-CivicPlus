<?php

class PortfolioDocument {
    private $id_portfolio;
    private $num_cin;
    private $id_type;
    private $numero_piece_officielle;
    private $chemin_fichier_officiel;
    private $date_delivrance;
    private $date_expiration;
    private $statut_document;

    // Récupérer les documents officiels d'un citoyen spécifique
    public static function getDocumentsByCin($pdo, $cin) {
        try {
            $sql = "SELECT p.*, t.libelle as nom_document 
                    FROM portfolio_document p
                    JOIN type_document t ON p.id_type = t.id_type
                    WHERE p.num_cin = :cin
                    ORDER BY p.date_expiration ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['cin' => $cin]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Erreur fetching Portfolio : " . $e->getMessage());
        }
    }

    public static function create($pdo, $data) {
        try {
            $sql = "INSERT INTO portfolio_document 
                    (num_cin, id_type, numero_piece_officielle, chemin_fichier_officiel, date_delivrance, date_expiration, statut_document)
                    VALUES (:num_cin, :id_type, :numero_piece_officielle, :chemin_fichier_officiel, :date_delivrance, :date_expiration, :statut_document)";
            $stmt = $pdo->prepare($sql);
            return $stmt->execute([
                'num_cin' => $data['num_cin'],
                'id_type' => $data['id_type'],
                'numero_piece_officielle' => $data['numero_piece_officielle'],
                'chemin_fichier_officiel' => $data['chemin_fichier_officiel'],
                'date_delivrance' => $data['date_delivrance'],
                'date_expiration' => $data['date_expiration'],
                'statut_document' => $data['statut_document'] ?? 'valide'
            ]);
        } catch (PDOException $e) {
            die("Erreur creating Portfolio Doc : " . $e->getMessage());
        }
    }
}
?>


