<?php

class ProjetCrowdfunding {
    private $id_projet;
    private $num_cin;
    private $titre;
    private $type_projet;
    private $description;
    private $budget_cible;
    private $montant_actuel;
    private $statut_projet;
    private $ville;
    private $quartier;
    private $latitude;
    private $longitude;
    private $image_url;

    // Initialise une nouvelle instance ProjetCrowdfunding.
    // Tous les champs sont optionnels pour permettre la création partielle (ex: mise à jour seule).
    public function __construct(
        $id_projet = null, $num_cin = null, $titre = null, $description = null,
        $budget_cible = null, $montant_actuel = 0,
        $statut_projet = 'en_cours',
        $ville = null, $quartier = null, $latitude = null, $longitude = null,
        $type_projet = 'autre', $image_url = null
    ) {
        $this->id_projet      = $id_projet;
        $this->num_cin        = $num_cin;
        $this->titre          = $titre;
        $this->type_projet    = $type_projet;
        $this->description    = $description;
        $this->budget_cible   = $budget_cible;
        $this->montant_actuel = $montant_actuel;
        $this->statut_projet  = $statut_projet;
        $this->ville          = $ville;
        $this->quartier       = $quartier;
        $this->latitude       = $latitude;
        $this->longitude      = $longitude;
        $this->image_url      = $image_url;
    }

    public static function assurerColonnesSuivi($pdo) {
        try {
            $colonnes = [];
            $stmt = $pdo->query("SHOW COLUMNS FROM projet_crowdfunding");
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $colonne) {
                $colonnes[$colonne['Field']] = true;
            }

            $ajouts = [
                'image_url' => "ADD COLUMN image_url VARCHAR(500) NULL",
                'decision_admin' => "ADD COLUMN decision_admin VARCHAR(30) NOT NULL DEFAULT 'en_attente'",
                'decision_admin_at' => "ADD COLUMN decision_admin_at DATETIME NULL",
                'decision_email_sent' => "ADD COLUMN decision_email_sent TINYINT(1) NOT NULL DEFAULT 0",
                'decision_email_sent_at' => "ADD COLUMN decision_email_sent_at DATETIME NULL",
                'decision_email_recipient' => "ADD COLUMN decision_email_recipient VARCHAR(150) NULL",
                'date_creation' => "ADD COLUMN date_creation DATETIME NULL DEFAULT current_timestamp()",
            ];

            foreach ($ajouts as $nomColonne => $sqlAjout) {
                if (!isset($colonnes[$nomColonne])) {
                    $pdo->exec("ALTER TABLE projet_crowdfunding {$sqlAjout}");
                }
            }

            if (!isset($colonnes['decision_admin'])) {
                $pdo->exec(
                    "UPDATE projet_crowdfunding
                     SET decision_admin = CASE
                         WHEN statut_projet = 'rejete' THEN 'rejete'
                         WHEN statut_projet = 'en_attente_validation' THEN 'en_attente'
                         ELSE 'accepte'
                     END"
                );
            }

            $pdo->exec("UPDATE projet_crowdfunding SET statut_projet = 'termine' WHERE statut_projet IN ('termine', 'terminé')");
            $pdo->exec("UPDATE projet_crowdfunding SET statut_projet = 'en_cours' WHERE statut_projet NOT IN ('en_cours', 'termine')");
            $pdo->exec("UPDATE projet_crowdfunding SET decision_admin = 'en_attente' WHERE decision_admin IS NULL OR decision_admin NOT IN ('en_attente', 'accepte', 'rejete')");
            $pdo->exec("UPDATE projet_crowdfunding SET decision_admin = 'en_attente' WHERE decision_admin = 'accepte' AND decision_admin_at IS NULL");
            $pdo->exec("UPDATE projet_crowdfunding SET date_creation = COALESCE(date_creation, decision_admin_at, NOW()) WHERE date_creation IS NULL");
            $pdo->exec("UPDATE projet_crowdfunding SET date_creation = decision_admin_at WHERE decision_admin_at IS NOT NULL AND date_creation > decision_admin_at");
        } catch (PDOException $e) {
            error_log("Erreur verification colonnes projet_crowdfunding : " . $e->getMessage());
        }
    }

    // --- C : Ajouter un projet ---
    // Insère un nouveau projet crowdfunding en base avec toutes ses données (titre, budget, localisation, etc.).
    public function ajouterProjet($pdo) {
        try {
            self::assurerColonnesSuivi($pdo);

            $sql = "INSERT INTO projet_crowdfunding
                    (num_cin, titre, type_projet, description, budget_cible, montant_actuel,
                     statut_projet, ville, quartier, latitude, longitude, image_url, decision_admin, date_creation)
                    VALUES (:num_cin, :titre, :type_projet, :description, :budget_cible, :montant_actuel,
                            :statut_projet, :ville, :quartier, :latitude, :longitude, :image_url, 'en_attente', NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'num_cin'        => $this->num_cin,
                'titre'          => $this->titre,
                'type_projet'    => $this->type_projet,
                'description'    => $this->description,
                'budget_cible'   => $this->budget_cible,
                'montant_actuel' => $this->montant_actuel,
                'statut_projet'  => $this->statut_projet,
                'ville'          => $this->ville,
                'quartier'       => $this->quartier,
                'latitude'       => $this->latitude,
                'longitude'      => $this->longitude,
                'image_url'      => $this->image_url,
            ]);
            return true;
        } catch (PDOException $e) {
            die("Erreur lors de l'ajout du projet : " . $e->getMessage());
        }
    }

    // --- R : Tous les projets ---
    // Retourne la liste complète des projets crowdfunding, triés du plus récent au plus ancien.
    public static function getAllProjets($pdo) {
        try {
            self::assurerColonnesSuivi($pdo);

            $stmt = $pdo->query(
                "SELECT p.*, c.email, c.nom, c.prenom
                 FROM projet_crowdfunding p
                 LEFT JOIN citoyen c ON c.num_cin = p.num_cin
                 ORDER BY p.id_projet DESC"
            );
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Erreur : " . $e->getMessage());
        }
    }

    public static function getPublicProjets($pdo) {
        try {
            self::assurerColonnesSuivi($pdo);

            $stmt = $pdo->query(
                "SELECT p.*,
                        c.citoyen_id AS createur_citoyen_id,
                        c.nom AS createur_nom,
                        c.prenom AS createur_prenom,
                        c.photo AS createur_photo
                 FROM projet_crowdfunding p
                 LEFT JOIN citoyen c ON c.num_cin = p.num_cin
                 WHERE p.decision_admin = 'accepte'
                   AND p.decision_admin_at IS NOT NULL
                 ORDER BY p.id_projet DESC"
            );
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Erreur : " . $e->getMessage());
        }
    }

    // --- R : Un seul projet ---
    // Retourne les données d'un projet spécifique via son ID, ou false s'il n'existe pas.
    public static function getProjetById($pdo, $id) {
        try {
            self::assurerColonnesSuivi($pdo);

            $stmt = $pdo->prepare("SELECT * FROM projet_crowdfunding WHERE id_projet = :id");
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Erreur : " . $e->getMessage());
        }
    }

    public static function countDemandes($pdo) {
        try {
            self::assurerColonnesSuivi($pdo);

            $stmt = $pdo->query("SELECT COUNT(*) FROM projet_crowdfunding WHERE decision_admin = 'en_attente'");
            return (int) $stmt->fetchColumn();
        } catch (PDOException $e) {
            return 0;
        }
    }

    public static function getProjetAvecCitoyen($pdo, $id) {
        try {
            self::assurerColonnesSuivi($pdo);

            $stmt = $pdo->prepare(
                "SELECT p.*, c.nom, c.prenom, c.email
                 FROM projet_crowdfunding p
                 LEFT JOIN citoyen c ON c.num_cin = p.num_cin
                 WHERE p.id_projet = :id
                 LIMIT 1"
            );
            $stmt->execute(['id' => $id]);
            $projet = $stmt->fetch(PDO::FETCH_ASSOC);

            return $projet ?: null;
        } catch (PDOException $e) {
            die("Erreur : " . $e->getMessage());
        }
    }

    // --- U : Modifier un projet ---
    // Met à jour les champs éditables d'un projet existant (titre, description, budget, statut, ville, quartier).
    public function modifierProjet($pdo) {
        try {
            self::assurerColonnesSuivi($pdo);

            $sql = "UPDATE projet_crowdfunding SET
                    statut_projet = :statut_projet,
                    titre         = :titre,
                    description   = :description,
                    budget_cible  = :budget_cible,
                    ville         = :ville,
                    quartier      = :quartier,
                    image_url     = :image_url
                    WHERE id_projet = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'statut_projet' => $this->statut_projet,
                'titre'         => $this->titre,
                'description'   => $this->description,
                'budget_cible'  => $this->budget_cible,
                'ville'         => $this->ville,
                'quartier'      => $this->quartier,
                'image_url'     => $this->image_url,
                'id'            => $this->id_projet,
            ]);
            return true;
        } catch (PDOException $e) {
            die("Erreur de modification : " . $e->getMessage());
        }
    }

    // --- D : Supprimer un projet ---
    // Supprime définitivement un projet par son ID. Retourne true si réussi, false en cas d'erreur.
    public static function supprimerProjet($pdo, $id) {
        try {
            self::assurerColonnesSuivi($pdo);

            $stmt = $pdo->prepare("DELETE FROM projet_crowdfunding WHERE id_projet = :id");
            $stmt->execute(['id' => $id]);
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }

    // Recalculer montant_actuel depuis les donations confirmées
    public static function refreshRaised($pdo, $id_projet) {
        try {
            self::assurerColonnesSuivi($pdo);

            $stmt = $pdo->prepare(
                "UPDATE projet_crowdfunding
                 SET montant_actuel = (
                     SELECT COALESCE(SUM(montant), 0)
                     FROM donation
                     WHERE id_projet = :id AND statut_paiement = 'confirmé'
                 )
                 WHERE id_projet = :id2"
            );
            $stmt->execute(['id' => $id_projet, 'id2' => $id_projet]);
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }

    public static function enregistrerStatutEmailDecision($pdo, $id, $emailEnvoye, $destinataire = null) {
        try {
            self::assurerColonnesSuivi($pdo);

            $stmt = $pdo->prepare(
                "UPDATE projet_crowdfunding SET
                    decision_email_sent = :email_envoye,
                    decision_email_sent_at = :date_email,
                    decision_email_recipient = :destinataire
                 WHERE id_projet = :id"
            );

            return $stmt->execute([
                'email_envoye' => $emailEnvoye ? 1 : 0,
                'date_email' => $emailEnvoye ? date('Y-m-d H:i:s') : null,
                'destinataire' => $destinataire,
                'id' => $id
            ]);
        } catch (PDOException $e) {
            error_log("Erreur statut email projet : " . $e->getMessage());
            return false;
        }
    }

    public static function changerDecisionAdmin($pdo, $id, $decision) {
        try {
            self::assurerColonnesSuivi($pdo);

            if (!in_array($decision, ['en_attente', 'accepte', 'rejete'], true)) {
                return false;
            }

            $stmt = $pdo->prepare(
                "UPDATE projet_crowdfunding
                 SET decision_admin = :decision,
                     decision_admin_at = NOW(),
                     decision_email_sent = 0,
                     decision_email_sent_at = NULL,
                     decision_email_recipient = NULL
                 WHERE id_projet = :id"
            );

            return $stmt->execute([
                'decision' => $decision,
                'id' => $id
            ]);
        } catch (PDOException $e) {
            error_log("Erreur decision admin projet : " . $e->getMessage());
            return false;
        }
    }
}
?>
