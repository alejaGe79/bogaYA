<?php
class ApiAdminController {

    private function checkAdmin() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);
        if (Auth::getUserRole() !== 'admin') Response::error('No autorizado', 403);
    }

    public function getUsers() {
        $this->checkAdmin();
        $db = Database::getInstance()->getConnection();
        $stmt = $db->query("SELECT id, email, name, role, phone, email_verified, created_at FROM users ORDER BY created_at DESC");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($data);
    }

    public function deleteUser($id) {
        $this->checkAdmin();
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("DELETE FROM users WHERE id = ? AND role != 'admin'");
        $stmt->execute([$id]);
        Response::success(['message' => 'Usuario eliminado']);
    }

    public function verifyLawyer() {
        $this->checkAdmin();
        $input = json_decode(file_get_contents('php://input'), true);
        $lawyerId = $input['user_id'] ?? 0;
        $verified = $input['verified'] ?? 0;

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("UPDATE lawyer_profiles SET verified = ? WHERE user_id = ?");
        $stmt->execute([$verified, $lawyerId]);
        Response::success(['message' => $verified ? 'Abogado verificado' : 'Verificación eliminada']);
    }

    public function changeRole() {
        $this->checkAdmin();
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $input['user_id'] ?? 0;
        $role = $input['role'] ?? '';

        if (!in_array($role, ['client', 'lawyer', 'admin'])) {
            Response::error('Rol inválido');
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("UPDATE users SET role = ? WHERE id = ?");
        $stmt->execute([$role, $userId]);
        Response::success(['message' => 'Rol actualizado']);
    }

    public function getCases() {
        $this->checkAdmin();
        $db = Database::getInstance()->getConnection();
        $stmt = $db->query("SELECT c.*, u.name as client_name,
                                   (SELECT COUNT(*) FROM proposals WHERE case_id = c.id) as proposals_count
                            FROM cases c 
                            JOIN users u ON c.client_id = u.id 
                            ORDER BY c.created_at DESC");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($data);
    }

    public function deleteCase($id) {
        $this->checkAdmin();
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("DELETE FROM cases WHERE id = ?");
        $stmt->execute([$id]);
        Response::success(['message' => 'Caso eliminado']);
    }

    public function getReviews() {
        $this->checkAdmin();
        $db = Database::getInstance()->getConnection();
        $stmt = $db->query("SELECT r.*, u.name as client_name, l.name as lawyer_name 
                            FROM reviews r 
                            JOIN users u ON r.client_id = u.id 
                            JOIN users l ON r.lawyer_id = l.id 
                            ORDER BY r.created_at DESC");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($data);
    }

    public function deleteReview($id) {
        $this->checkAdmin();
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("DELETE FROM reviews WHERE id = ?");
        $stmt->execute([$id]);
        Response::success(['message' => 'Reseña eliminada']);
    }

    public function getStats() {
        $this->checkAdmin();
        $db = Database::getInstance()->getConnection();
        
        $stats = [];
        $stats['total_usuarios'] = $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $stats['total_abogados'] = $db->query("SELECT COUNT(*) FROM users WHERE role = 'lawyer'")->fetchColumn();
        $stats['total_clientes'] = $db->query("SELECT COUNT(*) FROM users WHERE role = 'client'")->fetchColumn();
        $stats['total_casos'] = $db->query("SELECT COUNT(*) FROM cases")->fetchColumn();
        $stats['total_reseñas'] = $db->query("SELECT COUNT(*) FROM reviews")->fetchColumn();
        $stats['total_propuestas'] = $db->query("SELECT COUNT(*) FROM proposals")->fetchColumn();
        
        Response::success($stats);
    }

    public function getPendingVerifications() {
        $this->checkAdmin();
        $db = Database::getInstance()->getConnection();
        
        $stmt = $db->query("SELECT id, email, name, role, created_at FROM users WHERE email_verified = 0 ORDER BY created_at DESC");
        $pendingEmail = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $stmt = $db->query("SELECT u.id, u.email, u.name, lp.matricula, lp.verified 
                            FROM users u 
                            JOIN lawyer_profiles lp ON u.id = lp.user_id 
                            WHERE u.role = 'lawyer' AND lp.verified = 0");
        $pendingMatricula = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::success([
            'pending_email' => $pendingEmail,
            'pending_matricula' => $pendingMatricula
        ]);
    }

    public function verifyMatricula() {
        $this->checkAdmin();
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $input['user_id'] ?? 0;
        $verified = $input['verified'] ?? 0;

        if (!$userId) Response::error('ID de usuario requerido');

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("UPDATE lawyer_profiles SET verified = ? WHERE user_id = ?");
        $stmt->execute([$verified, $userId]);

        Response::success(['message' => $verified ? 'Matrícula verificada' : 'Verificación de matrícula eliminada']);
    }

    public function verifyEmailAdmin() {
        $this->checkAdmin();
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $input['user_id'] ?? 0;

        if (!$userId) Response::error('ID de usuario requerido');

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires = NULL WHERE id = ?");
        $stmt->execute([$userId]);

        Response::success(['message' => 'Email verificado manualmente']);
    }

    public function resetPassword() {
        $this->checkAdmin();
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $input['user_id'] ?? 0;
        $newPassword = $input['password'] ?? '';

        if (!$userId || strlen($newPassword) < 6) {
            Response::error('ID de usuario y contraseña de al menos 6 caracteres requeridos');
        }

        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $stmt->execute([$hash, $userId]);

        Response::success(['message' => 'Contraseña actualizada']);
    }

    public function getEstudios() {
        $this->checkAdmin();
        $db = Database::getInstance()->getConnection();
        $stmt = $db->query("SELECT e.*, u.name as admin_name, 
                                   (SELECT COUNT(*) FROM lawyer_profiles WHERE estudio_id = e.id) as miembros
                            FROM estudios e 
                            JOIN users u ON e.admin_id = u.id");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($data);
    }
}
?>