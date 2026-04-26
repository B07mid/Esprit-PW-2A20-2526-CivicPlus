<?php

class ProjetCrowdfunding {
    private $id_projet;
    private $num_cin;
    private $titre;
    private $description;
    private $budget_cible;
    private $montant_actuel;
    private $statut_projet;
    private $ville;
    private $quartier;
    private $latitude;
    private $longitude;

    // Initialise une nouvelle instance ProjetCrowdfunding.
    // Tous les champs sont optionnels pour permettre la création partielle (ex: mise à jour seule).
    public function __construct(
        $id_projet = null, $num_cin = null, $titre = null, $description = null,
        $budget_cible = null, $montant_actuel = 0,
        $statut_projet = 'en_recherche_financement',
        $ville = null, $quartier = null, $latitude = null, $longitude = null
    ) {
        $this->id_projet      = $id_projet;
        $this->num_cin        = $num_cin;
        $this->titre          = $titre;
        $this->description    = $description;
        $this->budget_cible   = $budget_cible;
        $this->montant_actuel = $montant_actuel;
        $this->statut_projet  = $statut_projet;
        $this->ville          = $ville;
        $this->quartier       = $quartier;
        $this->latitude       = $latitude;
        $this->longitude      = $longitude;
    }

    // --- C : Ajouter un projet ---
    // Insère un nouveau projet crowdfunding en base avec toutes ses données (titre, budget, localisation, etc.).
    public function ajouterProjet($pdo) {
        try {
            $sql = "INSERT INTO projet_crowdfunding
                    (num_cin, titre, description, budget_cible, montant_actuel,
                     statut_projet, ville, quartier, latitude, longitude)
                    VALUES (:num_cin, :titre, :description, :budget_cible, :montant_actuel,
                            :statut_projet, :ville, :quartier, :latitude, :longitude)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'num_cin'        => $this->num_cin,
                'titre'          => $this->titre,
                'description'    => $this->description,
                'budget_cible'   => $this->budget_cible,
                'montant_actuel' => $this->montant_actuel,
                'statut_projet'  => $this->statut_projet,
                'ville'          => $this->ville,
                'quartier'       => $this->quartier,
                'latitude'       => $this->latitude,
                'longitude'      => $this->longitude,
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
            $stmt = $pdo->query("SELECT * FROM projet_crowdfunding ORDER BY id_projet DESC");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Erreur : " . $e->getMessage());
        }
    }

    // --- R : Un seul projet ---
    // Retourne les données d'un projet spécifique via son ID, ou false s'il n'existe pas.
    public static function getProjetById($pdo, $id) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM projet_crowdfunding WHERE id_projet = :id");
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Erreur : " . $e->getMessage());
        }
    }

    // --- U : Modifier un projet ---
    // Met à jour les champs éditables d'un projet existant (titre, description, budget, statut, ville, quartier).
    public function modifierProjet($pdo) {
        try {
            $sql = "UPDATE projet_crowdfunding SET
                    statut_projet = :statut_projet,
                    titre         = :titre,
                    description   = :description,
                    budget_cible  = :budget_cible,
                    ville         = :ville,
                    quartier      = :quartier
                    WHERE id_projet = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'statut_projet' => $this->statut_projet,
                'titre'         => $this->titre,
                'description'   => $this->description,
                'budget_cible'  => $this->budget_cible,
                'ville'         => $this->ville,
                'quartier'      => $this->quartier,
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
}
?>
