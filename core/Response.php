<?php
class Response {
    public static function json($data, $code = 200) {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function error($message, $code = 400) {
        self::json(['success' => false, 'error' => $message], $code);
    }

    public static function success($data = []) {
        self::json(['success' => true, 'data' => $data]);
    }
}
?>