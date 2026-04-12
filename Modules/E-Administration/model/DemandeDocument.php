<?php

class DemandeDocument {
    // Les propriétés exactes de ton fichier SQL
    private $id_demande;
    private $num_cin;
    private $id_type;
    private $nature_demande;
    private $chemin_scan_identite;
    private $statut_actuel;
    private $date_demande;
    private $motif_rejet;

    public function __construct($id_demande = null, $num_cin = null, $id_type = null, $nature_demande = null, $chemin_scan_identite = null, $statut_actuel = 'en_attente', $date_demande = null, $motif_rejet = null) {
        $this->id_demande = $id_demande;
        $this->num_cin = $num_cin;
        $this->id_type = $id_type;
        $this->nature_demande = $nature_demande;
        $this->chemin_scan_identite = $chemin_scan_identite;
        $this->statut_actuel = $statut_actuel;
        $this->date_demande = $date_demande;
        $this->motif_rejet = $motif_rejet;
    }

    // --- LE "C" (Create) ---
    public function ajouterDemande($pdo) {
        try {
            $sql = "INSERT INTO demande_document (num_cin, id_type, nature_demande, chemin_scan_identite, statut_actuel, date_demande) 
                    VALUES (:num_cin, :id_type, :nature_demande, :chemin_scan_identite, :statut_actuel, NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'num_cin' => $this->num_cin,
                'id_type' => $this->id_type,
                'nature_demande' => $this->nature_demande,
                'chemin_scan_identite' => $this->chemin_scan_identite,
                'statut_actuel' => $this->statut_actuel
            ]);
            return true;
        } catch (PDOException $e) {
            die("Erreur d'ajout de la demande : " . $e->getMessage());
        }
    }

    // --- LE "R" (Read) avec Jointure ---
    public static function getAllDemandes($pdo) {
        try {
            // On joint type_document pour afficher le 'libelle' (nom du document) facilement
            $sql = "SELECT d.*, t.libelle as nom_document 
                    FROM demande_document d
                    JOIN type_document t ON d.id_type = t.id_type
                    ORDER BY d.date_demande DESC";
            $stmt = $pdo->query($sql);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Erreur fetching Demandes: " . $e->getMessage());
        }
    }

    // --- LE "U" (Update) - Pour l'admin qui change le statut ---
    public function modifierDemande($pdo) {
        try {
            $sql = "UPDATE demande_document SET 
                    statut_actuel = :statut_actuel, 
                    motif_rejet = :motif_rejet 
                    WHERE id_demande = :id";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'statut_actuel' => $this->statut_actuel,
                'motif_rejet' => $this->motif_rejet,
                'id' => $this->id_demande
            ]);
            return true;
        } catch (PDOException $e) {
            die("Erreur de modification : " . $e->getMessage());
        }
    }

    // --- LE "D" (Delete) ---
    public static function supprimerDemande($pdo, $id) {
        try {
            $sql = "DELETE FROM demande_document WHERE id_demande = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }

    // --- UTILITAIRE : Récupérer les types de documents pour le select HTML ---
    public static function getTypesDocuments($pdo) {
        try {
            $sql = "SELECT * FROM type_document";
            $stmt = $pdo->query($sql);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Erreur récupération types : " . $e->getMessage());
        }
    }
}
?>