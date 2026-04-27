<?php
class PointInteret {
    private $id_poi;
    private $nom_poi;
    private $categorie_service;
    private $latitude;
    private $longitude;
    private $adresse_postale;
    private $horaires_ouverture;
    private $contact_tel;
    private $accessible_pmr;

    // Constructor to initialize the object
    public function __construct($id_poi = null, $nom_poi = null, $categorie_service = null, $latitude = null, $longitude = null, $adresse_postale = null, $horaires_ouverture = null, $contact_tel = null, $accessible_pmr = null) {
        $this->id_poi = $id_poi;
        $this->nom_poi = $nom_poi;
        $this->categorie_service = $categorie_service;
        $this->latitude = $latitude;
        $this->longitude = $longitude;
        $this->adresse_postale = $adresse_postale;
        $this->horaires_ouverture = $horaires_ouverture;
        $this->contact_tel = $contact_tel;
        $this->accessible_pmr = $accessible_pmr;
    } 
    public function ajouterPoi($pdo) {
        try {
            $sql = "INSERT INTO point_interet (nom_poi, categorie_service, latitude, longitude, adresse_postale, horaires_ouverture, contact_tel, accessible_pmr) 
                    VALUES (:nom, :cat, :lat, :lng, :adresse, :horaires, :tel, :pmr)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'nom' => $this->nom_poi,
                'cat' => $this->categorie_service,
                'lat' => $this->latitude,
                'lng' => $this->longitude,
                'adresse' => $this->adresse_postale,
                'horaires' => $this->horaires_ouverture,
                'tel' => $this->contact_tel,
                'pmr' => $this->accessible_pmr
            ]);
            return true;
        } catch (PDOException $e) {
            die("Erreur d'ajout : " . $e->getMessage());
        }
    }
    public static function getAllPOIs($pdo) {
        try {
            $sql = "SELECT * FROM point_interet";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Erreur fetching POIs: " . $e->getMessage());
        }
    }
    // Le "D" (Delete) : Supprimer un POI
    public static function supprimerPoi($pdo, $id) {
        try {
            $sql = "DELETE FROM point_interet WHERE id_poi = :id";
            $stmt = $pdo->prepare($sql);
            // On exécute en passant l'ID de manière sécurisée
            $stmt->execute(['id' => $id]); 
            return true;
        } catch (PDOException $e) {
            // En cas d'erreur (ex: clé étrangère), on renvoie false
            return false; 
        }
    }
    // Récupérer un POI spécifique par son ID
    public static function getPoiById($pdo, $id) {
        try {
            $sql = "SELECT * FROM point_interet WHERE id_poi = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            // On utilise fetch() et non fetchAll() car on ne veut qu'une seule ligne
            return $stmt->fetch(PDO::FETCH_ASSOC); 
        } catch (PDOException $e) {
            die("Erreur de récupération du POI : " . $e->getMessage());
        }
    }

    // Le "U" (Update) : Mettre à jour un POI existant
    public function modifierPoi($pdo) {
        try {
            $sql = "UPDATE point_interet SET 
                    nom_poi = :nom, categorie_service = :cat, latitude = :lat, longitude = :lng, 
                    adresse_postale = :adresse, horaires_ouverture = :horaires, contact_tel = :tel, accessible_pmr = :pmr 
                    WHERE id_poi = :id";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'nom' => $this->nom_poi,
                'cat' => $this->categorie_service,
                'lat' => $this->latitude,
                'lng' => $this->longitude,
                'adresse' => $this->adresse_postale,
                'horaires' => $this->horaires_ouverture,
                'tel' => $this->contact_tel,
                'pmr' => $this->accessible_pmr,
                'id' => $this->id_poi // ⚠️ Très important, on utilise l'ID ici !
            ]);
            return true;
        } catch (PDOException $e) {
            die("Erreur de modification : " . $e->getMessage());
        }
    }

    // Méthode statique pour récupérer la liste des catégories qui existent déjà
    public static function getCategoriesDistinctes($pdo) {
        try {
            // SELECT DISTINCT permet de ne récupérer qu'une seule fois chaque catégorie
            $sql = "SELECT DISTINCT categorie_service FROM point_interet WHERE categorie_service IS NOT NULL";
            $stmt = $pdo->query($sql);
            // PDO::FETCH_COLUMN retourne un tableau simple à une dimension
            return $stmt->fetchAll(PDO::FETCH_COLUMN); 
        } catch (PDOException $e) {
            die("Erreur de récupération des catégories : " . $e->getMessage());
        }
    }
}
<<<<<<< Updated upstream
?>
=======
?>


>>>>>>> Stashed changes
