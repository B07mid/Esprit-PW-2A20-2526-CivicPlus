<?php

class Donation {
    private $id_don;
    private $num_cin;
    private $id_projet;
    private $montant;
    private $reference_transaction;
    private $statut_paiement;
    private $methode_paiement;
    private $flouci_transaction_id;
    private $preuve_paiement_image;
    private static $columns = null;

    // Initialise une nouvelle instance Donation avec les données fournies.
    // Tous les paramètres sont optionnels pour permettre la création partielle (ex: modification statut seul).
    public function __construct(
        $id_don = null, $num_cin = null, $id_projet = null,
        $montant = null, $reference_transaction = null, $statut_paiement = 'en_attente',
        $methode_paiement = 'credit_card', $flouci_transaction_id = null, $preuve_paiement_image = null
    ) {
        $this->id_don                = $id_don;
        $this->num_cin               = $num_cin;
        $this->id_projet             = $id_projet;
        $this->montant               = $montant;
        $this->reference_transaction = $reference_transaction;
        $this->statut_paiement       = $statut_paiement;
        $this->methode_paiement      = $methode_paiement;
        $this->flouci_transaction_id = $flouci_transaction_id;
        $this->preuve_paiement_image = $preuve_paiement_image;
    }

    private static function ensureColumns($pdo) {
        if (self::$columns !== null) {
            return;
        }

        self::$columns = [];
        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM donation");
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $column) {
                self::$columns[$column['Field']] = true;
            }

            $adds = [
                'methode_paiement' => "ADD COLUMN methode_paiement VARCHAR(30) NOT NULL DEFAULT 'credit_card' AFTER montant",
                'flouci_transaction_id' => "ADD COLUMN flouci_transaction_id VARCHAR(100) NULL AFTER reference_transaction",
                'preuve_paiement_image' => "ADD COLUMN preuve_paiement_image VARCHAR(500) NULL AFTER flouci_transaction_id",
            ];

            foreach ($adds as $name => $sql) {
                if (!isset(self::$columns[$name])) {
                    $pdo->exec("ALTER TABLE donation {$sql}");
                    self::$columns[$name] = true;
                }
            }
        } catch (PDOException $e) {
            error_log("Erreur verification colonnes donation : " . $e->getMessage());
        }
    }

    private static function hasColumn($pdo, $column) {
        self::ensureColumns($pdo);
        return isset(self::$columns[$column]);
    }

    // --- C : Ajouter une donation ---
    // Insère une nouvelle donation en base avec les données de l'objet courant.
    // Retourne true si l'insertion réussit, arrête l'exécution en cas d'erreur PDO.
    public function ajouterDonation($pdo) {
        try {
            self::ensureColumns($pdo);
            $hasExtraColumns = self::hasColumn($pdo, 'methode_paiement')
                && self::hasColumn($pdo, 'flouci_transaction_id')
                && self::hasColumn($pdo, 'preuve_paiement_image');
            $sql = $hasExtraColumns
                ? "INSERT INTO donation
                    (num_cin, id_projet, montant, methode_paiement, reference_transaction,
                     flouci_transaction_id, preuve_paiement_image, statut_paiement)
                    VALUES (:num_cin, :id_projet, :montant, :methode_paiement, :reference_transaction,
                            :flouci_transaction_id, :preuve_paiement_image, :statut_paiement)"
                : "INSERT INTO donation
                    (num_cin, id_projet, montant, reference_transaction, statut_paiement)
                    VALUES (:num_cin, :id_projet, :montant, :reference_transaction, :statut_paiement)";
            $stmt = $pdo->prepare($sql);
            $params = [
                'num_cin'               => $this->num_cin,
                'id_projet'             => $this->id_projet,
                'montant'               => $this->montant,
                'reference_transaction' => $this->reference_transaction,
                'statut_paiement'       => $this->statut_paiement,
            ];
            if ($hasExtraColumns) {
                $params['methode_paiement'] = $this->methode_paiement;
                $params['flouci_transaction_id'] = $this->flouci_transaction_id;
                $params['preuve_paiement_image'] = $this->preuve_paiement_image;
            }
            $stmt->execute($params);
            return true;
        } catch (PDOException $e) {
            die("Erreur lors de l'ajout de la donation : " . $e->getMessage());
        }
    }

    // --- R : Toutes les donations ---
    // Retourne toutes les donations triées par ID décroissant (les plus récentes en premier).
    public static function getAllDonations($pdo) {
        try {
            self::ensureColumns($pdo);
            $select = '*';
            if (!self::hasColumn($pdo, 'methode_paiement')) $select .= ", '' AS methode_paiement";
            if (!self::hasColumn($pdo, 'flouci_transaction_id')) $select .= ", '' AS flouci_transaction_id";
            if (!self::hasColumn($pdo, 'preuve_paiement_image')) $select .= ", '' AS preuve_paiement_image";
            $stmt = $pdo->query("SELECT $select FROM donation ORDER BY id_don DESC");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Erreur : " . $e->getMessage());
        }
    }

    // --- R : Donations par projet ---
    // Retourne toutes les donations liées à un projet spécifique, triées par ID décroissant.
    public static function getDonationsByProjet($pdo, $id_projet) {
        try {
            self::ensureColumns($pdo);
            $select = '*';
            if (!self::hasColumn($pdo, 'methode_paiement')) $select .= ", '' AS methode_paiement";
            if (!self::hasColumn($pdo, 'flouci_transaction_id')) $select .= ", '' AS flouci_transaction_id";
            if (!self::hasColumn($pdo, 'preuve_paiement_image')) $select .= ", '' AS preuve_paiement_image";
            $stmt = $pdo->prepare("SELECT $select FROM donation WHERE id_projet = :id ORDER BY id_don DESC");
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
