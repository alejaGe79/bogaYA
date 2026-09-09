<?php
class Auth {
    public static function generateToken($userId, $role) {
        $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = base64_encode(json_encode([
            'user_id' => $userId,
            'role' => $role,
            'exp' => time() + (60 * 60 * 24 * 7) // 7 días
        ]));
        $signature = hash_hmac('sha256', $header . '.' . $payload, JWT_SECRET, true);
        $signature = base64_encode($signature);
        return $header . '.' . $payload . '.' . $signature;
    }

    public static function validateToken($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return false;
        
        list($header, $payload, $signature) = $parts;
        $expectedSignature = base64_encode(hash_hmac('sha256', $header . '.' . $payload, JWT_SECRET, true));
        
        if ($signature !== $expectedSignature) return false;
        
        $payloadData = json_decode(base64_decode($payload), true);
        if ($payloadData['exp'] < time()) return false;
        
        return $payloadData;
    }

    public static function getUserId() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        if (strpos($authHeader, 'Bearer ') === 0) {
            $token = substr($authHeader, 7);
            $data = self::validateToken($token);
            return $data ? $data['user_id'] : null;
        }
        return null;
    }

    public static function getUserRole() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        if (strpos($authHeader, 'Bearer ') === 0) {
            $token = substr($authHeader, 7);
            $data = self::validateToken($token);
            return $data ? $data['role'] : null;
        }
        return null;
    }
}
?>