<?php
class ApiAppointmentController {

    public function create() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);
        if (Auth::getUserRole() !== 'client') Response::error('Solo clientes pueden solicitar turnos', 403);

        $input = json_decode(file_get_contents('php://input'), true);
        $lawyerId = $input['lawyer_id'] ?? 0;
        $dateTime = $input['fecha_hora'] ?? '';
        $caseId = $input['case_id'] ?? null;
        $modalidad = $input['modalidad'] ?? 'virtual';
        $direccion = $input['direccion'] ?? '';
        $notas = $input['notas_cliente'] ?? '';

        if (!$lawyerId || !$dateTime) {
            Response::error('Faltan datos: lawyer_id y fecha_hora');
        }
        if ($modalidad === 'presencial' && !$direccion) {
            Response::error('Para turno presencial se requiere dirección');
        }

        $db = Database::getInstance()->getConnection();

        $stmt = $db->prepare("SELECT id FROM users WHERE id = ? AND role = 'lawyer'");
        $stmt->execute([$lawyerId]);
        if (!$stmt->fetch()) Response::error('Abogado no válido', 404);

        $stmt = $db->prepare("SELECT id FROM appointments 
                              WHERE lawyer_id = ? 
                              AND estado NOT IN ('cancelada', 'completada')
                              AND fecha_hora BETWEEN DATE_SUB(?, INTERVAL 30 MINUTE) AND DATE_ADD(?, INTERVAL 30 MINUTE)");
        $stmt->execute([$lawyerId, $dateTime, $dateTime]);
        if ($stmt->fetch()) Response::error('El abogado ya tiene un turno cerca de esa hora', 409);

        $stmt = $db->prepare("INSERT INTO appointments 
                              (client_id, lawyer_id, case_id, fecha_hora, modalidad, direccion, estado, notas_cliente, created_at) 
                              VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?, NOW())");
        $stmt->execute([$userId, $lawyerId, $caseId, $dateTime, $modalidad, $direccion, $notas]);
        $appointmentId = $db->lastInsertId();

        $stmt = $db->query("SELECT name FROM users WHERE id = $userId");
        $clientName = $stmt->fetchColumn();

        Notification::send(
            $lawyerId, 
            '📅 Nuevo turno solicitado', 
            "{$clientName} pidió un turno para el " . date('d/m H:i', strtotime($dateTime)),
            ['appointment_id' => $appointmentId, 'type' => 'new_appointment']
        );
        Notification::saveNotification(
            $lawyerId,
            'new_appointment',
            '📅 Nuevo turno solicitado',
            "{$clientName} pidió un turno para el " . date('d/m H:i', strtotime($dateTime)),
            '/agenda'
        );

        Notification::send(
            $userId, 
            '✅ Turno enviado', 
            "Tu solicitud fue enviada. Esperá la confirmación del abogado.",
            ['appointment_id' => $appointmentId, 'type' => 'client_confirmation']
        );

        Response::success(['id' => $appointmentId, 'message' => 'Turno solicitado correctamente']);
    }

    public function getLawyerAppointments() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);
        if (Auth::getUserRole() !== 'lawyer') Response::error('Solo abogados', 403);

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT a.*, u.name as client_name, u.email as client_email, u.phone as client_phone,
                                     c.titulo as case_titulo
                              FROM appointments a 
                              JOIN users u ON a.client_id = u.id 
                              LEFT JOIN cases c ON a.case_id = c.id
                              WHERE a.lawyer_id = ? 
                              ORDER BY a.fecha_hora DESC");
        $stmt->execute([$userId]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($data);
    }

    public function getClientAppointments() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);
        if (Auth::getUserRole() !== 'client') Response::error('Solo clientes', 403);

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT a.*, u.name as lawyer_name, u.email as lawyer_email,
                                     c.titulo as case_titulo
                              FROM appointments a 
                              JOIN users u ON a.lawyer_id = u.id 
                              LEFT JOIN cases c ON a.case_id = c.id
                              WHERE a.client_id = ? 
                              ORDER BY a.fecha_hora DESC");
        $stmt->execute([$userId]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($data);
    }

    public function updateStatus($id) {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);

        $input = json_decode(file_get_contents('php://input'), true);
        $status = $input['status'] ?? '';

        if (!in_array($status, ['confirmada', 'cancelada', 'completada'])) {
            Response::error('Estado no válido');
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT client_id, lawyer_id FROM appointments WHERE id = ?");
        $stmt->execute([$id]);
        $appointment = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$appointment) Response::error('Turno no encontrado', 404);

        if ($appointment['lawyer_id'] != $userId && $appointment['client_id'] != $userId) {
            Response::error('No tenés permiso para cambiar este turno', 403);
        }

        $stmt = $db->prepare("UPDATE appointments SET estado = ? WHERE id = ?");
        $stmt->execute([$status, $id]);

        if ($status === 'confirmada') {
            Notification::send($appointment['client_id'], '✅ Turno confirmado', 'Tu turno fue confirmado por el abogado.');
            Notification::send($appointment['lawyer_id'], '✅ Turno confirmado', 'Confirmaste el turno correctamente.');
            Notification::saveNotification($appointment['client_id'], 'appointment_confirmed', '✅ Turno confirmado', 'Tu turno fue confirmado por el abogado.', '/agenda');
        } elseif ($status === 'cancelada') {
            $who = ($userId == $appointment['lawyer_id']) ? 'El abogado' : 'El cliente';
            Notification::send($appointment['client_id'], '❌ Turno cancelado', "{$who} canceló el turno.");
            Notification::send($appointment['lawyer_id'], '❌ Turno cancelado', "{$who} canceló el turno.");
            Notification::saveNotification($appointment['client_id'], 'appointment_cancelled', '❌ Turno cancelado', "{$who} canceló el turno.", '/agenda');
        } elseif ($status === 'completada') {
            Notification::send($appointment['client_id'], '✔️ Turno completado', 'El turno fue marcado como completado.');
            Notification::send($appointment['lawyer_id'], '✔️ Turno completado', 'Turno completado correctamente.');
        }

        Response::success(['message' => 'Estado actualizado correctamente']);
    }

    public function reschedule($id) {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);

        $input = json_decode(file_get_contents('php://input'), true);
        $fecha_hora = $input['fecha_hora'] ?? '';
        $motivo = $input['motivo'] ?? '';

        if (!$fecha_hora) Response::error('Fecha y hora requerida');

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT * FROM appointments WHERE id = ?");
        $stmt->execute([$id]);
        $appointment = $stmt->fetch();
        if (!$appointment) Response::error('Turno no encontrado', 404);

        if ($appointment['client_id'] != $userId && $appointment['lawyer_id'] != $userId) {
            Response::error('No autorizado', 403);
        }

        $nota = "Solicitud de cambio de fecha: " . $fecha_hora . " - Motivo: " . $motivo;
        $stmt = $db->prepare("UPDATE appointments SET fecha_hora = ?, estado = 'pendiente', notas_abogado = CONCAT(IFNULL(notas_abogado, ''), ' | ', ?) WHERE id = ?");
        $stmt->execute([$fecha_hora, $nota, $id]);

        $otraParte = ($userId == $appointment['client_id']) ? $appointment['lawyer_id'] : $appointment['client_id'];
        Notification::send($otraParte, '📅 Cambio de turno', 'Se ha solicitado un cambio de fecha para el turno.');
        Notification::saveNotification($otraParte, 'appointment_rescheduled', '📅 Cambio de turno', 'Se ha solicitado un cambio de fecha para el turno.', '/agenda');

        Response::success(['message' => 'Turno reprogramado']);
    }
}
?>