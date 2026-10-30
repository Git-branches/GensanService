<?php

namespace App\Controllers\Admin;

use App\Auth;
use App\Database;
use App\Request;
use App\Response;
use App\Services\ActivityLogger;
use App\Validators\Validator;

class OfficeController
{
    private const EDITORS = ['super_admin', 'editor'];

    public function index(): void
    {
        Auth::requireAdmin();
        $rows = Database::connection()->query(
            'SELECT o.id, o.agency_id, o.name, o.branch_type, o.description, o.address, o.barangay, o.city, o.province, o.contact_number, o.email,
                    o.opening_hours, o.latitude, o.longitude, o.is_verified, o.last_verified_at, o.is_active,
                    a.name AS agency_name, a.acronym AS agency_acronym,
                    (SELECT COUNT(*) FROM service_offices so WHERE so.office_id = o.id) AS service_count
             FROM offices o
             JOIN agencies a ON a.id = o.agency_id
             ORDER BY o.is_active DESC, a.name, o.name'
        )->fetchAll();

        Response::success($rows);
    }

    public function store(): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $data = $this->validate(Request::json());

        $pdo = Database::connection();
        $pdo->prepare(
            'INSERT INTO offices (agency_id, name, branch_type, description, address, barangay, city, province, contact_number, email, opening_hours,
                                  latitude, longitude, is_verified, last_verified_at, is_active)
             VALUES (:agency_id, :name, :branch_type, :description, :address, :barangay, :city, :province, :contact_number, :email, :opening_hours,
                     :latitude, :longitude, :is_verified, :last_verified_at, :is_active)'
        )->execute($data);
        $id = (int) $pdo->lastInsertId();

        ActivityLogger::log((int) $admin['id'], 'office.created', 'office', $id, ['name' => $data['name']]);
        Response::success(['id' => $id], 201);
    }

    public function update(array $params): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $id = (int) $params['id'];

        $stmt = Database::connection()->prepare('SELECT 1 FROM offices WHERE id = :id');
        $stmt->execute(['id' => $id]);
        if (!$stmt->fetchColumn()) {
            Response::notFound('Office not found');
        }

        $data = $this->validate(Request::json());
        Database::connection()->prepare(
            'UPDATE offices SET agency_id = :agency_id, name = :name, branch_type = :branch_type, description = :description, address = :address, barangay = :barangay, city = :city,
                    province = :province, contact_number = :contact_number, email = :email, opening_hours = :opening_hours,
                    latitude = :latitude, longitude = :longitude, is_verified = :is_verified,
                    last_verified_at = :last_verified_at, is_active = :is_active
             WHERE id = :id'
        )->execute($data + ['id' => $id]);

        ActivityLogger::log((int) $admin['id'], 'office.updated', 'office', $id, ['name' => $data['name']]);
        Response::success(['id' => $id]);
    }

    /** @return array<string, mixed> */
    private function validate(array $body): array
    {
        $v = new Validator();

        $data = [
            'agency_id' => $v->id($body['agency_id'] ?? null, 'agency_id'),
            'name' => $v->string($body['name'] ?? null, 'name', 150, true, 2),
            'branch_type' => in_array($body['branch_type'] ?? null, ['main', 'satellite'], true) ? $body['branch_type'] : null,
            'description' => $v->string($body['description'] ?? null, 'description', 500),
            'address' => $v->string($body['address'] ?? null, 'address', 255),
            'barangay' => $v->string($body['barangay'] ?? null, 'barangay', 100),
            'city' => $v->string($body['city'] ?? null, 'city', 100) ?? 'General Santos City',
            'province' => $v->string($body['province'] ?? null, 'province', 100) ?? 'South Cotabato',
            'contact_number' => $v->string($body['contact_number'] ?? null, 'contact_number', 50),
            'email' => $v->email($body['email'] ?? null, 'email'),
            'opening_hours' => $v->string($body['opening_hours'] ?? null, 'opening_hours', 255),
            'latitude' => $v->coordinate($body['latitude'] ?? null, 'latitude', 90),
            'longitude' => $v->coordinate($body['longitude'] ?? null, 'longitude', 180),
            'is_verified' => $v->bool($body['is_verified'] ?? false),
            'last_verified_at' => $v->date($body['last_verified_at'] ?? null, 'last_verified_at'),
            'is_active' => $v->bool($body['is_active'] ?? true),
        ];

        if ($data['agency_id'] !== null) {
            $stmt = Database::connection()->prepare('SELECT 1 FROM agencies WHERE id = :id');
            $stmt->execute(['id' => $data['agency_id']]);
            if (!$stmt->fetchColumn()) {
                $v->add('agency_id', 'Please choose a valid agency.');
            }
        }
        if ($data['is_verified'] && $data['last_verified_at'] === null) {
            $v->add('last_verified_at', 'Enter the date these details were verified.');
        }
        if (($data['latitude'] === null) !== ($data['longitude'] === null)) {
            $v->add($data['latitude'] === null ? 'latitude' : 'longitude', 'Enter both latitude and longitude, or neither.');
        }

        $v->failIfErrors();
        return $data;
    }
}
