<?php

use App\Controllers\Admin\ActivityController as AdminActivityController;
use App\Controllers\Admin\AdminUserController;
use App\Controllers\Admin\AgencyController as AdminAgencyController;
use App\Controllers\Admin\AuthController as AdminAuthController;
use App\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Controllers\Admin\OfficeController as AdminOfficeController;
use App\Controllers\Admin\ReportController as AdminReportController;
use App\Controllers\Admin\ServiceController as AdminServiceController;
use App\Controllers\AgencyController;
use App\Controllers\CategoryController;
use App\Controllers\OfficeController;
use App\Controllers\ReportController;
use App\Controllers\ServiceController;
use App\Controllers\StatsController;
use App\Response;
use App\Router;

/** @var Router $router */

$router->get('/api/health', function () {
    Response::success(['status' => 'ok', 'time' => date(DATE_ATOM)]);
});

$router->get('/api/stats', [new StatsController(), 'index']);

$router->get('/api/categories', [new CategoryController(), 'index']);

$router->get('/api/agencies', [new AgencyController(), 'index']);
$router->get('/api/agencies/{slug}', [new AgencyController(), 'show']);

$router->get('/api/offices', [new OfficeController(), 'index']);

$router->get('/api/services', [new ServiceController(), 'index']);
$router->get('/api/services/{slug}', [new ServiceController(), 'show']);
$router->post('/api/services/{slug}/reports', [new ReportController(), 'store']);

// Administrator API — every handler enforces sign-in, role, and CSRF checks itself via Auth::requireAdmin().
$adminAuth = new AdminAuthController();
$router->post('/api/admin/login', [$adminAuth, 'login']);
$router->post('/api/admin/logout', [$adminAuth, 'logout']);
$router->get('/api/admin/me', [$adminAuth, 'me']);
$router->post('/api/admin/account/password', [$adminAuth, 'changePassword']);

$router->get('/api/admin/dashboard', [new AdminDashboardController(), 'index']);
$router->get('/api/admin/activity', [new AdminActivityController(), 'index']);

$adminReports = new AdminReportController();
$router->get('/api/admin/reports', [$adminReports, 'index']);
$router->put('/api/admin/reports/{id}', [$adminReports, 'update']);

$adminUsers = new AdminUserController();
$router->get('/api/admin/admins', [$adminUsers, 'index']);
$router->post('/api/admin/admins', [$adminUsers, 'store']);
$router->put('/api/admin/admins/{id}', [$adminUsers, 'update']);
$router->post('/api/admin/admins/{id}/password', [$adminUsers, 'resetPassword']);

$adminServices = new AdminServiceController();
$router->get('/api/admin/lookups', [$adminServices, 'lookups']);
$router->get('/api/admin/services', [$adminServices, 'index']);
$router->post('/api/admin/services', [$adminServices, 'store']);
$router->get('/api/admin/services/{id}', [$adminServices, 'show']);
$router->put('/api/admin/services/{id}', [$adminServices, 'update']);
$router->post('/api/admin/services/{id}/status', [$adminServices, 'setStatus']);
$router->post('/api/admin/services/{id}/verification', [$adminServices, 'setVerification']);
$router->get('/api/admin/services/{id}/revisions', [$adminServices, 'revisions']);
$router->get('/api/admin/services/{id}/revisions/{revisionId}', [$adminServices, 'revision']);
$router->post('/api/admin/services/{id}/revisions/{revisionId}/restore', [$adminServices, 'restoreRevision']);

$adminAgencies = new AdminAgencyController();
foreach (['agencies' => $adminAgencies, 'offices' => new AdminOfficeController(), 'categories' => new AdminCategoryController()] as $resource => $controller) {
    $router->get("/api/admin/{$resource}", [$controller, 'index']);
    $router->post("/api/admin/{$resource}", [$controller, 'store']);
    $router->put("/api/admin/{$resource}/{id}", [$controller, 'update']);
}
$router->post('/api/admin/agencies/{id}/logo', [$adminAgencies, 'uploadLogo']);
$router->delete('/api/admin/agencies/{id}/logo', [$adminAgencies, 'removeLogo']);
