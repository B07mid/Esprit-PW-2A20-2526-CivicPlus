<?php

class Intervention {
    private $id_intervention;
    private $id_signalement;
    private $type_intervention;
    private $equipe_responsable;
    private $date_planification;
    private $statut_intervention;
    private $commentaires_techniques;

    public function __construct($id_intervention = null, $id_signalement = null, $type_intervention = null, $equipe_responsable = null, $date_planification = null, $statut_intervention = 'en_attente', $commentaires_techniques = null) {
        $this->id_intervention = $id_intervention;
        $this->id_signalement = $id_signalement;
        $this->type_intervention = $type_intervention;
        $this->equipe_responsable = $equipe_responsable;
        $this->date_planification = $date_planification;
        $this->statut_intervention = $statut_intervention;
        $this->commentaires_techniques = $commentaires_techniques;
    }

    // Récupérer une intervention par signalement
    public static function getBySignalement($pdo, $id_signalement) {
        $sql = "SELECT * FROM intervention WHERE id_signalement = :id_sig";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id_sig' => $id_signalement]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($data) {
            return $data;
        }
        return null;
    }

    // Créer une intervention
    public function ajouterIntervention($pdo) {
        $sql = "INSERT INTO intervention (id_signalement, type_intervention, equipe_responsable, date_planification, statut_intervention, commentaires_techniques) 
                VALUES (:id_sig, :type, :equipe, :date_p, :statut, :comm)";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            'id_sig' => $this->id_signalement,
            'type' => $this->type_intervention,
            'equipe' => $this->equipe_responsable,
            'date_p' => $this->date_planification,
            'statut' => $this->statut_intervention,
            'comm' => $this->commentaires_techniques
        ]);
    }

    // Mettre à jour une intervention
    public static function updateIntervention($pdo, $id_sig, $type, $equipe, $date, $statut, $comm) {
        $sql = "UPDATE intervention SET 
                type_intervention = :type, 
                equipe_responsable = :equipe, 
                date_planification = :date, 
                statut_intervention = :statut, 
                commentaires_techniques = :comm 
                WHERE id_signalement = :id_sig";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            'type' => $type,
            'equipe' => $equipe,
            'date' => $date,
            'statut' => $statut,
            'comm' => $comm,
            'id_sig' => $id_sig
        ]);
    }

    // Récupérer toutes les interventions avec les infos du signalement (JOINTURE SQL)
    public static function getAllWithSignalement($pdo) {
        $sql = "SELECT i.*, s.titre as titre_signalement, s.num_cin 
                FROM intervention i 
                INNER JOIN signalement s ON i.id_signalement = s.id_signalement 
                ORDER BY i.date_planification DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Supprimer une intervention
    public static function supprimerIntervention($pdo, $id) {
        $sql = "DELETE FROM intervention WHERE id_intervention = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute(['id' => $id]);
    }

    /**
     * ============================================================
     * MÉTIERS AVANCÉS (CIVICPLUS ELITE)
     * ============================================================
     */

    /**
     * MÉTIER : Calcule la progression réelle du dossier (Réassurance citoyenne)
     */
    public function getProgressionNumerique() {
        $etapes = [
            'en_attente' => 20,
            'planifie' => 45,
            'en_cours' => 75,
            'en_verification' => 90,
            'termine' => 100
        ];
        return isset($etapes[$this->statut_intervention]) ? $etapes[$this->statut_intervention] : 0;
    }

    /**
     * MÉTIER : Estime le temps de résolution selon le type d'intervention
     */
    public static function estimerTempsResolution($type) {
        $matrice = [
            'Éclairage' => '2-4 heures',
            'Voirie' => '1-3 jours',
            'Eau/Assainissement' => '4-8 heures',
            'Environnement' => '24 heures',
            'Sécurité' => 'Immédiat (< 1h)'
        ];
        return isset($matrice[$type]) ? $matrice[$type] : 'En cours d\'analyse';
    }

    /**
     * MÉTIER : Calcule la charge actuelle d'une équipe (Optimisation)
     */
    public static function getChargeEquipe($pdo, $equipe) {
        $sql = "SELECT COUNT(*) as nb FROM intervention WHERE equipe_responsable = :equipe AND statut_intervention != 'termine'";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['equipe' => $equipe]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        return $res['nb'];
    }

    /**
     * SÉCURITÉ : Vérifie si le verrouillage de clôture est levé
     */
    public function peutEtreTerminee() {
        // Logique : On ne peut pas terminer si aucun commentaire technique n'est présent
        return !empty($this->commentaires_techniques) && strlen($this->commentaires_techniques) > 10;
    }
}
?>
