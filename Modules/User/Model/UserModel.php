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

    public function trouverCitoyenParEmail(string $email): ?array
    {
        $sql = "SELECT num_cin, nom, prenom, email
                FROM citoyen
                WHERE email = :email
                LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['email' => $email]);
        $citoyen = $stmt->fetch(PDO::FETCH_ASSOC);

        return $citoyen ?: null;
    }

    public function enregistrerCodeReinitialisation(string $email, string $codeHash, DateTimeInterface $dateExpiration): bool
    {
        $donnees = json_encode([
            'code_hash' => $codeHash,
            'date_expiration' => $dateExpiration->format('Y-m-d H:i:s')
        ], JSON_UNESCAPED_SLASHES);

        $sql = "UPDATE citoyen
                SET token_reinitialisation = :token_reinitialisation
                WHERE email = :email";
        $stmt = $this->pdo->prepare($sql);

        return $stmt->execute([
            'token_reinitialisation' => $donnees,
            'email' => $email
        ]);
    }

    public function reinitialiserMotDePasseAvecCode(string $email, string $code, string $motDePasseHash): array
    {
        $sql = "SELECT token_reinitialisation
                FROM citoyen
                WHERE email = :email
                LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['email' => $email]);
        $citoyen = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$citoyen || empty($citoyen['token_reinitialisation'])) {
            return ['success' => false, 'reason' => 'invalid'];
        }

        $donnees = json_decode($citoyen['token_reinitialisation'], true);

        if (!is_array($donnees) || empty($donnees['code_hash']) || empty($donnees['date_expiration'])) {
            return ['success' => false, 'reason' => 'invalid'];
        }

        if (strtotime($donnees['date_expiration']) < time()) {
            return ['success' => false, 'reason' => 'expired'];
        }

        if (!hash_equals($donnees['code_hash'], hash('sha256', $code))) {
            return ['success' => false, 'reason' => 'invalid'];
        }

        $sql = "UPDATE citoyen
                SET mot_de_passe_hash = :mot_de_passe_hash,
                    token_reinitialisation = NULL
                WHERE email = :email";
        $stmt = $this->pdo->prepare($sql);
        $success = $stmt->execute([
            'mot_de_passe_hash' => $motDePasseHash,
            'email' => $email
        ]);

        return ['success' => $success, 'reason' => $success ? null : 'failed'];
    }

    public function assurerTableInscriptionsEnAttente(): void
    {
        $sql = "CREATE TABLE IF NOT EXISTS inscriptions_citoyens_en_attente (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(150) NOT NULL,
                    num_cin VARCHAR(8) NOT NULL,
                    code_verification_hash CHAR(64) NOT NULL,
                    donnees_json LONGTEXT NOT NULL,
                    date_expiration DATETIME NOT NULL,
                    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uniq_attente_email (email),
                    UNIQUE KEY uniq_attente_cin (num_cin),
                    UNIQUE KEY uniq_attente_code (code_verification_hash)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

        $this->pdo->exec($sql);
    }

    public function supprimerInscriptionsEnAttenteExpirees(): void
    {
        $this->assurerTableInscriptionsEnAttente();

        $stmt = $this->pdo->prepare("DELETE FROM inscriptions_citoyens_en_attente WHERE date_expiration < NOW()");
        $stmt->execute();
    }

    public function emailEnAttenteExiste(string $email): bool
    {
        $this->assurerTableInscriptionsEnAttente();

        $sql = "SELECT COUNT(*) FROM inscriptions_citoyens_en_attente WHERE email = :email";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['email' => $email]);

        return $stmt->fetchColumn() > 0;
    }

    public function cinEnAttenteExiste(string $num_cin): bool
    {
        $this->assurerTableInscriptionsEnAttente();

        $sql = "SELECT COUNT(*) FROM inscriptions_citoyens_en_attente WHERE num_cin = :num_cin";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['num_cin' => $num_cin]);

        return $stmt->fetchColumn() > 0;
    }

    public function creerInscriptionEnAttente(array $data, string $codeHash, DateTimeInterface $dateExpiration): bool
    {
        $this->assurerTableInscriptionsEnAttente();

        $sql = "INSERT INTO inscriptions_citoyens_en_attente (
                    email,
                    num_cin,
                    code_verification_hash,
                    donnees_json,
                    date_expiration
                ) VALUES (
                    :email,
                    :num_cin,
                    :code_verification_hash,
                    :donnees_json,
                    :date_expiration
                )";

        $stmt = $this->pdo->prepare($sql);

        return $stmt->execute([
            'email' => $data['email'],
            'num_cin' => $data['num_cin'],
            'code_verification_hash' => $codeHash,
            'donnees_json' => json_encode($data, JSON_UNESCAPED_SLASHES),
            'date_expiration' => $dateExpiration->format('Y-m-d H:i:s'),
        ]);
    }

    public function supprimerInscriptionEnAttenteParCodeHash(string $codeHash): void
    {
        $this->assurerTableInscriptionsEnAttente();

        $stmt = $this->pdo->prepare(
            "DELETE FROM inscriptions_citoyens_en_attente WHERE code_verification_hash = :code_verification_hash"
        );
        $stmt->execute(['code_verification_hash' => $codeHash]);
    }

    public function supprimerInscriptionEnAttenteParEmailOuCin(string $email, string $num_cin): void
    {
        $this->assurerTableInscriptionsEnAttente();

        $stmt = $this->pdo->prepare(
            "DELETE FROM inscriptions_citoyens_en_attente WHERE email = :email OR num_cin = :num_cin"
        );
        $stmt->execute([
            'email' => $email,
            'num_cin' => $num_cin
        ]);
    }

    public function finaliserInscriptionEnAttente(string $token): array
    {
        $this->assurerTableInscriptionsEnAttente();

        $codeHash = hash('sha256', $token);

        try {
            $this->pdo->beginTransaction();

            $sql = "SELECT *
                    FROM inscriptions_citoyens_en_attente
                    WHERE code_verification_hash = :code_verification_hash
                    LIMIT 1
                    FOR UPDATE";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['code_verification_hash' => $codeHash]);
            $inscription = $stmt->fetch(PDO::FETCH_ASSOC);

            return $this->finaliserLigneInscriptionEnAttente($inscription);
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $e;
        }
    }

    public function finaliserInscriptionEnAttenteParEmailEtCode(string $email, string $code): array
    {
        $this->assurerTableInscriptionsEnAttente();

        $codeHash = hash('sha256', $code);

        try {
            $this->pdo->beginTransaction();

            $sql = "SELECT *
                    FROM inscriptions_citoyens_en_attente
                    WHERE email = :email AND code_verification_hash = :code_verification_hash
                    LIMIT 1
                    FOR UPDATE";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                'email' => $email,
                'code_verification_hash' => $codeHash
            ]);
            $inscription = $stmt->fetch(PDO::FETCH_ASSOC);

            return $this->finaliserLigneInscriptionEnAttente($inscription);
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $e;
        }
    }

    private function finaliserLigneInscriptionEnAttente($inscription): array
    {
        if (!$inscription) {
            $this->pdo->rollBack();
            return ['success' => false, 'reason' => 'invalid'];
        }

        if (strtotime($inscription['date_expiration']) < time()) {
            $delete = $this->pdo->prepare("DELETE FROM inscriptions_citoyens_en_attente WHERE id = :id");
            $delete->execute(['id' => $inscription['id']]);
            $this->pdo->commit();

            return ['success' => false, 'reason' => 'expired'];
        }

        $data = json_decode($inscription['donnees_json'], true);
        if (!is_array($data)) {
            $this->pdo->rollBack();
            return ['success' => false, 'reason' => 'invalid'];
        }

        if ($this->emailExists($data['email']) || $this->cinExists((string)$data['num_cin'])) {
            $delete = $this->pdo->prepare("DELETE FROM inscriptions_citoyens_en_attente WHERE id = :id");
            $delete->execute(['id' => $inscription['id']]);
            $this->pdo->commit();

            return ['success' => false, 'reason' => 'duplicate'];
        }

        $created = $this->createcitoyen($data);

        if (!$created) {
            $this->pdo->rollBack();
            return ['success' => false, 'reason' => 'failed'];
        }

        $delete = $this->pdo->prepare("DELETE FROM inscriptions_citoyens_en_attente WHERE id = :id");
        $delete->execute(['id' => $inscription['id']]);
        $this->pdo->commit();

        return ['success' => true, 'email' => $data['email']];
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
                    preferences_ia_transport,
                    photo
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
                    :preferences_ia_transport,
                    :photo
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
            'preferences_ia_transport' => $data['preferences_ia_transport'],
            'photo' => $data['photo'] ?? ''
        ]);
    }
}
