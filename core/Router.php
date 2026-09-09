<?php
class Router {
    private $routes = [];

    public function add($method, $path, $handler) {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler
        ];
    }

    public function dispatch($requestUri, $requestMethod) {
        $uri = strtok($requestUri, '?');
        
        foreach ($this->routes as $route) {
            $pattern = preg_replace('/\{[a-zA-Z0-9_]+\}/', '([a-zA-Z0-9_-]+)', $route['path']);
            $pattern = '#^' . $pattern . '$#';

            if ($route['method'] === $requestMethod && preg_match($pattern, $uri, $matches)) {
                array_shift($matches);
                list($controllerName, $methodName) = explode('@', $route['handler']);
                
                if (!class_exists($controllerName)) {
                    require_once __DIR__ . '/../controllers/' . $controllerName . '.php';
                }
                
                $controller = new $controllerName();
                return call_user_func_array([$controller, $methodName], $matches);
            }
        }

        http_response_code(404);
        echo json_encode(["error" => "Ruta no encontrada"]);
    }
}
?>