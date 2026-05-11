<?php
class Affluence {
    private $id_affluence;
    private $id_poi;
    private $jour_semaine;
    private $heure_enregistrement;
    private $niveau_foule;
    private $commentaire;

    public function __construct($id_affluence = null, $id_poi = null, $jour_semaine = null, $heure_enregistrement = null, $niveau_foule = null, $commentaire = null) {
        $this->id_affluence = $id_affluence;
        $this->id_poi = $id_poi;
        $this->jour_semaine = $jour_semaine;
        $this->heure_enregistrement = $heure_enregistrement;
        $this->niveau_foule = $niveau_foule;
        $this->commentaire = $commentaire;
    }

    private static $columnCache = [];

    private static function hasColumn($pdo, $column) {
        $cacheKey = 'historique_affluence.' . $column;
        if (array_key_exists($cacheKey, self::$columnCache)) {
            return self::$columnCache[$cacheKey];
        }

        try {
            $stmt = $pdo->prepare(
                "SELECT COUNT(*)
                 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'historique_affluence'
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
        $columns = 'a.*';
        if (!self::hasColumn($pdo, 'commentaire')) {
            $columns .= ', NULL AS commentaire';
        }

        return $columns;
    }

    public static function getAll($pdo) {
        $sql = "SELECT " . self::selectColumns($pdo) . ", p.nom_poi FROM historique_affluence a LEFT JOIN point_interet p ON a.id_poi = p.id_poi ORDER BY a.id_affluence DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function getById($pdo, $id) {
        $sql = "SELECT " . self::selectColumns($pdo) . " FROM historique_affluence a WHERE id_affluence = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function add($pdo) {
        $columns = ['id_poi', 'jour_semaine', 'heure_enregistrement', 'niveau_foule'];
        $placeholders = [':id_poi', ':jour', ':heure', ':niveau'];
        $params = [
            'id_poi' => $this->id_poi,
            'jour' => $this->jour_semaine,
            'heure' => $this->heure_enregistrement,
            'niveau' => $this->niveau_foule
        ];

        if (self::hasColumn($pdo, 'commentaire')) {
            $columns[] = 'commentaire';
            $placeholders[] = ':comm';
            $params['comm'] = $this->commentaire;
        }

        $sql = "INSERT INTO historique_affluence (" . implode(', ', $columns) . ")
                VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute($params);
    }

    public function update($pdo) {
        $sets = [
            'id_poi = :id_poi',
            'jour_semaine = :jour',
            'heure_enregistrement = :heure',
            'niveau_foule = :niveau'
        ];
        $params = [
            'id_poi' => $this->id_poi,
            'jour' => $this->jour_semaine,
            'heure' => $this->heure_enregistrement,
            'niveau' => $this->niveau_foule,
            'id' => $this->id_affluence
        ];

        if (self::hasColumn($pdo, 'commentaire')) {
            $sets[] = 'commentaire = :comm';
            $params['comm'] = $this->commentaire;
        }

        $sql = "UPDATE historique_affluence SET " . implode(', ', $sets) . " WHERE id_affluence = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute($params);
    }

    public static function delete($pdo, $id) {
        $sql = "DELETE FROM historique_affluence WHERE id_affluence = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute(['id' => $id]);
    }
}
?>
