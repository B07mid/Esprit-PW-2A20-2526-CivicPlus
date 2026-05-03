<?php
// Config/Database.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// FORCE ADMIN SESSION (Pour la démo de lundi)
// On remplit la session avec tes infos de la table 'citoyen'
if (!isset($_SESSION['user'])) {
    $_SESSION['user'] = [
        'num_cin' => 12345678, // Ton CIN dans la BD
        'nom' => 'Marzougui',
        'prenom' => 'Ahmed',
        'role' => 'admin',
        'email' => 'ahmed@esprit.tn'
    ];
}
class Database {
    private $host = "localhost";
    private $db_name = "civicplus";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo "Erreur de connexion : " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>