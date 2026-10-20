<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Middleware\Cors;
use App\Response;
use App\Router;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

$appConfig = require __DIR__ . '/../config/app.php';

date_default_timezone_set($appConfig['timezone']);
error_reporting(E_ALL);
ini_set('display_errors', $appConfig['debug'] ? '1' : '0');

Cors::handle();

set_exception_handler(function (Throwable $e) use ($appConfig) {
    error_log($e->getMessage());
    Response::error(
        $appConfig['debug'] ? $e->getMessage() : 'Internal server error',
        500
    );
});

$router = new Router();
require __DIR__ . '/../routes/api.php';

$router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
