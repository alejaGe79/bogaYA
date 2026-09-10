<?php

class ApiUserController
{
    /**
     * Obtener el perfil del usuario autenticado.
     */
    public function getProfile()
    {
        $userId = Auth::getUserId();

        if (!$userId) {
            Response::error('No autenticado', 401);
        }

        $db = Database::getInstance()->getConnection();

        $stmt = $db->prepare("
            SELECT
                id,
                name,
                email,
                phone,
                foto,
                role,
                email_verified,
                created_at
            FROM users
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->execute([$userId]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            Response::error('Usuario no encontrado', 404);
        }

        Response::success($user);
    }

    /**
     * Método legado.
     *
     * Se mantiene para no romper código antiguo.
     * No debería ser utilizado por el frontend nuevo.
     */
    public function get($id)
    {
        $userId = Auth::getUserId();

        if (!$userId) {
            Response::error('No autenticado', 401);
        }

        // Solo permitir consultar el propio usuario.
        if ((int)$id !== (int)$userId) {
            Response::error('No autorizado', 403);
        }

        $db = Database::getInstance()->getConnection();

        $stmt = $db->prepare("
            SELECT
                id,
                name,
                email,
                phone,
                foto,
                role,
                created_at
            FROM users
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->execute([$userId]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            Response::error('Usuario no encontrado', 404);
        }

        Response::success($user);
    }

    /**
     * Método anterior de actualización.
     *
     * Se conserva por compatibilidad.
     * El frontend actual utiliza updateProfile().
     */
    public function update()
    {
        $userId = Auth::getUserId();

        if (!$userId) {
            Response::error('No autenticado', 401);
        }

        $input = json_decode(file_get_contents('php://input'), true);

        if (!is_array($input)) {
            Response::error('Datos inválidos', 400);
        }

        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $phone = trim($input['phone'] ?? '');

        if ($name === '') {
            Response::error('El nombre es obligatorio', 400);
        }

        if ($email === '') {
            Response::error('El email es obligatorio', 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('El email no es válido', 400);
        }

        $db = Database::getInstance()->getConnection();

        try {
            $stmt = $db->prepare("
                UPDATE users
                SET
                    name = ?,
                    phone = ?
                WHERE id = ?
            ");

            $stmt->execute([
                $name,
                $phone,
                $userId
            ]);

            Response::success([
                'message' => 'Perfil actualizado'
            ]);
        } catch (PDOException $e) {
            Response::error('No se pudo actualizar el perfil', 500);
        }
    }

    /**
     * Actualizar perfil del usuario autenticado.
     *
     * Utilizado actualmente por clientes.
     */
    public function updateProfile()
    {
        $userId = Auth::getUserId();

        if (!$userId) {
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

        $name = trim(
            $input['name'] ?? ''
        );

        $email = trim(
            $input['email'] ?? ''
        );

        $phone = trim(
            $input['phone'] ?? ''
        );

        if ($name === '') {
            Response::error(
                'El nombre es obligatorio',
                400
            );
        }

        if (
            $email === '' ||
            !filter_var(
                $email,
                FILTER_VALIDATE_EMAIL
            )
        ) {
            Response::error(
                'El email no es válido',
                400
            );
        }

        $db = Database::getInstance()->getConnection();

        // Comprobar que el email no pertenezca
        // a otro usuario.
        $stmt = $db->prepare("
            SELECT id
            FROM users
            WHERE email = ?
              AND id <> ?
            LIMIT 1
        ");

        $stmt->execute([
            $email,
            $userId
        ]);

        if ($stmt->fetch()) {
            Response::error(
                'Ese email ya está registrado por otro usuario',
                409
            );
        }

        try {

            $stmt = $db->prepare("
                UPDATE users
                SET
                    name = ?,
                    phone = ?
                WHERE id = ?
            ");

            $stmt->execute([
                $name,
                $phone,
                $userId
            ]);

            $stmt = $db->prepare("
                SELECT
                    id,
                    name,
                    email,
                    phone,
                    foto,
                    role,
                    email_verified,
                    created_at
                FROM users
                WHERE id = ?
                LIMIT 1
            ");

            $stmt->execute([
                $userId
            ]);

            $user = $stmt->fetch(
                PDO::FETCH_ASSOC
            );

            Response::success([
                'message' => 'Perfil actualizado correctamente',
                'user' => $user
            ]);

        } catch (PDOException $e) {

            Response::error(
                'No se pudo actualizar el perfil',
                500
            );
        }
    }
}