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
    private $note_citoyen;
    private $avis_citoyen;

    public function __construct($id_signalement = null, $num_cin = null, $titre = null, $description = null, $photo_url = null, $statut = 'ouvert', $niveau_priorite = null, $date_signalement = null, $latitude = null, $longitude = null, $note_citoyen = null, $avis_citoyen = null) {
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
        $this->note_citoyen = $note_citoyen;
        $this->avis_citoyen = $avis_citoyen;
    }

    private static $columnCache = [];

    private static function hasColumn($pdo, $column) {
        $cacheKey = 'signalement.' . $column;
        if (array_key_exists($cacheKey, self::$columnCache)) {
            return self::$columnCache[$cacheKey];
        }

        try {
            $stmt = $pdo->prepare(
                "SELECT COUNT(*)
                 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'signalement'
                   AND COLUMN_NAME = :column"
            );
            $stmt->execute(['column' => $column]);
            self::$columnCache[$cacheKey] = ((int) $stmt->fetchColumn()) > 0;
        } catch (PDOException $e) {
            self::$columnCache[$cacheKey] = false;
        }

        return self::$columnCache[$cacheKey];
    }

    private static function selectColumns($pdo) {
        $columns = 's.*';
        if (!self::hasColumn($pdo, 'latitude')) {
            $columns .= ', NULL AS latitude';
        }
        if (!self::hasColumn($pdo, 'longitude')) {
            $columns .= ', NULL AS longitude';
        }
        if (!self::hasColumn($pdo, 'note_citoyen')) {
            $columns .= ', NULL AS note_citoyen';
        }
        if (!self::hasColumn($pdo, 'avis_citoyen')) {
            $columns .= ', NULL AS avis_citoyen';
        }

        return $columns;
    }

    // Enregistrer l'avis du citoyen (Note + Commentaire)
    public static function saveFeedback($pdo, $id, $note, $commentaire) {
        // Tentative d'ajout des colonnes si elles n'existent pas (Auto-migration)
        try {
            $pdo->exec("ALTER TABLE signalement ADD COLUMN IF NOT EXISTS note_citoyen INT DEFAULT NULL");
            $pdo->exec("ALTER TABLE signalement ADD COLUMN IF NOT EXISTS avis_citoyen TEXT DEFAULT NULL");
        } catch (Exception $e) { /* On ignore si déjà présent */ }

        $sql = "UPDATE signalement SET note_citoyen = :note, avis_citoyen = :avis WHERE id_signalement = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            'note' => $note,
            'avis' => $commentaire,
            'id' => $id
        ]);
    }

    // Ajouter un signalement
    public function ajouterSignalement($pdo) {
        try {
            $columns = ['num_cin', 'titre', 'description', 'photo_url', 'statut', 'niveau_priorite'];
            $placeholders = [':num_cin', ':titre', ':description', ':photo_url', ':statut', ':niveau_priorite'];
            $params = [
                'num_cin' => $this->num_cin,
                'titre' => $this->titre,
                'description' => $this->description,
                'photo_url' => $this->photo_url,
                'statut' => $this->statut,
                'niveau_priorite' => $this->niveau_priorite
            ];

            if (self::hasColumn($pdo, 'latitude')) {
                $columns[] = 'latitude';
                $placeholders[] = ':latitude';
                $params['latitude'] = $this->latitude;
            }

            if (self::hasColumn($pdo, 'longitude')) {
                $columns[] = 'longitude';
                $placeholders[] = ':longitude';
                $params['longitude'] = $this->longitude;
            }

            $sql = "INSERT INTO signalement (" . implode(', ', $columns) . ")
                    VALUES (" . implode(', ', $placeholders) . ")";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            return true;
        } catch (PDOException $e) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            exit();
        }
    }

    // Récupérer tous les signalements
    public static function getAll($pdo) {
        $sql = "SELECT " . self::selectColumns($pdo) . " FROM signalement s
                ORDER BY (niveau_priorite = 'SOS_VITALE') DESC, date_signalement DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Récupérer les signalements par CIN
    public static function getByCin($pdo, $cin) {
        $sql = "SELECT " . self::selectColumns($pdo) . " FROM signalement s WHERE num_cin = :cin ORDER BY date_signalement DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['cin' => $cin]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Supprimer un signalement
    public static function supprimer($pdo, $id) {
        $sqlIntervention = "DELETE FROM intervention_maintenance WHERE id_signalement = :id";
        $stmtIntervention = $pdo->prepare($sqlIntervention);
        $stmtIntervention->execute(['id' => $id]);

        $sql = "DELETE FROM signalement WHERE id_signalement = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute(['id' => $id]);
    }

    // Récupérer un signalement citoyen par ID + CIN
    public static function getOneByCin($pdo, $id, $cin) {
        $sql = "SELECT " . self::selectColumns($pdo) . "
                FROM signalement s
                WHERE s.id_signalement = :id AND s.num_cin = :cin
                LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'id' => $id,
            'cin' => $cin
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    // Mettre à jour (Citoyen)
    public static function update($pdo, $id, $titre, $description) {
        $sql = "UPDATE signalement SET titre = :titre, description = :description WHERE id_signalement = :id AND statut = 'ouvert'";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            'titre' => $titre,
            'description' => $description,
            'id' => $id
        ]);
    }

    // Mettre à jour (Citoyen connecté) avec contrôle de propriété
    public static function updateByCin($pdo, $id, $cin, $titre, $description) {
        $sql = "UPDATE signalement
                SET titre = :titre, description = :description
                WHERE id_signalement = :id
                  AND num_cin = :cin
                  AND statut = 'ouvert'";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'titre' => $titre,
            'description' => $description,
            'id' => $id,
            'cin' => $cin
        ]);
        return $stmt->rowCount() > 0;
    }

    // Supprimer (Citoyen connecté) avec contrôle de propriété
    public static function supprimerByCin($pdo, $id, $cin) {
        $sqlCheck = "SELECT id_signalement
                     FROM signalement
                     WHERE id_signalement = :id
                       AND num_cin = :cin
                       AND statut = 'ouvert'
                     LIMIT 1";
        $stmtCheck = $pdo->prepare($sqlCheck);
        $stmtCheck->execute([
            'id' => $id,
            'cin' => $cin
        ]);
        if (!$stmtCheck->fetchColumn()) {
            return false;
        }

        $sqlIntervention = "DELETE FROM intervention_maintenance WHERE id_signalement = :id";
        $stmtIntervention = $pdo->prepare($sqlIntervention);
        $stmtIntervention->execute(['id' => $id]);

        $sqlDelete = "DELETE FROM signalement WHERE id_signalement = :id AND num_cin = :cin AND statut = 'ouvert'";
        $stmtDelete = $pdo->prepare($sqlDelete);
        $stmtDelete->execute([
            'id' => $id,
            'cin' => $cin
        ]);
        return $stmtDelete->rowCount() > 0;
    }

    // Mettre à jour statut/priorité (Admin)
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

    public function calculerPrioriteAutomatique() {
        $motsCritiques = ['gaz', 'danger', 'électrique', 'incendie', 'effondrement', 'inondation', 'accident'];
        $motsMoyens = ['panne', 'fuite', 'trou', 'déchet', 'odeur', 'bruit'];
        $texte = strtolower($this->titre . ' ' . $this->description);
        foreach ($motsCritiques as $mot) { if (strpos($texte, $mot) !== false) return 'Critique'; }
        foreach ($motsMoyens as $mot) { if (strpos($texte, $mot) !== false) return 'Moyen'; }
        return 'Bas';
    }

    public static function getTauxReussiteZone($pdo, $description) {
        $description = is_string($description) ? trim($description) : '';
        if ($description === '') return 98;
        $prefix = mb_substr($description, 0, 10, 'UTF-8');
        $sql = "SELECT COUNT(*) as total, SUM(CASE WHEN statut = 'termine' OR statut = 'résolu' THEN 1 ELSE 0 END) as resolus 
                FROM signalement WHERE description LIKE :desc";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['desc' => '%' . $prefix . '%']);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        return ($res['total'] > 5) ? round(($res['resolus'] / $res['total']) * 100) : 98;
    }

    public static function appliquerPolitiqueRetention($signalements) {
        $now = time();
        return array_filter($signalements, function($s) use ($now) {
            if ($s['statut'] !== 'termine' && $s['statut'] !== 'résolu') return true;
            if (empty($s['date_signalement'])) return true;
            $dateS = strtotime($s['date_signalement']);
            if (!$dateS) return true;
            return ($now - $dateS) < (30 * 24 * 3600);
        });
    }

    public static function getEvolutionResolutions($pdo) {
        $sql = "SELECT DATE(i.date_planification) as jour, COUNT(*) as total
                FROM intervention_maintenance i
                WHERE i.date_planification IS NOT NULL
                GROUP BY DATE(i.date_planification)
                ORDER BY jour DESC LIMIT 10";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public static function getGlobalKPIs($pdo) {
        // 1. Total interventions planifiées
        $q1 = $pdo->query("SELECT COUNT(*) FROM intervention_maintenance")->fetchColumn();
        
        // 2. Taux de succès
        $q2 = $pdo->query("SELECT COUNT(*) FROM signalement")->fetchColumn();
        $taux = ($q2 > 0) ? round(($q1 / $q2) * 100, 1) : 0;
        
        // 3. Tendance (variation des interventions planifiées)
        $last7Days = $pdo->query("SELECT COUNT(*) FROM intervention_maintenance WHERE date_planification >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn();
        $prev7Days = $pdo->query("SELECT COUNT(*) FROM intervention_maintenance WHERE date_planification >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND date_planification < DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn();
        $trend = ($prev7Days > 0) ? round((($last7Days - $prev7Days) / $prev7Days) * 100, 1) : ($last7Days > 0 ? 100 : 0);

        // 4. Délai moyen
        $sqlDelay = "SELECT AVG(TIMESTAMPDIFF(HOUR, s.date_signalement, i.date_planification)) as avg_hours
                     FROM signalement s
                     JOIN intervention_maintenance i ON s.id_signalement = i.id_signalement
                     WHERE (s.statut = 'termine' OR s.statut = 'résolu') AND i.date_planification IS NOT NULL";
        $avgHours = $pdo->query($sqlDelay)->fetchColumn();
        
        $delai_moyen = "< 24h";
        if ($avgHours > 0) {
            if ($avgHours < 24) $delai_moyen = round($avgHours) . "h";
            else $delai_moyen = round($avgHours / 24) . "j";
        }
        
        return [
            'total_resolus' => $q1,
            'taux_succes' => $taux,
            'trend' => ($trend >= 0 ? '+' : '') . $trend . '%',
            'delai_moyen' => $delai_moyen
        ];
    }
}
?>
