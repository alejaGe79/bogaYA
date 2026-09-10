public function conversations()
{
    $currentUser = Auth::getUserId();

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
                    AND m3.read = 0
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