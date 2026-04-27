<?php

class TransportNetwork
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getStats(): array
    {
        $sql = "
            SELECT
                (SELECT COUNT(*) FROM ligne_transport) AS total_lignes,
                (SELECT COUNT(*) FROM station) AS total_stations,
                (SELECT COUNT(*) FROM parcours_ligne) AS total_parcours,
                (SELECT COUNT(DISTINCT type_transport) FROM ligne_transport WHERE COALESCE(type_transport, '') <> '') AS total_types,
                (SELECT COALESCE(MAX(ordre_passage), 0) FROM parcours_ligne) AS max_stations
        ";

        $stats = $this->db->query($sql)->fetch(PDO::FETCH_ASSOC);
        $stats['par_type'] = $this->db
            ->query("
                SELECT COALESCE(NULLIF(type_transport, ''), 'Non defini') AS type_transport, COUNT(*) AS total
                FROM ligne_transport
                GROUP BY COALESCE(NULLIF(type_transport, ''), 'Non defini')
                ORDER BY total DESC, type_transport ASC
            ")
            ->fetchAll(PDO::FETCH_ASSOC);

        return $stats;
    }

    public function getOptions(): array
    {
        return [
            'lignes' => $this->db
                ->query("SELECT id_ligne, nom_ligne, type_transport FROM ligne_transport ORDER BY nom_ligne ASC")
                ->fetchAll(PDO::FETCH_ASSOC),
            'stations' => $this->db
                ->query("SELECT id_station, nom_station, latitude, longitude FROM station ORDER BY nom_station ASC")
                ->fetchAll(PDO::FETCH_ASSOC),
            'types' => $this->db
                ->query("SELECT DISTINCT type_transport FROM ligne_transport WHERE COALESCE(type_transport, '') <> '' ORDER BY type_transport ASC")
                ->fetchAll(PDO::FETCH_COLUMN),
        ];
    }

    public function listLines(string $search = '', string $type = ''): array
    {
        $sql = "
            SELECT
                l.id_ligne,
                l.nom_ligne,
                l.type_transport,
                COUNT(p.id_station) AS total_parcours,
                COALESCE(MAX(p.ordre_passage), 0) AS max_stations
            FROM ligne_transport l
            LEFT JOIN parcours_ligne p ON p.id_ligne = l.id_ligne
            WHERE 1 = 1
        ";
        $params = [];

        if ($search !== '') {
            $sql .= " AND (l.nom_ligne LIKE :search OR l.type_transport LIKE :search OR l.id_ligne = :id_search)";
            $params[':search'] = '%' . $search . '%';
            $params[':id_search'] = ctype_digit($search) ? (int)$search : -1;
        }

        if ($type !== '') {
            $sql .= " AND l.type_transport = :type_transport";
            $params[':type_transport'] = $type;
        }

        $sql .= " GROUP BY l.id_ligne, l.nom_ligne, l.type_transport ORDER BY l.type_transport ASC, l.nom_ligne ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function saveLine(?int $id, string $name, string $type): array
    {
        $name = trim($name);
        $type = trim($type);

        if ($name === '') {
            throw new InvalidArgumentException('Le nom de la ligne est obligatoire.');
        }

        if ($id && $id > 0) {
            $stmt = $this->db->prepare("
                UPDATE ligne_transport
                SET nom_ligne = :nom_ligne, type_transport = :type_transport
                WHERE id_ligne = :id_ligne
            ");
            $stmt->execute([
                ':nom_ligne' => $name,
                ':type_transport' => $type,
                ':id_ligne' => $id,
            ]);

            return ['id' => $id, 'mode' => 'updated'];
        }

        $stmt = $this->db->prepare("
            INSERT INTO ligne_transport (nom_ligne, type_transport)
            VALUES (:nom_ligne, :type_transport)
        ");
        $stmt->execute([
            ':nom_ligne' => $name,
            ':type_transport' => $type,
        ]);

        return ['id' => (int)$this->db->lastInsertId(), 'mode' => 'created'];
    }

    public function deleteLine(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM ligne_transport WHERE id_ligne = :id_ligne");
        return $stmt->execute([':id_ligne' => $id]);
    }

    public function listStations(string $search = ''): array
    {
        $sql = "
            SELECT
                s.id_station,
                s.nom_station,
                s.latitude,
                s.longitude,
                (SELECT COUNT(*) FROM parcours_ligne p WHERE p.id_station = s.id_station) AS total_depart,
                (SELECT COUNT(*) FROM parcours_ligne p WHERE p.id_der_station = s.id_station) AS total_arrivee
            FROM station s
            WHERE 1 = 1
        ";
        $params = [];

        if ($search !== '') {
            $sql .= " AND (s.nom_station LIKE :search OR s.id_station = :id_search)";
            $params[':search'] = '%' . $search . '%';
            $params[':id_search'] = ctype_digit($search) ? (int)$search : -1;
        }

        $sql .= " ORDER BY s.nom_station ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function saveStation(?int $id, string $name, $latitude, $longitude): array
    {
        $name = trim($name);

        if ($name === '') {
            throw new InvalidArgumentException('Le nom de la station est obligatoire.');
        }

        if (!is_numeric($latitude) || !is_numeric($longitude)) {
            throw new InvalidArgumentException('La latitude et la longitude doivent etre numeriques.');
        }

        if ($id && $id > 0) {
            $stmt = $this->db->prepare("
                UPDATE station
                SET nom_station = :nom_station, latitude = :latitude, longitude = :longitude
                WHERE id_station = :id_station
            ");
            $stmt->execute([
                ':nom_station' => $name,
                ':latitude' => (float)$latitude,
                ':longitude' => (float)$longitude,
                ':id_station' => $id,
            ]);

            return ['id' => $id, 'mode' => 'updated'];
        }

        $stmt = $this->db->prepare("
            INSERT INTO station (nom_station, latitude, longitude)
            VALUES (:nom_station, :latitude, :longitude)
        ");
        $stmt->execute([
            ':nom_station' => $name,
            ':latitude' => (float)$latitude,
            ':longitude' => (float)$longitude,
        ]);

        return ['id' => (int)$this->db->lastInsertId(), 'mode' => 'created'];
    }

    public function deleteStation(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM station WHERE id_station = :id_station");
        return $stmt->execute([':id_station' => $id]);
    }

    public function listParcours(string $search = '', ?int $lineId = null): array
    {
        $sql = "
            SELECT
                p.id_ligne,
                l.nom_ligne,
                l.type_transport,
                p.id_station,
                depart.nom_station AS station_depart,
                p.id_der_station,
                arrivee.nom_station AS station_arrivee,
                p.ordre_passage
            FROM parcours_ligne p
            INNER JOIN ligne_transport l ON l.id_ligne = p.id_ligne
            INNER JOIN station depart ON depart.id_station = p.id_station
            INNER JOIN station arrivee ON arrivee.id_station = p.id_der_station
            WHERE 1 = 1
        ";
        $params = [];

        if ($lineId && $lineId > 0) {
            $sql .= " AND p.id_ligne = :line_id";
            $params[':line_id'] = $lineId;
        }

        if ($search !== '') {
            $sql .= " AND (
                l.nom_ligne LIKE :search
                OR l.type_transport LIKE :search
                OR depart.nom_station LIKE :search
                OR arrivee.nom_station LIKE :search
            )";
            $params[':search'] = '%' . $search . '%';
        }

        $sql .= " ORDER BY l.nom_ligne ASC, p.ordre_passage DESC, depart.nom_station ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function saveParcours(
        ?int $originalLineId,
        ?int $originalStationId,
        int $lineId,
        int $departureStationId,
        int $arrivalStationId,
        int $order,
        bool $createReverse
    ): array {
        if ($lineId <= 0 || $departureStationId <= 0 || $arrivalStationId <= 0) {
            throw new InvalidArgumentException('La ligne, la station de depart et la station arrivee sont obligatoires.');
        }

        if ($departureStationId === $arrivalStationId) {
            throw new InvalidArgumentException('La station de depart et la station arrivee doivent etre differentes.');
        }

        if ($order < 1) {
            throw new InvalidArgumentException('Le nombre de stations doit etre superieur a 0.');
        }

        if ($originalLineId && $originalStationId) {
            $stmt = $this->db->prepare("
                UPDATE parcours_ligne
                SET id_ligne = :id_ligne,
                    id_station = :id_station,
                    id_der_station = :id_der_station,
                    ordre_passage = :ordre_passage
                WHERE id_ligne = :original_id_ligne AND id_station = :original_id_station
            ");
            $stmt->execute([
                ':id_ligne' => $lineId,
                ':id_station' => $departureStationId,
                ':id_der_station' => $arrivalStationId,
                ':ordre_passage' => $order,
                ':original_id_ligne' => $originalLineId,
                ':original_id_station' => $originalStationId,
            ]);

            return ['mode' => 'updated'];
        }

        $this->insertParcours($lineId, $departureStationId, $arrivalStationId, $order);

        if ($createReverse) {
            $this->insertParcours($lineId, $arrivalStationId, $departureStationId, $order, true);
        }

        return ['mode' => 'created'];
    }

    private function insertParcours(int $lineId, int $departureStationId, int $arrivalStationId, int $order, bool $ignoreDuplicate = false): void
    {
        $sql = $ignoreDuplicate
            ? "INSERT IGNORE INTO parcours_ligne (id_ligne, id_station, id_der_station, ordre_passage)
               VALUES (:id_ligne, :id_station, :id_der_station, :ordre_passage)"
            : "INSERT INTO parcours_ligne (id_ligne, id_station, id_der_station, ordre_passage)
               VALUES (:id_ligne, :id_station, :id_der_station, :ordre_passage)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':id_ligne' => $lineId,
            ':id_station' => $departureStationId,
            ':id_der_station' => $arrivalStationId,
            ':ordre_passage' => $order,
        ]);
    }

    public function deleteParcours(int $lineId, int $stationId): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM parcours_ligne
            WHERE id_ligne = :id_ligne AND id_station = :id_station
        ");

        return $stmt->execute([
            ':id_ligne' => $lineId,
            ':id_station' => $stationId,
        ]);
    }
}
