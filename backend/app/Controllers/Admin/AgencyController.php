<?php

namespace App\Controllers\Admin;

use App\Auth;
use App\Database;
use App\Request;
use App\Response;
use App\Services\ActivityLogger;
use App\Services\Slug;
use App\Validators\Validator;

class AgencyController
{
    private const EDITORS = ['super_admin', 'editor'];

    // Logos are re-encoded as small WebP files in public/uploads, served at /api/uploads like the API.
    private const LOGO_DIR = __DIR__ . '/../../../public/uploads/agencies';
    private const LOGO_URL = '/api/uploads/agencies/';
    private const LOGO_MAX_BYTES = 2 * 1024 * 1024;
    private const LOGO_MAX_SOURCE_PIXELS = 4000;
    private const LOGO_SIZE = 256;

    public function index(): void
    {
        Auth::requireAdmin();
        $rows = Database::connection()->query(
            "SELECT a.id, a.name, a.slug, a.acronym, a.description, a.logo_url, a.official_website, a.hotline, a.email, a.facebook_url,
                    a.is_local_government, a.is_active,
                    (SELECT COUNT(*) FROM services s WHERE s.agency_id = a.id) AS service_count,
                    (SELECT COUNT(*) FROM services s WHERE s.agency_id = a.id AND s.status = 'published') AS published_count,
                    (SELECT COUNT(*) FROM offices o WHERE o.agency_id = a.id) AS office_count
             FROM agencies a
             ORDER BY a.is_active DESC, a.name"
        )->fetchAll();

        Response::success($rows);
    }

    public function store(): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $data = $this->validate(Request::json());

        $pdo = Database::connection();
        $pdo->prepare(
            'INSERT INTO agencies (name, slug, acronym, description, official_website, hotline, email, facebook_url, is_local_government, is_active)
             VALUES (:name, :slug, :acronym, :description, :website, :hotline, :email, :facebook, :local, :active)'
        )->execute($data);
        $id = (int) $pdo->lastInsertId();

        ActivityLogger::log((int) $admin['id'], 'agency.created', 'agency', $id, ['name' => $data['name']]);
        Response::success(['id' => $id], 201);
    }

    public function update(array $params): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $id = (int) $params['id'];
        $this->findOrFail($id);
        $data = $this->validate(Request::json(), $id);

        Database::connection()->prepare(
            'UPDATE agencies SET name = :name, slug = :slug, acronym = :acronym, description = :description,
                    official_website = :website, hotline = :hotline, email = :email, facebook_url = :facebook,
                    is_local_government = :local, is_active = :active
             WHERE id = :id'
        )->execute($data + ['id' => $id]);

        ActivityLogger::log((int) $admin['id'], 'agency.updated', 'agency', $id, ['name' => $data['name']]);
        Response::success(['id' => $id]);
    }

    public function uploadLogo(array $params): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $agency = $this->findOrFail((int) $params['id']);
        $image = $this->readUploadedImage($_FILES['logo'] ?? null);

        // Re-encoding drops metadata and anything hidden in the original file.
        $width = imagesx($image);
        $height = imagesy($image);
        $scale = min(1, self::LOGO_SIZE / max($width, $height));
        $newWidth = max(1, (int) round($width * $scale));
        $newHeight = max(1, (int) round($height * $scale));

        $logo = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($logo, false);
        imagesavealpha($logo, true);
        imagefill($logo, 0, 0, imagecolorallocatealpha($logo, 0, 0, 0, 127));
        imagecopyresampled($logo, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        if (!is_dir(self::LOGO_DIR) && !mkdir(self::LOGO_DIR, 0755, true) && !is_dir(self::LOGO_DIR)) {
            throw new \RuntimeException('Could not create the agency logo folder.');
        }
        $fileName = $agency['slug'] . '-' . bin2hex(random_bytes(4)) . '.webp';
        if (!imagewebp($logo, self::LOGO_DIR . '/' . $fileName, 90)) {
            throw new \RuntimeException('Could not save the agency logo.');
        }

        $url = self::LOGO_URL . $fileName;
        Database::connection()->prepare('UPDATE agencies SET logo_url = :url WHERE id = :id')
            ->execute(['url' => $url, 'id' => $agency['id']]);
        $this->deleteLogoFile($agency['logo_url']);

        ActivityLogger::log((int) $admin['id'], 'agency.logo_updated', 'agency', (int) $agency['id'], ['name' => $agency['name']]);
        Response::success(['logo_url' => $url]);
    }

    public function removeLogo(array $params): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $agency = $this->findOrFail((int) $params['id']);

        Database::connection()->prepare('UPDATE agencies SET logo_url = NULL WHERE id = :id')->execute(['id' => $agency['id']]);
        $this->deleteLogoFile($agency['logo_url']);

        ActivityLogger::log((int) $admin['id'], 'agency.logo_removed', 'agency', (int) $agency['id'], ['name' => $agency['name']]);
        Response::success(['logo_url' => null]);
    }

    private function readUploadedImage(mixed $file): \GdImage
    {
        $invalid = fn (string $message) => Response::error($message, 422, ['logo' => $message]);

        if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
            $invalid('Choose a PNG, JPG, or WebP image to upload.');
        }
        if ($file['size'] > self::LOGO_MAX_BYTES) {
            $invalid('The image must be 2 MB or smaller.');
        }

        // Check the real image type and size before decoding, so oversized images can't exhaust memory.
        $info = @getimagesize($file['tmp_name']);
        if ($info === false || !in_array($info[2], [IMAGETYPE_PNG, IMAGETYPE_JPEG, IMAGETYPE_WEBP], true)) {
            $invalid('Use a PNG, JPG, or WebP image.');
        }
        if ($info[0] > self::LOGO_MAX_SOURCE_PIXELS || $info[1] > self::LOGO_MAX_SOURCE_PIXELS) {
            $invalid('The image must be at most 4000 × 4000 pixels.');
        }

        $image = @imagecreatefromstring((string) file_get_contents($file['tmp_name']));
        if ($image === false) {
            $invalid('This image could not be read. Try saving it as a PNG.');
        }
        return $image;
    }

    private function deleteLogoFile(?string $url): void
    {
        // Only files this controller saved are removed; basename() keeps it inside the logo folder.
        if ($url && str_starts_with($url, self::LOGO_URL)) {
            $path = self::LOGO_DIR . '/' . basename($url);
            if (is_file($path)) {
                unlink($path);
            }
        }
    }

    /** @return array{id: int, name: string, slug: string, logo_url: ?string} */
    private function findOrFail(int $id): array
    {
        $stmt = Database::connection()->prepare('SELECT id, name, slug, logo_url FROM agencies WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $agency = $stmt->fetch();
        if (!$agency) {
            Response::notFound('Agency not found');
        }
        return $agency;
    }

    /** @return array<string, mixed> */
    private function validate(array $body, ?int $id = null): array
    {
        $v = new Validator();
        $pdo = Database::connection();

        $name = $v->string($body['name'] ?? null, 'name', 150, true, 2);
        $v->string($body['slug'] ?? null, 'slug', 160);
        $data = [
            'name' => $name,
            'slug' => Slug::unique($pdo, 'agencies', $body['slug'] ?? null, (string) $name, $id, $v),
            'acronym' => $v->string($body['acronym'] ?? null, 'acronym', 20),
            'description' => $v->string($body['description'] ?? null, 'description', 2000),
            'website' => $v->optionalUrl($body['official_website'] ?? null, 'official_website'),
            'hotline' => $v->string($body['hotline'] ?? null, 'hotline', 100),
            'email' => $v->email($body['email'] ?? null, 'email'),
            'facebook' => $v->optionalUrl($body['facebook_url'] ?? null, 'facebook_url'),
            'local' => $v->bool($body['is_local_government'] ?? false),
            'active' => $v->bool($body['is_active'] ?? true),
        ];

        // Deactivating an agency would break the agency links on its live guides.
        if ($id !== null && $data['active'] === 0) {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM services WHERE agency_id = :id AND status = 'published'");
            $stmt->execute(['id' => $id]);
            $published = (int) $stmt->fetchColumn();
            if ($published > 0) {
                $v->add('is_active', "Unpublish or archive this agency's {$published} published guide(s) first.");
            }
        }

        $v->failIfErrors();
        return $data;
    }
}
