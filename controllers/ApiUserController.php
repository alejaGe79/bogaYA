<?php
class ApiUserController {

    public function get($id) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) Response::error('Usuario no encontrado', 404);
        Response::success($user);
    }

    public function update() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);
        $input = json_decode(file_get_contents('php://input'), true);
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?");
        $stmt->execute([$input['name'], $input['email'], $input['phone'] ?? '', $userId]);
        // Si es abogado, actualizar también perfil
        if (Auth::getUserRole() === 'lawyer') {
            $stmt = $db->prepare("UPDATE lawyer_profiles SET matricula = ?, especialidad = ?, provincia = ?, bio = ?, virtual = ?, presencial = ?, mostrar_telefono = ? WHERE user_id = ?");
            $stmt->execute([
                $input['matricula'] ?? '',
                $input['especialidad'] ?? '',
                $input['provincia'] ?? '',
                $input['bio'] ?? '',
                $input['virtual'] ?? 1,
                $input['presencial'] ?? 0,
                $input['mostrar_telefono'] ?? 1,
                $userId
            ]);
        }
        Response::success(['message' => 'Perfil actualizado']);
    }


    public function updateProfile() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);

        $input = json_decode(file_get_contents('php://input'), true);
        $db = Database::getInstance()->getConnection();

        $stmt = $db->prepare("UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?");
        $stmt->execute([
            $input['name'] ?? '',
            $input['email'] ?? '',
            $input['phone'] ?? '',
            $userId
        ]);

        Response::success(['message' => 'Perfil actualizado']);
    }
}