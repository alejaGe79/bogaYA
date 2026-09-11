<?php

class ApiMessageController
{
    /**
     * Enviar mensaje entre cliente y abogado.
     */
    public function send()
    {
        $senderId = Auth::getUserId();

        if (!$senderId) {
            Response::error(
                'No autenticado',
                401
            );
        }

        $input = json_decode(
            file_get_contents('php://input'),
            true
        );

        if (!is_array($input)) {
            Response::error(
                'Datos inválidos',
                400
            );
        }

        $receiverId = (int)($input['receiver_id'] ?? 0);
        $message = trim(
            $input['message'] ?? ''
        );

        $caseId = $input['case_id'] ?? null;

        if (!$receiverId) {
            Response::error(
                'Destinatario requerido',
                400
            );
        }

        if (
            $receiverId === (int)$senderId
        ) {
            Response::error(
                'No podés enviarte mensajes a vos mismo',
                400
            );
        }

        if ($message === '') {
            Response::error(
                'El mensaje no puede estar vacío',
                400
            );
        }

        if (mb_strlen($message) > 5000) {
            Response::error(
                'El mensaje no puede superar los 5000 caracteres',
                400
            );
        }

        $db =
            Database::getInstance()
            ->getConnection();

        // -----------------------------------------
        // DESTINATARIO
        // -----------------------------------------

        $stmt = $db->prepare("
            SELECT
                id,
                name,
                role,
                email_verified
            FROM users
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->execute([
            $receiverId
        ]);

        $receiver =
            $stmt->fetch(
                PDO::FETCH_ASSOC
            );

        if (!$receiver) {
            Response::error(
                'Usuario destinatario no encontrado',
                404
            );
        }

        $senderRole =
            Auth::getUserRole();

        // -----------------------------------------
        // SOLO CLIENTE <-> ABOGADO
        // -----------------------------------------

        $validConversation =
            (
                $senderRole === 'client' &&
                $receiver['role'] === 'lawyer'
            )
            ||
            (
                $senderRole === 'lawyer' &&
                $receiver['role'] === 'client'
            );

        if (!$validConversation) {
            Response::error(
                'Solo clientes y abogados pueden comunicarse entre sí',
                403
            );
        }

        // -----------------------------------------
        // CASO OPCIONAL
        // -----------------------------------------

        if ($caseId !== null && $caseId !== '') {

            $stmt = $db->prepare("
                SELECT
                    c.id,
                    c.client_id,

                    (
                        SELECT p.lawyer_id
                        FROM proposals p
                        WHERE p.case_id = c.id
                          AND p.lawyer_id = ?
                        LIMIT 1
                    ) AS lawyer_id

                FROM cases c

                WHERE c.id = ?

                LIMIT 1
            ");

            $relatedUserId =
                $senderRole === 'lawyer'
                    ? $senderId
                    : $receiverId;

            $stmt->execute([
                $relatedUserId,
                $caseId
            ]);

            $case =
                $stmt->fetch(
                    PDO::FETCH_ASSOC
                );

            if (!$case) {
                Response::error(
                    'Caso no encontrado',
                    404
                );
            }

            // El cliente del caso debe ser
            // una de las partes de la conversación.
            $isClientParticipant =
                (
                    (int)$case['client_id'] ===
                    (int)$senderId
                )
                ||
                (
                    (int)$case['client_id'] ===
                    (int)$receiverId
                );

            $isLawyerParticipant =
                !empty($case['lawyer_id']);

            if (
                !$isClientParticipant ||
                !$isLawyerParticipant
            ) {
                Response::error(
                    'No estás relacionado con ese caso',
                    403
                );
            }
        }

        // -----------------------------------------
        // INSERTAR MENSAJE
        // -----------------------------------------

        try {

            $stmt = $db->prepare("
                INSERT INTO messages
                (
                    sender_id,
                    receiver_id,
                    case_id,
                    message,
                    `read`,
                    created_at
                )
                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    0,
                    NOW()
                )
            ");

            $stmt->execute([
                $senderId,
                $receiverId,
                $caseId ?: null,
                $message
            ]);

            $messageId =
                $db->lastInsertId();

            // -------------------------------------
            // NOTIFICACIÓN
            // -------------------------------------

            Notification::send(
                $receiverId,
                '💬 Nuevo mensaje',
                'Recibiste un nuevo mensaje en BogaYA.'
            );

            Notification::saveNotification(
                $receiverId,
                'new_message',
                '💬 Nuevo mensaje',
                'Recibiste un nuevo mensaje en BogaYA.',
                '/messages'
            );

            Response::success([
                'id' => $messageId,
                'message' =>
                    'Mensaje enviado correctamente'
            ]);

        } catch (PDOException $e) {

            Response::error(
                'No se pudo enviar el mensaje',
                500
            );
        }
    }


    /**
     * Obtener conversación entre usuario autenticado
     * y otro usuario.
     *
     * Al abrir la conversación se marcan
     * como leídos SOLO los mensajes recibidos.
     */
    public function getConversation($userId)
    {
        $currentUser =
            Auth::getUserId();

        if (!$currentUser) {
            Response::error(
                'No autenticado',
                401
            );
        }

        $userId = (int)$userId;

        if (!$userId) {
            Response::error(
                'Usuario inválido',
                400
            );
        }

        if (
            $userId === (int)$currentUser
        ) {
            Response::error(
                'Conversación inválida',
                400
            );
        }

        $db =
            Database::getInstance()
            ->getConnection();

        // -----------------------------------------
        // VERIFICAR PARTICIPANTE
        // -----------------------------------------

        $stmt = $db->prepare("
            SELECT
                id,
                name,
                role,
                foto,
                avatar
            FROM users
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->execute([
            $userId
        ]);

        $otherUser =
            $stmt->fetch(
                PDO::FETCH_ASSOC
            );

        if (!$otherUser) {
            Response::error(
                'Usuario no encontrado',
                404
            );
        }

        // -----------------------------------------
        // MENSAJES
        // -----------------------------------------

        $stmt = $db->prepare("
            SELECT
                m.id,
                m.sender_id,
                m.receiver_id,
                m.case_id,
                m.message,
                m.`read`,
                m.created_at,

                u.name AS sender_name,
                u.foto AS sender_foto

            FROM messages m

            JOIN users u
                ON u.id = m.sender_id

            WHERE
                (
                    m.sender_id = ?
                    AND m.receiver_id = ?
                )
                OR
                (
                    m.sender_id = ?
                    AND m.receiver_id = ?
                )

            ORDER BY
                m.created_at ASC,
                m.id ASC
        ");

        $stmt->execute([
            $currentUser,
            $userId,
            $userId,
            $currentUser
        ]);

        $messages =
            $stmt->fetchAll(
                PDO::FETCH_ASSOC
            );

        // -----------------------------------------
        // MARCAR COMO LEÍDOS
        // -----------------------------------------

        $stmt = $db->prepare("
            UPDATE messages
            SET `read` = 1
            WHERE sender_id = ?
              AND receiver_id = ?
              AND `read` = 0
        ");

        $stmt->execute([
            $userId,
            $currentUser
        ]);

        Response::success([
            'user' => $otherUser,
            'messages' => $messages
        ]);
    }


    /**
     * Lista de conversaciones.
     */
    public function conversations()
    {
        $currentUser =
            Auth::getUserId();

        if (!$currentUser) {
            Response::error(
                'No autenticado',
                401
            );
        }

        $db =
            Database::getInstance()
            ->getConnection();

        $sql = "
            SELECT
                u.id,
                u.name,
                u.foto,
                u.avatar,

                (
                    SELECT m2.message
                    FROM messages m2
                    WHERE
                        (
                            m2.sender_id = ?
                            AND m2.receiver_id = u.id
                        )
                        OR
                        (
                            m2.sender_id = u.id
                            AND m2.receiver_id = ?
                        )
                    ORDER BY
                        m2.created_at DESC,
                        m2.id DESC
                    LIMIT 1
                ) AS last_message,

                (
                    SELECT m2.created_at
                    FROM messages m2
                    WHERE
                        (
                            m2.sender_id = ?
                            AND m2.receiver_id = u.id
                        )
                        OR
                        (
                            m2.sender_id = u.id
                            AND m2.receiver_id = ?
                        )
                    ORDER BY
                        m2.created_at DESC,
                        m2.id DESC
                    LIMIT 1
                ) AS last_message_at,

                (
                    SELECT COUNT(*)
                    FROM messages m3
                    WHERE
                        m3.sender_id = u.id
                        AND m3.receiver_id = ?
                        AND m3.`read` = 0
                ) AS unread_count

            FROM users u

            WHERE u.id IN (
                SELECT DISTINCT
                    CASE
                        WHEN sender_id = ?
                        THEN receiver_id
                        ELSE sender_id
                    END

                FROM messages

                WHERE
                    sender_id = ?
                    OR receiver_id = ?
            )

            ORDER BY
                last_message_at DESC
        ";

        $stmt =
            $db->prepare($sql);

        $stmt->execute([
            $currentUser,
            $currentUser,

            $currentUser,
            $currentUser,

            $currentUser,

            $currentUser,
            $currentUser,
            $currentUser
        ]);

        Response::success(
            $stmt->fetchAll(
                PDO::FETCH_ASSOC
            )
        );
    }
}
?>