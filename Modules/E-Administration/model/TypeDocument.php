<?php

class TypeDocument {
    private $id_type;
    private $libelle;
    private $duree_validite_mois;

    public function __construct($id_type = null, $libelle = null, $duree_validite_mois = null) {
        $this->id_type = $id_type;
        $this->libelle = $libelle;
        $this->duree_validite_mois = $duree_validite_mois;
    }

    // --- C : Ajouter un type ---
    public function ajouterType($pdo) {
        try {
            $sql = "INSERT INTO type_document (libelle, duree_validite_mois) VALUES (:libelle, :duree)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'libelle' => $this->libelle,
                'duree' => $this->duree_validite_mois
            ]);
            return true;
        } catch (PDOException $e) {
            die("Erreur d'ajout : " . $e->getMessage());
        }
    }

    // --- R : Lire tous les types ---
    public static function getAllTypes($pdo) {
        try {
            $sql = "SELECT * FROM type_document ORDER BY id_type DESC";
            $stmt = $pdo->query($sql);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Erreur de récupération : " . $e->getMessage());
        }
    }

    // --- U : Modifier un type ---
    public function modifierType($pdo) {
        try {
            $sql = "UPDATE type_document SET libelle = :libelle, duree_validite_mois = :duree WHERE id_type = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'libelle' => $this->libelle,
                'duree' => $this->duree_validite_mois,
                'id' => $this->id_type
            ]);
            return true;
        } catch (PDOException $e) {
            die("Erreur de modification : " . $e->getMessage());
        }
    }

    // --- D : Supprimer un type ---
    public static function supprimerType($pdo, $id) {
        try {
            $sql = "DELETE FROM type_document WHERE id_type = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return true;
        } catch (PDOException $e) {
            return false; // Échoue souvent s'il y a une contrainte de clé étrangère (demandes existantes)
        }
    }
}
?>


