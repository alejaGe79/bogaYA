<?php
class ApiCaseController {

    public function create() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);
        if (Auth::getUserRole() !== 'client') Response::error('Solo clientes pueden publicar casos', 403);

        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['titulo']) || empty($input['area_legal'])) {
            Response::error('Faltan datos: titulo y area_legal');
        }

        $db = Database::getInstance()->getConnection();
        $id = $this->generateUUID();
        $vigencia = $input['vigencia_dias'] ?? 30;

        $stmt = $db->prepare("INSERT INTO cases (id, client_id, titulo, descripcion, area_legal, provincia, vigencia_dias, estado, created_at) 
                              VALUES (?, ?, ?, ?, ?, ?, ?, 'abierto', NOW())");
        $stmt->execute([
            $id,
            $userId,
            $input['titulo'],
            $input['descripcion'] ?? '',
            $input['area_legal'],
            $input['provincia'] ?? '',
            $vigencia
        ]);

        Response::success(['id' => $id, 'message' => 'Caso publicado correctamente']);
    }

    public function list()
{
    $userId = Auth::getUserId();
    $role = Auth::getUserRole();

    if (!$userId) {
        Response::error(
            'No autenticado',
            401
        );
    }

    $db = Database::getInstance()->getConnection();

    $estado = $_GET['estado'] ?? 'abierto';
    $area = trim($_GET['area'] ?? '');

    // =========================================
    // CLIENTE
    // =========================================

    if ($role === 'client') {

        $sql = "
            SELECT
                c.*,
                u.name AS client_name,
                u.phone AS client_phone,
                (
                    SELECT COUNT(*)
                    FROM proposals
                    WHERE case_id = c.id
                ) AS proposals_count

            FROM cases c

            JOIN users u
                ON c.client_id = u.id

            WHERE c.client_id = ?
        ";

        $params = [
            $userId
        ];

        if ($area !== '') {

            $sql .= "
                AND c.area_legal LIKE ?
            ";

            $params[] =
                '%' . $area . '%';
        }

        $sql .= "
            ORDER BY c.created_at DESC
        ";

        $stmt =
            $db->prepare($sql);

        $stmt->execute($params);

        Response::success(
            $stmt->fetchAll(
                PDO::FETCH_ASSOC
            )
        );
    }

    // =========================================
    // ABOGADO
    // =========================================

    if ($role === 'lawyer') {

        // Verificación del propio abogado
        $stmt = $db->prepare("
            SELECT
                u.email_verified,
                lp.verified,
                lp.matricula
            FROM users u
            JOIN lawyer_profiles lp
                ON u.id = lp.user_id
            WHERE u.id = ?
              AND u.role = 'lawyer'
            LIMIT 1
        ");

        $stmt->execute([
            $userId
        ]);

        $lawyer = $stmt->fetch(
            PDO::FETCH_ASSOC
        );

        if (!$lawyer) {

            Response::error(
                'Perfil de abogado no encontrado',
                404
            );
        }

        if (
            (int)$lawyer['email_verified'] !== 1 ||
            (int)$lawyer['verified'] !== 1 ||
            trim($lawyer['matricula']) === ''
        ) {

            Response::error(
                'Tu cuenta debe tener email y matrícula verificados para acceder a los casos.',
                403
            );
        }

        // =====================================
        // CASOS DISPONIBLES
        // =====================================

        $sql = "
            SELECT
                c.*,
                u.name AS client_name,

                (
                    SELECT COUNT(*)
                    FROM proposals
                    WHERE case_id = c.id
                ) AS proposals_count

            FROM cases c

            JOIN users u
                ON c.client_id = u.id

            WHERE c.estado = 'abierto'

              AND DATE_ADD(
                    c.created_at,
                    INTERVAL c.vigencia_dias DAY
                  ) > NOW()

              AND u.email_verified = 1

              AND NOT EXISTS (
                    SELECT 1
                    FROM proposals p
                    WHERE p.case_id = c.id
                      AND p.lawyer_id = ?
              )
        ";

        $params = [
            $userId
        ];

        if ($area !== '') {

            $sql .= "
                AND c.area_legal LIKE ?
            ";

            $params[] =
                '%' . $area . '%';
        }

        $sql .= "
            ORDER BY c.created_at DESC
        ";

        $stmt =
            $db->prepare($sql);

        $stmt->execute($params);

        Response::success(
            $stmt->fetchAll(
                PDO::FETCH_ASSOC
            )
        );
    }

    // =========================================
    // ADMIN
    // =========================================

    if ($role === 'admin') {

        $sql = "
            SELECT
                c.*,
                u.name AS client_name,

                (
                    SELECT COUNT(*)
                    FROM proposals
                    WHERE case_id = c.id
                ) AS proposals_count

            FROM cases c

            JOIN users u
                ON c.client_id = u.id

            ORDER BY c.created_at DESC
        ";

        $stmt =
            $db->query($sql);

        Response::success(
            $stmt->fetchAll(
                PDO::FETCH_ASSOC
            )
        );
    }

    Response::error(
        'Rol no válido',
        403
    );
}

    public function get($id) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT c.*, u.name as client_name, u.phone as client_phone 
                              FROM cases c 
                              JOIN users u ON c.client_id = u.id 
                              WHERE c.id = ?");
        $stmt->execute([$id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$data) Response::error('Caso no encontrado', 404);
        Response::success($data);
    }

    public function update($id) {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);

        $input = json_decode(file_get_contents('php://input'), true);
        $db = Database::getInstance()->getConnection();

        $stmt = $db->prepare("SELECT client_id FROM cases WHERE id = ?");
        $stmt->execute([$id]);
        $case = $stmt->fetch();
        if (!$case || $case['client_id'] != $userId) {
            Response::error('No autorizado o caso inexistente', 403);
        }

        $stmt = $db->prepare("UPDATE cases SET titulo = ?, descripcion = ?, area_legal = ?, provincia = ?, vigencia_dias = ? WHERE id = ?");
        $stmt->execute([
            $input['titulo'] ?? '',
            $input['descripcion'] ?? '',
            $input['area_legal'] ?? '',
            $input['provincia'] ?? '',
            $input['vigencia_dias'] ?? 30,
            $id
        ]);
        Response::success(['message' => 'Caso actualizado']);
    }

    public function close($id) {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT client_id FROM cases WHERE id = ?");
        $stmt->execute([$id]);
        $case = $stmt->fetch();
        if (!$case) Response::error('Caso no encontrado', 404);

        $role = Auth::getUserRole();
        if ($case['client_id'] != $userId && $role !== 'admin') {
            Response::error('No autorizado', 403);
        }

        $stmt = $db->prepare("UPDATE cases SET estado = 'cerrado', fecha_cierre = NOW() WHERE id = ?");
        $stmt->execute([$id]);

        $stmt = $db->prepare("SELECT lawyer_id FROM proposals WHERE case_id = ? AND estado = 'aceptada' LIMIT 1");
        $stmt->execute([$id]);
        $lawyerId = $stmt->fetchColumn();

        if ($lawyerId) {
            Notification::send($lawyerId, '📌 Caso cerrado', 'El caso ha sido cerrado. Deja tu reseña.');
            Notification::send($case['client_id'], '📌 Caso cerrado', 'El caso ha sido cerrado. Deja tu reseña.');
            Notification::saveNotification($lawyerId, 'case_closed', 'Caso cerrado', 'El caso ha sido cerrado. Deja tu reseña.', '/dashboard');
            Notification::saveNotification($case['client_id'], 'case_closed', 'Caso cerrado', 'El caso ha sido cerrado. Deja tu reseña.', '/dashboard');
        }

        Response::success(['message' => 'Caso cerrado correctamente']);
    }

    public function getAcceptedCases() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);
        if (Auth::getUserRole() !== 'lawyer') Response::error('Solo abogados', 403);

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT c.*, u.name as client_name 
                              FROM cases c 
                              JOIN proposals p ON c.id = p.case_id 
                              JOIN users u ON c.client_id = u.id 
                              WHERE p.lawyer_id = ? AND p.estado = 'aceptada'
                              ORDER BY c.created_at DESC");
        $stmt->execute([$userId]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($data);
    }

    public function getOfferedCases() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);
        if (Auth::getUserRole() !== 'lawyer') Response::error('Solo abogados', 403);

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT c.*, u.name as client_name, p.mensaje, p.presupuesto
                              FROM cases c 
                              JOIN proposals p ON c.id = p.case_id 
                              JOIN users u ON c.client_id = u.id 
                              WHERE p.lawyer_id = ? AND p.estado = 'pendiente'
                              ORDER BY c.created_at DESC");
        $stmt->execute([$userId]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($data);
    }

    public function getClosedCases() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);
        if (Auth::getUserRole() !== 'lawyer') Response::error('Solo abogados', 403);

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT c.*, u.name as client_name 
                              FROM cases c 
                              JOIN proposals p ON c.id = p.case_id 
                              JOIN users u ON c.client_id = u.id 
                              WHERE p.lawyer_id = ? AND c.estado = 'cerrado'
                              ORDER BY c.created_at DESC");
        $stmt->execute([$userId]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($data);
    }

    private function generateUUID() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
?>