<?php
class ApiAuthController {

    public function register() {
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['email']) || empty($input['password']) || empty($input['name'])) {
            Response::error('Faltan datos: email, password, name');
        }
        
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$input['email']]);
        if ($stmt->fetch()) {
            Response::error('El email ya está registrado. Por favor, inicia sesión o usa otro email.', 409);
        }
        
        $hash = password_hash($input['password'], PASSWORD_DEFAULT);
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));
        if (
            !preg_match(
                '/^avatar_(0[1-9]|1[0-9]|20)$/',
                $avatar
            )
        ) {
            $avatar = 'avatar_01';
        }
        try {
            $stmt = $db->prepare("INSERT INTO users (email, email_verified, verification_token, verification_expires, password_hash, role, name, phone, avatar, created_at) 
                                  VALUES (?, 0, ?, ?, ?, ?, ?, ?, NOW())");
            $stmt->execute([
                $input['email'],
                $token,
                $expires,
                $hash,
                $input['role'] ?? 'client',
                $input['name'],
                $input['phone'] ?? '',
                $avatar
            ]);
            $userId = $db->lastInsertId();

            if (($input['role'] ?? 'client') === 'lawyer') {
                $stmt = $db->prepare("INSERT INTO lawyer_profiles (user_id, matricula, plan_type) VALUES (?, '', 'comun')");
                $stmt->execute([$userId]);
                
                if (!empty($input['especialidades']) && is_array($input['especialidades'])) {
                    foreach ($input['especialidades'] as $esp) {
                        if (trim($esp)) {
                            $stmt = $db->prepare("INSERT INTO lawyer_specialties (user_id, especialidad) VALUES (?, ?)");
                            $stmt->execute([$userId, trim($esp)]);
                        }
                    }
                }
            }

            $this->sendVerificationEmail($input['email'], $token, $input['name']);

            Response::success(['message' => 'Registro exitoso. Revisa tu email para verificar tu cuenta.', 'id' => $userId]);
        } catch (PDOException $e) {
            Response::error('Error en el servidor: ' . $e->getMessage(), 500);
        }
    }

    public function login() {
        $input = json_decode(file_get_contents('php://input'), true);
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        $remember = $input['remember'] ?? false;

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT id, password_hash, role, name, email_verified FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            Response::error('Credenciales incorrectas', 401);
        }

        if (!$user['email_verified']) {
            Response::error('Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.', 403);
        }

        $expires = $remember ? time() + (60 * 60 * 24 * 30) : time() + (60 * 60 * 24 * 7);
        $token = Auth::generateToken($user['id'], $user['role']);

        Response::success([
            'token' => $token,
            'user_id' => $user['id'],
            'role' => $user['role'],
            'name' => $user['name'],
            'email_verified' => $user['email_verified']
        ]);
    }

    public function verifyEmail() {
        $input = json_decode(file_get_contents('php://input'), true);
        $token = $input['token'] ?? '';
        
        if (!$token) Response::error('Token requerido');

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT id, email FROM users WHERE verification_token = ? AND verification_expires > NOW()");
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        
        if (!$user) Response::error('Token inválido o expirado', 400);

        $stmt = $db->prepare("UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires = NULL WHERE id = ?");
        $stmt->execute([$user['id']]);

        Response::success(['message' => 'Email verificado correctamente. Ya puedes iniciar sesión.']);
    }

    public function resendVerification() {
        $input = json_decode(file_get_contents('php://input'), true);
        $email = $input['email'] ?? '';

        if (!$email) Response::error('Email requerido');

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT id, name, verification_token FROM users WHERE email = ? AND email_verified = 0");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) Response::error('Usuario no encontrado o ya verificado', 404);

        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));
        $stmt = $db->prepare("UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?");
        $stmt->execute([$token, $expires, $user['id']]);

        $this->sendVerificationEmail($email, $token, $user['name']);

        Response::success(['message' => 'Nuevo email de verificación enviado.']);
    }

    private function sendVerificationEmail($email, $token, $name) {
        $link =
            BASE_URL .
            '/public/verify.php?token=' .
            $token;

        $subject =
            'Verifica tu cuenta en BogaYA';

        $message =
            "Hola $name,\n\n";

        $message .=
            "Gracias por registrarte en BogaYA.\n\n";

        $message .=
            "Para activar tu cuenta, ingresá al siguiente enlace:\n\n";

        $message .=
            $link . "\n\n";

        $message .=
            "El enlace expira en 24 horas.\n\n";

        $message .=
            "Saludos,\nEl equipo de BogaYA";

        $headers =
            "From: " .
            SMTP_FROM .
            "\r\n";

        $headers .=
            "Reply-To: " .
            SMTP_FROM .
            "\r\n";

        // Evita que una advertencia de mail()
        // rompa la respuesta JSON de la API.
        return @mail(
            $email,
            $subject,
            $message,
            $headers
        );
        $emailSent =
            $this->sendVerificationEmail(
                $input['email'],
                $token,
                $input['name']
            );

        Response::success([
            'message' =>
                'Registro exitoso. Revisa tu email para verificar tu cuenta.',
            'id' => $userId,
            'verification_email_sent' => $emailSent
        ]);
    }

    

    public function registerPushToken() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['token'])) Response::error('Token requerido');
        Notification::saveToken($userId, $input['token'], $input['device'] ?? 'web');
        Response::success(['message' => 'Token de push registrado']);
    }
}
?>