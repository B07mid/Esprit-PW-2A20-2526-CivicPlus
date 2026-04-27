<?php

class SignalementTransport
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

public function create(int $numCin, int $idLigne, string $typeProbleme, string $date): int
{
    $sql = "INSERT INTO signalement_transport 
            (num_cin, id_ligne, type_probleme, date_signalement)
            VALUES (:num_cin, :id_ligne, :type_probleme, :date_signalement)";

    $stmt = $this->db->prepare($sql);
    $stmt->bindValue(':num_cin', $numCin, PDO::PARAM_INT);
    $stmt->bindValue(':id_ligne', $idLigne, PDO::PARAM_INT);
    $stmt->bindValue(':type_probleme', $typeProbleme, PDO::PARAM_STR);
    $stmt->bindValue(':date_signalement', $date, PDO::PARAM_STR);
    $stmt->execute();

    return (int)$this->db->lastInsertId();
}
    public function citoyenExists(int $numCin): bool
    {
        $stmt = $this->db->prepare("SELECT 1 FROM citoyen WHERE num_cin = :num_cin LIMIT 1");
        $stmt->bindValue(':num_cin', $numCin, PDO::PARAM_INT);
        $stmt->execute();

        return (bool)$stmt->fetchColumn();
    }

    public function ligneExists(int $idLigne): bool
    {
        $stmt = $this->db->prepare("SELECT 1 FROM ligne_transport WHERE id_ligne = :id_ligne LIMIT 1");
        $stmt->bindValue(':id_ligne', $idLigne, PDO::PARAM_INT);
        $stmt->execute();

        return (bool)$stmt->fetchColumn();
    }

public function getAllBack($searchId = null, $statut = null, $priorite = null): array
{
    $sql = "
        SELECT 
            s.id_signalement_tr,
            lt.type_transport,
            s.type_probleme,
            'Tunis' AS localisation,
            s.date_signalement,
            s.pris_en_compte_ia,
            CASE
                WHEN s.pris_en_compte_ia = 0 THEN 'En attente'
                WHEN s.pris_en_compte_ia = 1 THEN 'Résolu'
                WHEN s.pris_en_compte_ia = 2 THEN 'En cours'
                ELSE 'Inconnu'
            END AS statut_label,
            CASE
                WHEN TIMESTAMPDIFF(HOUR, s.date_signalement, NOW()) > 12 THEN 'Haute'
                ELSE 'Faible'
            END AS priorite_label
        FROM signalement_transport s
        LEFT JOIN ligne_transport lt ON s.id_ligne = lt.id_ligne
        WHERE 1 = 1
    ";

    $params = [];

    if (!empty($searchId)) {
        $sql .= " AND s.id_signalement_tr = :searchId";
        $params[':searchId'] = $searchId;
    }

    if ($statut !== null && $statut !== '') {
        $sql .= " AND s.pris_en_compte_ia = :statut";
        $params[':statut'] = $statut;
    }

    if (!empty($priorite)) {
        if ($priorite === 'Haute') {
            $sql .= " AND TIMESTAMPDIFF(HOUR, s.date_signalement, NOW()) > 12";
        } elseif ($priorite === 'Faible') {
            $sql .= " AND TIMESTAMPDIFF(HOUR, s.date_signalement, NOW()) <= 12";
        }
    }

    $sql .= " ORDER BY s.date_signalement DESC";

    $stmt = $this->db->prepare($sql);
    $stmt->execute($params);

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

    public function getStatsBack(): array
    {
        $sql = "
            SELECT
                COUNT(*) AS total_incidents,
                SUM(CASE WHEN pris_en_compte_ia = 0 THEN 1 ELSE 0 END) AS en_attente,
                SUM(CASE WHEN pris_en_compte_ia = 1 THEN 1 ELSE 0 END) AS resolus,
                SUM(CASE WHEN TIMESTAMPDIFF(HOUR, date_signalement, NOW()) > 12 THEN 1 ELSE 0 END) AS haute_priorite
            FROM signalement_transport
        ";

        $stmt = $this->db->query($sql);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

public function getOneBack($id): array|false
{
    $sql = "
        SELECT 
            s.id_signalement_tr,
            s.num_cin,
            c.nom,
            c.prenom,
            lt.type_transport,
            s.type_probleme,
            'Tunis' AS localisation,
            s.date_signalement,
            s.pris_en_compte_ia,
            CASE
                WHEN s.pris_en_compte_ia = 0 THEN 'En attente'
                WHEN s.pris_en_compte_ia = 1 THEN 'Résolu'
                WHEN s.pris_en_compte_ia = 2 THEN 'En cours'
                ELSE 'Inconnu'
            END AS statut_label,
            CASE
                WHEN TIMESTAMPDIFF(HOUR, s.date_signalement, NOW()) > 12 THEN 'Haute'
                ELSE 'Faible'
            END AS priorite_label
        FROM signalement_transport s
        LEFT JOIN ligne_transport lt ON s.id_ligne = lt.id_ligne
        LEFT JOIN citoyen c ON s.num_cin = c.num_cin
        WHERE s.id_signalement_tr = :id
        LIMIT 1
    ";

    $stmt = $this->db->prepare($sql);
    $stmt->execute([':id' => $id]);

    return $stmt->fetch(PDO::FETCH_ASSOC);
}
    public function deleteBack($id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM signalement_transport WHERE id_signalement_tr = :id");
        return $stmt->execute([':id' => $id]);
    }

    public function updateBack($id, $typeProbleme, $statut): bool
    {
        $sql = "
            UPDATE signalement_transport
            SET type_probleme = :type_probleme,
                pris_en_compte_ia = :statut
            WHERE id_signalement_tr = :id
        ";

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([
            ':type_probleme' => $typeProbleme,
            ':statut' => $statut,
            ':id' => $id
        ]);
    }
}


