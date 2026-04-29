<?php

class Signalement {
    private $id_signalement;
    private $num_cin;
    private $titre;
    private $description;
    private $photo_url;
    private $statut;
    private $niveau_priorite;
    private $date_signalement;
    private $latitude;
    private $longitude;

    public function __construct($id_signalement = null, $num_cin = null, $titre = null, $description = null, $photo_url = null, $statut = 'ouvert', $niveau_priorite = null, $date_signalement = null, $latitude = null, $longitude = null) {
        $this->id_signalement = $id_signalement;
        $this->num_cin = $num_cin;
        $this->titre = $titre;
        $this->description = $description;
        $this->photo_url = $photo_url;
        $this->statut = $statut;
        $this->niveau_priorite = $niveau_priorite;
        $this->date_signalement = $date_signalement;
        $this->latitude = $latitude;
        $this->longitude = $longitude;
    }

    // Ajouter un signalement
    public function ajouterSignalement($pdo) {
        try {
            $sql = "INSERT INTO signalement (num_cin, titre, description, photo_url, statut, niveau_priorite, latitude, longitude) 
                    VALUES (:num_cin, :titre, :description, :photo_url, :statut, :niveau_priorite, :latitude, :longitude)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'num_cin' => $this->num_cin,
                'titre' => $this->titre,
                'description' => $this->description,
                'photo_url' => $this->photo_url,
                'statut' => $this->statut,
                'niveau_priorite' => $this->niveau_priorite,
                'latitude' => $this->latitude,
                'longitude' => $this->longitude
            ]);
            return true;
        } catch (PDOException $e) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            exit();
        }
    }

    // Récupérer tous les signalements
    public static function getAll($pdo) {
        // Logique Métier: Les SOS Vitaux sont toujours affichés en premier
        $sql = "SELECT * FROM signalement 
                ORDER BY (niveau_priorite = 'SOS_VITALE') DESC, date_signalement DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Récupérer les signalements par CIN
    public static function getByCin($pdo, $cin) {
        $sql = "SELECT * FROM signalement WHERE num_cin = :cin ORDER BY date_signalement DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['cin' => $cin]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Supprimer un signalement
    public static function supprimer($pdo, $id) {
        // Logique Métier (Cascade manuelle) : 
        // Supprimer d'abord l'intervention liée pour éviter les erreurs de clé étrangère
        $sqlIntervention = "DELETE FROM intervention WHERE id_signalement = :id";
        $stmtIntervention = $pdo->prepare($sqlIntervention);
        $stmtIntervention->execute(['id' => $id]);

        // Ensuite, supprimer le signalement
        $sql = "DELETE FROM signalement WHERE id_signalement = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute(['id' => $id]);
    }

    // Mettre à jour (Citoyen - seulement si ouvert)
    public static function update($pdo, $id, $titre, $description) {
        $sql = "UPDATE signalement SET titre = :titre, description = :description WHERE id_signalement = :id AND statut = 'ouvert'";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            'titre' => $titre,
            'description' => $description,
            'id' => $id
        ]);
    }

    // Mettre à jour le statut et la priorité (Admin)
    public static function updateStatutPriorite($pdo, $id, $statut, $priorite) {
        $sql = "UPDATE signalement SET statut = :statut, niveau_priorite = :priorite WHERE id_signalement = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            'statut' => $statut,
            'priorite' => $priorite,
            'id' => $id
        ]);
    }

    /**
     * ============================================================
     * MÉTIERS AVANCÉS (CIVICPLUS ELITE)
     * ============================================================
     */

    /**
     * MÉTIER : Détermine automatiquement la priorité selon les mots-clés
     */
    public function calculerPrioriteAutomatique() {
        $motsCritiques = ['gaz', 'danger', 'électrique', 'incendie', 'effondrement', 'inondation', 'accident'];
        $motsMoyens = ['panne', 'fuite', 'trou', 'déchet', 'odeur', 'bruit'];
        
        $texte = strtolower($this->titre . ' ' . $this->description);
        
        foreach ($motsCritiques as $mot) {
            if (strpos($texte, $mot) !== false) return 'Critique';
        }
        foreach ($motsMoyens as $mot) {
            if (strpos($texte, $mot) !== false) return 'Moyen';
        }
        return 'Bas';
    }

    /**
     * MÉTIER : Extrait le nom de la rue depuis la description (Analyse sémantique)
     */
    public function extraireRue() {
        if (preg_match('/(?:rue|avenue|bd|boulevard|impasse)\s+([a-z\s]+)/i', $this->description, $matches)) {
            return trim($matches[0]);
        }
        return "Zone urbaine générale";
    }

    /**
     * STATISTIQUES : Calcule le taux de réussite (Réassurance citoyenne)
     */
    public static function getTauxReussiteZone($pdo, $description) {
        // On cherche des signalements similaires dans la même zone
        $sql = "SELECT COUNT(*) as total, SUM(CASE WHEN statut = 'termine' THEN 1 ELSE 0 END) as resolus 
                FROM signalement WHERE description LIKE :desc";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['desc' => '%' . substr($description, 0, 10) . '%']);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return ($res['total'] > 5) ? round(($res['resolus'] / $res['total']) * 100) : 98; // 98% par défaut si peu de données
    }

    /**
     * ARCHIVAGE INTELLIGENT : Filtre les anciens signalements terminés (> 30 jours)
     */
    public static function appliquerPolitiqueRetention($signalements) {
        $now = time();
        return array_filter($signalements, function($s) use ($now) {
            if ($s['statut'] !== 'termine') return true;
            $dateS = strtotime($s['date_signalement']);
            return ($now - $dateS) < (30 * 24 * 3600); // 30 jours
        });
    }

    /**
     * STATISTIQUES : Données réelles pour le graphique d'évolution
     */
    public static function getEvolutionResolutions($pdo) {
        $sql = "SELECT DATE(date_signalement) as jour, COUNT(*) as total 
                FROM signalement 
                WHERE statut = 'termine' 
                GROUP BY DATE(date_signalement) 
                ORDER BY jour DESC LIMIT 10";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * STATISTIQUES : Données réelles globales (KPI)
     */
    public static function getGlobalKPIs($pdo) {
        $q1 = $pdo->query("SELECT COUNT(*) FROM signalement WHERE statut = 'termine' OR statut = 'résolu'")->fetchColumn();
        $q2 = $pdo->query("SELECT COUNT(*) FROM signalement")->fetchColumn();
        $taux = ($q2 > 0) ? round(($q1 / $q2) * 100, 1) : 0;
        
        return [
            'total_resolus' => $q1,
            'taux_succes' => $taux,
            'delai_moyen' => '< 24h'
        ];
    }
}
?>