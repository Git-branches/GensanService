<?php

namespace App;

class Router
{
    /** @var array<string, array<array{pattern: string, paramNames: string[], handler: callable}>> */
    private array $routes = [];

    public function get(string $path, callable $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    public function put(string $path, callable $handler): void
    {
        $this->add('PUT', $path, $handler);
    }

    public function delete(string $path, callable $handler): void
    {
        $this->add('DELETE', $path, $handler);
    }

    private function add(string $method, string $path, callable $handler): void
    {
        $paramNames = [];
        $pattern = preg_replace_callback('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', function ($matches) use (&$paramNames) {
            $paramNames[] = $matches[1];
            return '([^/]+)';
        }, $path);

        $this->routes[$method][] = [
            'pattern' => '#^' . $pattern . '$#',
            'paramNames' => $paramNames,
            'handler' => $handler,
        ];
    }

    public function dispatch(string $method, string $uri): void
    {
        $path = rtrim(parse_url($uri, PHP_URL_PATH) ?? '/', '/');
        if ($path === '') {
            $path = '/';
        }

        $candidates = $this->routes[$method] ?? [];

        foreach ($candidates as $route) {
            if (preg_match($route['pattern'], $path, $matches)) {
                array_shift($matches);
                $params = array_combine($route['paramNames'], $matches);
                call_user_func($route['handler'], $params);
                return;
            }
        }

        $knownPath = false;
        foreach ($this->routes as $routesForMethod) {
            foreach ($routesForMethod as $route) {
                if (preg_match($route['pattern'], $path)) {
                    $knownPath = true;
                    break 2;
                }
            }
        }

        if ($knownPath) {
            Response::error('Method not allowed', 405);
        }

        Response::notFound('Endpoint not found');
    }
}
