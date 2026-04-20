<?php

require_once __DIR__ . '/../config/config.php';

class citoyenModel
{
    private PDO $pdo;

    public function __construct()
    {
        global $pdo;

        if (!isset($pdo) || !$pdo instanceof PDO) {
            die('Erreur : la connexion PDO n\'est pas disponible dans config.php');
        }

        $this->pdo = $pdo;
    }

    public function emailExists(string $email): bool
    {
        $sql = "SELECT COUNT(*) FROM citoyen WHERE email = :email";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['email' => $email]);

        return $stmt->fetchColumn() > 0;
    }

    public function cinExists(string $num_cin): bool
    {
        $sql = "SELECT COUNT(*) FROM citoyen WHERE num_cin = :num_cin";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['num_cin' => $num_cin]);

        return $stmt->fetchColumn() > 0;
    }

    public function createcitoyen(array $data): bool
    {
        $sql = "INSERT INTO citoyen (
                    num_cin,
                    nom,
                    prenom,
                    date_naissance,
                    genre,
                    situation_familiale,
                    email,
                    numero_telephone,
                    adresse_postale,
                    code_postal,
                    ville,
                    latitude_domicile,
                    longitude_domicile,
                    mot_de_passe_hash,
                    double_authentification_active,
                    statut_compte,
                    points_civisme,
                    niveau_badge,
                    langue_preferee,
                    preferences_ia_transport
                ) VALUES (
                    :num_cin,
                    :nom,
                    :prenom,
                    :date_naissance,
                    :genre,
                    :situation_familiale,
                    :email,
                    :numero_telephone,
                    :adresse_postale,
                    :code_postal,
                    :ville,
                    :latitude_domicile,
                    :longitude_domicile,
                    :mot_de_passe_hash,
                    :double_authentification_active,
                    :statut_compte,
                    :points_civisme,
                    :niveau_badge,
                    :langue_preferee,
                    :preferences_ia_transport
                )";

        $stmt = $this->pdo->prepare($sql);

        return $stmt->execute([
            'num_cin' => $data['num_cin'],
            'nom' => $data['nom'],
            'prenom' => $data['prenom'],
            'date_naissance' => $data['date_naissance'],
            'genre' => $data['genre'],
            'situation_familiale' => $data['situation_familiale'],
            'email' => $data['email'],
            'numero_telephone' => $data['numero_telephone'],
            'adresse_postale' => $data['adresse_postale'],
            'code_postal' => $data['code_postal'],
            'ville' => $data['ville'],
            'latitude_domicile' => $data['latitude_domicile'],
            'longitude_domicile' => $data['longitude_domicile'],
            'mot_de_passe_hash' => $data['mot_de_passe_hash'],
            'double_authentification_active' => $data['double_authentification_active'],
            'statut_compte' => $data['statut_compte'],
            'points_civisme' => $data['points_civisme'],
            'niveau_badge' => $data['niveau_badge'],
            'langue_preferee' => $data['langue_preferee'],
            'preferences_ia_transport' => $data['preferences_ia_transport']
        ]);
    }
}


