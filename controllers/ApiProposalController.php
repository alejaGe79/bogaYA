<?php
class ApiProposalController {

    public function create() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);
        if (Auth::getUserRole() !== 'lawyer') Response::error('Solo abogados', 403);

        $input = json_decode(file_get_contents('php://input'), true);
        $caseId = $input['case_id'] ?? '';
        $presupuesto = $input['presupuesto'] ?? 0;
        $mensaje = $input['mensaje'] ?? '';

        if (!$caseId || $presupuesto <= 0) {
            Response::error('Datos inválidos');
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT id, client_id FROM cases WHERE id = ? AND estado = 'abierto'");
        $stmt->execute([$caseId]);
        $case = $stmt->fetch();
        if (!$case) Response::error('Caso no válido o ya cerrado', 404);

        try {
            $stmt = $db->prepare("INSERT INTO proposals (case_id, lawyer_id, presupuesto, mensaje, created_at) 
                                  VALUES (?, ?, ?, ?, NOW())");
            $stmt->execute([$caseId, $userId, $presupuesto, $mensaje]);

            Notification::send($case['client_id'], '📩 Nueva propuesta', 'Un abogado se ha postulado a tu caso.');
            Notification::saveNotification($case['client_id'], 'new_proposal', '📩 Nueva propuesta', 'Un abogado se ha postulado a tu caso.', '/dashboard');

            Response::success(['message' => 'Postulación enviada']);
        } catch (PDOException $e) {
            if ($e->errorInfo[1] == 1062) Response::error('Ya te postulaste a este caso', 409);
            else Response::error('Error al postularse', 500);
        }
    }

    public function getByLawyer() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);
        if (Auth::getUserRole() !== 'lawyer') Response::error('Solo abogados', 403);

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT p.*, c.titulo, c.area_legal, c.provincia, u.name as client_name 
                              FROM proposals p 
                              JOIN cases c ON p.case_id = c.id 
                              JOIN users u ON c.client_id = u.id 
                              WHERE p.lawyer_id = ? 
                              ORDER BY p.created_at DESC");
        $stmt->execute([$userId]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($data);
    }

    public function updateStatus($id) {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);
        if (Auth::getUserRole() !== 'client') Response::error('Solo clientes', 403);

        $input = json_decode(file_get_contents('php://input'), true);
        $status = $input['status'] ?? '';
        if (!in_array($status, ['aceptada', 'rechazada'])) {
            Response::error('Estado no válido');
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT p.case_id, c.client_id, p.lawyer_id
                              FROM proposals p 
                              JOIN cases c ON p.case_id = c.id 
                              WHERE p.id = ?");
        $stmt->execute([$id]);
        $prop = $stmt->fetch();
        if (!$prop) Response::error('Propuesta no encontrada', 404);
        if ($prop['client_id'] != $userId) Response::error('No autorizado', 403);

        $stmt = $db->prepare("UPDATE proposals SET estado = ? WHERE id = ?");
        $stmt->execute([$status, $id]);

        if ($status === 'aceptada') {
            $stmt = $db->prepare("UPDATE cases SET estado = 'en_negociacion' WHERE id = ?");
            $stmt->execute([$prop['case_id']]);

            Notification::send($prop['lawyer_id'], '🎉 Propuesta aceptada', 'Tu propuesta fue aceptada por el cliente.');
            Notification::saveNotification($prop['lawyer_id'], 'proposal_accepted', '🎉 Propuesta aceptada', 'Tu propuesta fue aceptada por el cliente.', '/dashboard-lawyer');
        } else {
            Notification::send($prop['lawyer_id'], '❌ Propuesta rechazada', 'Tu propuesta fue rechazada por el cliente.');
            Notification::saveNotification($prop['lawyer_id'], 'proposal_rejected', '❌ Propuesta rechazada', 'Tu propuesta fue rechazada por el cliente.', '/dashboard-lawyer');
        }

        Response::success(['message' => 'Estado actualizado']);
    }

    public function getByCase($caseId) {
            $userId = Auth::getUserId();

            if (!$userId) {
                Response::error(
                    'No autenticado',
                    401
                );
            }

            $role = Auth::getUserRole();

            $db =
                Database::getInstance()
                ->getConnection();

            // Buscar el caso.
            $stmt = $db->prepare("
                SELECT
                    id,
                    client_id,
                    estado
                FROM cases
                WHERE id = ?
                LIMIT 1
            ");

            $stmt->execute([
                $caseId
            ]);

            $case =
                $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$case) {
                Response::error(
                    'Caso no encontrado',
                    404
                );
            }

            // Solo el dueño o admin puede ver
            // las propuestas.
            if (
                (int)$case['client_id'] !== (int)$userId &&
                $role !== 'admin'
            ) {
                Response::error(
                    'No autorizado',
                    403
                );
            }

            $stmt = $db->prepare("
                SELECT
                    p.id,
                    p.case_id,
                    p.lawyer_id,
                    p.presupuesto,
                    p.mensaje,
                    p.estado,
                    p.created_at,

                    u.name AS lawyer_name,
                    u.email AS lawyer_email,
                    u.foto AS lawyer_foto,
                    u.email_verified,

                    CASE
                        WHEN lp.mostrar_telefono = 1
                        THEN u.phone
                        ELSE NULL
                    END AS phone,

                    lp.matricula,
                    lp.provincia,
                    lp.ciudad,
                    lp.verified,
                    lp.plan_type

                FROM proposals p

                JOIN users u
                    ON p.lawyer_id = u.id

                JOIN lawyer_profiles lp
                    ON u.id = lp.user_id

                WHERE p.case_id = ?

                ORDER BY
                    CASE
                        WHEN p.estado = 'pendiente'
                        THEN 1
                        ELSE 2
                    END,
                    p.created_at DESC
            ");

            $stmt->execute([
                $caseId
            ]);

            $data =
                $stmt->fetchAll(
                    PDO::FETCH_ASSOC
                );

            Response::success(
                $data
            );
    }
    
}
?>