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

    public static function getAll($pdo) {
        $sql = "SELECT a.*, p.nom_poi FROM historique_affluence a LEFT JOIN point_interet p ON a.id_poi = p.id_poi ORDER BY a.id_affluence DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function getById($pdo, $id) {
        $sql = "SELECT * FROM historique_affluence WHERE id_affluence = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function add($pdo) {
        $sql = "INSERT INTO historique_affluence (id_poi, jour_semaine, heure_enregistrement, niveau_foule, commentaire) 
                VALUES (:id_poi, :jour, :heure, :niveau, :comm)";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            'id_poi' => $this->id_poi,
            'jour' => $this->jour_semaine,
            'heure' => $this->heure_enregistrement,
            'niveau' => $this->niveau_foule,
            'comm' => $this->commentaire
        ]);
    }

    public function update($pdo) {
        $sql = "UPDATE historique_affluence SET 
                id_poi = :id_poi,
                jour_semaine = :jour,
                heure_enregistrement = :heure,
                niveau_foule = :niveau,
                commentaire = :comm
                WHERE id_affluence = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            'id_poi' => $this->id_poi,
            'jour' => $this->jour_semaine,
            'heure' => $this->heure_enregistrement,
            'niveau' => $this->niveau_foule,
            'comm' => $this->commentaire,
            'id' => $this->id_affluence
        ]);
    }

    public static function delete($pdo, $id) {
        $sql = "DELETE FROM historique_affluence WHERE id_affluence = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute(['id' => $id]);
    }
}
?>
