<?php

class Signalement {
    // Propriétés basées sur civicplus.sql
    private $id_signalement;
    private $num_cin;
    private $titre;
    private $description;
    private $photo_url;
    private $date_signalement;
    private $statut;
    private $niveau_priorite;

    public function __construct($id_signalement = null, $num_cin = null, $titre = null, $description = null, $photo_url = null, $statut = 'ouvert', $niveau_priorite = null, $date_signalement = null) {
        $this->id_signalement = $id_signalement;
        $this->num_cin = $num_cin;
        $this->titre = $titre;
        $this->description = $description;
        $this->photo_url = $photo_url;
        $this->statut = $statut;
        $this->niveau_priorite = $niveau_priorite;
        $this->date_signalement = $date_signalement;
    }

    // --- C : Le citoyen ajoute un signalement ---
    public function ajouterSignalement($pdo) {
        try {
            // La date_signalement est gérée par le DEFAULT CURRENT_TIMESTAMP de la BDD
            $sql = "INSERT INTO signalement (num_cin, titre, description, photo_url, statut, niveau_priorite) 
                    VALUES (:num_cin, :titre, :description, :photo_url, :statut, :niveau_priorite)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'num_cin' => $this->num_cin,
                'titre' => $this->titre,
                'description' => $this->description,
                'photo_url' => $this->photo_url,
                'statut' => $this->statut,
                'niveau_priorite' => $this->niveau_priorite
            ]);
            return true;
        } catch (PDOException $e) {
            die("Erreur lors du signalement : " . $e->getMessage());
        }
    }

    // --- R : L'Admin récupère tous les signalements ---
    public static function getAllSignalements($pdo) {
        try {
            $sql = "SELECT * FROM signalement ORDER BY date_signalement DESC";
            $stmt = $pdo->query($sql);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Erreur fetching Signalements: " . $e->getMessage());
        }
    }

    // --- R : Le citoyen récupère uniquement ses propres signalements ---
    public static function getSignalementsByCin($pdo, $cin) {
        try {
            $sql = "SELECT * FROM signalement WHERE num_cin = :cin ORDER BY date_signalement DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['cin' => $cin]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Erreur fetching Portfolio Signalements: " . $e->getMessage());
        }
    }

    // --- U : L'Admin met à jour le statut ou la priorité ---
    public function modifierSignalement($pdo) {
        try {
            $sql = "UPDATE signalement SET 
                    statut = :statut, 
                    niveau_priorite = :niveau_priorite 
                    WHERE id_signalement = :id";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'statut' => $this->statut,
                'niveau_priorite' => $this->niveau_priorite,
                'id' => $this->id_signalement
            ]);
            return true;
        } catch (PDOException $e) {
            die("Erreur de modification : " . $e->getMessage());
        }
    }

    // --- D : Supprimer un signalement ---
    public static function supprimerSignalement($pdo, $id) {
        try {
            $sql = "DELETE FROM signalement WHERE id_signalement = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }
}
?>


