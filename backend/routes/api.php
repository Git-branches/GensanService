<?php

use App\Controllers\AgencyController;
use App\Controllers\CategoryController;
use App\Controllers\OfficeController;
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
