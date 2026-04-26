<?php

class Donation {
    private $id_don;
    private $num_cin;
    private $id_projet;
    private $montant;
    private $reference_transaction;
    private $statut_paiement;

    // Initialise une nouvelle instance Donation avec les données fournies.
    // Tous les paramètres sont optionnels pour permettre la création partielle (ex: modification statut seul).
    public function __construct(
        $id_don = null, $num_cin = null, $id_projet = null,
        $montant = null, $reference_transaction = null, $statut_paiement = 'en_attente'
    ) {
        $this->id_don                = $id_don;
        $this->num_cin               = $num_cin;
        $this->id_projet             = $id_projet;
        $this->montant               = $montant;
        $this->reference_transaction = $reference_transaction;
        $this->statut_paiement       = $statut_paiement;
    }

    // --- C : Ajouter une donation ---
    // Insère une nouvelle donation en base avec les données de l'objet courant.
    // Retourne true si l'insertion réussit, arrête l'exécution en cas d'erreur PDO.
    public function ajouterDonation($pdo) {
        try {
            $sql = "INSERT INTO donation
                    (num_cin, id_projet, montant, reference_transaction, statut_paiement)
                    VALUES (:num_cin, :id_projet, :montant, :reference_transaction, :statut_paiement)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'num_cin'               => $this->num_cin,
                'id_projet'             => $this->id_projet,
                'montant'               => $this->montant,
                'reference_transaction' => $this->reference_transaction,
                'statut_paiement'       => $this->statut_paiement,
            ]);
            return true;
        } catch (PDOException $e) {
            die("Erreur lors de l'ajout de la donation : " . $e->getMessage());
        }
    }

    // --- R : Toutes les donations ---
    // Retourne toutes les donations triées par ID décroissant (les plus récentes en premier).
    public static function getAllDonations($pdo) {
        try {
            $stmt = $pdo->query("SELECT * FROM donation ORDER BY id_don DESC");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Erreur : " . $e->getMessage());
        }
    }

    // --- R : Donations par projet ---
    // Retourne toutes les donations liées à un projet spécifique, triées par ID décroissant.
    public static function getDonationsByProjet($pdo, $id_projet) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM donation WHERE id_projet = :id ORDER BY id_don DESC");
            $stmt->execute(['id' => $id_projet]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Erreur : " . $e->getMessage());
        }
    }

    // --- U : Modifier le statut ---
    // Met à jour uniquement le statut de paiement d'une donation existante (par id_don).
    public function modifierDonation($pdo) {
        try {
            $stmt = $pdo->prepare("UPDATE donation SET statut_paiement = :statut WHERE id_don = :id");
            $stmt->execute(['statut' => $this->statut_paiement, 'id' => $this->id_don]);
            return true;
        } catch (PDOException $e) {
            die("Erreur de modification : " . $e->getMessage());
        }
    }

    // --- D : Supprimer une donation ---
    // Supprime définitivement une donation par son ID. Retourne true si réussi, false en cas d'erreur.
    public static function supprimerDonation($pdo, $id) {
        try {
            $stmt = $pdo->prepare("DELETE FROM donation WHERE id_don = :id");
            $stmt->execute(['id' => $id]);
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }
}

