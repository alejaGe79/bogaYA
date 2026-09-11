<?php

class ApiLawyerController
{
    public function list()
    {
        $db = Database::getInstance()->getConnection();

        $especialidad = trim($_GET['especialidad'] ?? '');
        $provincia = trim($_GET['provincia'] ?? '');
        $modo = trim($_GET['modo'] ?? '');

        $sql = "
            SELECT DISTINCT
                u.id,
                u.name,
                u.email,
                u.email_verified,
                u.foto,
                u.avatar,
                CASE
                    WHEN lp.mostrar_telefono = 1 THEN u.phone
                    ELSE NULL
                END AS phone,
                lp.matricula,
                lp.provincia,
                lp.ciudad,
                lp.bio,
                lp.virtual,
                lp.presencial,
                lp.verified,
                (
                    SELECT AVG(rating)
                    FROM reviews
                    WHERE lawyer_id = u.id
                ) AS avg_rating,
                (
                    SELECT COUNT(*)
                    FROM reviews
                    WHERE lawyer_id = u.id
                ) AS total_ratings,
                (
                    SELECT GROUP_CONCAT(especialidad SEPARATOR ', ')
                    FROM lawyer_specialties
                    WHERE user_id = u.id
                ) AS especialidades
            FROM users u
            JOIN lawyer_profiles lp
                ON u.id = lp.user_id
            WHERE u.role = 'lawyer'
        ";
        $sql .= "
            AND u.email_verified = 1
            AND lp.verified = 1
            AND TRIM(lp.matricula) <> ''
        ";

        $params = [];

        if ($especialidad !== '') {
            $sql .= "
                AND EXISTS (
                    SELECT 1
                    FROM lawyer_specialties ls
                    WHERE ls.user_id = u.id
                      AND ls.especialidad LIKE ?
                )
            ";

            $params[] = '%' . $especialidad . '%';
        }

        if ($provincia !== '') {
            $sql .= " AND lp.provincia = ?";
            $params[] = $provincia;
        }

        if ($modo === 'virtual') {
            $sql .= " AND lp.virtual = 1";
        } elseif ($modo === 'presencial') {
            $sql .= " AND lp.presencial = 1";
        }

        $sql .= "
            ORDER BY
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM lawyer_specialties ls
                        WHERE ls.user_id = u.id
                          AND ls.especialidad LIKE ?
                    )
                    THEN 1
                    ELSE 0
                END DESC,

                CASE lp.plan_type
                    WHEN 'estudio' THEN 1
                    WHEN 'pro' THEN 2
                    WHEN 'premium' THEN 3
                    ELSE 4
                END,

                avg_rating DESC
        ";

        $params[] = '%' . $especialidad . '%';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success($data);
    }

    public function get($id)
    {
        $db = Database::getInstance()->getConnection();

        $stmt = $db->prepare("
            SELECT
                u.id,
                u.name,
                u.email,
                u.email_verified,
                u.foto,
                CASE
                    WHEN lp.mostrar_telefono = 1 THEN u.phone
                    ELSE NULL
                END AS phone,
                lp.matricula,
                lp.provincia,
                lp.ciudad,
                lp.bio,
                lp.costo_consulta,
                lp.virtual,
                lp.presencial,
                lp.lat,
                lp.lng,
                lp.plan_type,
                lp.plan_expires,
                lp.verified,
                lp.mostrar_telefono,
                (
                    SELECT GROUP_CONCAT(especialidad SEPARATOR ', ')
                    FROM lawyer_specialties
                    WHERE user_id = u.id
                ) AS especialidades
            FROM users u
            JOIN lawyer_profiles lp
                ON u.id = lp.user_id
            WHERE u.id = ?
              AND u.role = 'lawyer'
            LIMIT 1
        ");

        $stmt->execute([$id]);

        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            Response::error('Abogado no encontrado', 404);
        }

        Response::success($data);
    }

    /**
     * Actualizar perfil completo del abogado.
     *
     * IMPORTANTE:
     * Este endpoint utiliza POST porque recibe multipart/form-data
     * y puede contener una foto.
     */
    public function updateProfile()
    {
        $userId = Auth::getUserId();

        if (!$userId) {
            Response::error('No autenticado', 401);
        }

        if (Auth::getUserRole() !== 'lawyer') {
            Response::error('Solo abogados pueden actualizar perfil', 403);
        }

        $db = Database::getInstance()->getConnection();

        // ==============================
        // DATOS DEL USUARIO
        // ==============================
        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $phone = trim($_POST['phone'] ?? '');

        if ($name === '') {
            Response::error('El nombre es obligatorio', 400);
        }

        if ($email === '') {
            Response::error('El email es obligatorio', 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('El email no es válido', 400);
        }

        // ==============================
        // DATOS PROFESIONALES
        // ==============================
        $matricula = trim($_POST['matricula'] ?? '');
        $provincia = trim($_POST['provincia'] ?? '');
        $ciudad = trim($_POST['ciudad'] ?? '');
        $bio = trim($_POST['bio'] ?? '');

        $costo_consulta = isset($_POST['costo_consulta'])
            ? (float)$_POST['costo_consulta']
            : 0;

        $virtual = isset($_POST['virtual'])
            ? (int)$_POST['virtual']
            : 0;

        $presencial = isset($_POST['presencial'])
            ? (int)$_POST['presencial']
            : 0;

        $mostrar_telefono = isset($_POST['mostrar_telefono'])
            ? (int)$_POST['mostrar_telefono']
            : 1;

        $lat = (
            isset($_POST['lat']) &&
            $_POST['lat'] !== ''
        )
            ? (float)$_POST['lat']
            : null;

        $lng = (
            isset($_POST['lng']) &&
            $_POST['lng'] !== ''
        )
            ? (float)$_POST['lng']
            : null;

        // ==============================
        // ESPECIALIDADES
        // ==============================
        $especialidades = [];

        if (
            isset($_POST['especialidades']) &&
            is_array($_POST['especialidades'])
        ) {

            $especialidades =
                $_POST['especialidades'];

        } elseif (
            isset($_POST['especialidades']) &&
            is_string($_POST['especialidades'])
        ) {

            // Compatibilidad con perfiles viejos
            $especialidades =
                explode(
                    ',',
                    $_POST['especialidades']
                );
        }

        $especialidadesLimpias = [];

        foreach ($especialidades as $esp) {

            $esp = trim($esp);

            if ($esp === '') {
                continue;
            }

            if (
                !in_array(
                    $esp,
                    $especialidadesLimpias,
                    true
                )
            ) {
                $especialidadesLimpias[] = $esp;
            }
        }

        // ==============================
        // EMAIL DUPLICADO
        // ==============================
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

        // ==============================
        // FOTO
        // ==============================
        $fotoPath = null;
        $fotoAnterior = null;

        if (
            isset($_FILES['foto']) &&
            $_FILES['foto']['error'] !== UPLOAD_ERR_NO_FILE
        ) {
            if ($_FILES['foto']['error'] !== UPLOAD_ERR_OK) {
                Response::error('No se pudo subir la foto', 400);
            }

            // 5 MB máximo
            $maxFileSize = 5 * 1024 * 1024;

            if ($_FILES['foto']['size'] > $maxFileSize) {
                Response::error(
                    'La foto no puede superar los 5 MB',
                    400
                );
            }

            $tmpFile = $_FILES['foto']['tmp_name'];

            if (!is_uploaded_file($tmpFile)) {
                Response::error('Archivo de foto inválido', 400);
            }

            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime = $finfo->file($tmpFile);

            $allowedMimes = [
                'image/jpeg' => 'jpg',
                'image/png'  => 'png',
                'image/webp' => 'webp'
            ];

            if (!isset($allowedMimes[$mime])) {
                Response::error(
                    'Formato de imagen no permitido. Usá JPG, PNG o WEBP',
                    400
                );
            }

            $ext = $allowedMimes[$mime];

            $uploadDir = __DIR__ . '/../public/uploads/';

            if (!is_dir($uploadDir)) {
                if (!mkdir($uploadDir, 0755, true)) {
                    Response::error(
                        'No se pudo crear el directorio de imágenes',
                        500
                    );
                }
            }

            if (!is_writable($uploadDir)) {
                Response::error(
                    'El directorio de imágenes no tiene permisos de escritura',
                    500
                );
            }

            $filename =
                'lawyer_' .
                $userId .
                '_' .
                bin2hex(random_bytes(8)) .
                '.' .
                $ext;

            $target = $uploadDir . $filename;

            if (!move_uploaded_file($tmpFile, $target)) {
                Response::error(
                    'No se pudo guardar la foto',
                    500
                );
            }

            $fotoPath = '/bogaya/public/uploads/' . $filename;

            // Foto actualmente almacenada
            $stmt = $db->prepare("
                SELECT foto
                FROM users
                WHERE id = ?
                LIMIT 1
            ");

            $stmt->execute([$userId]);

            $fotoAnterior = $stmt->fetchColumn();
        }

        // ==============================
        // TRANSACCIÓN
        // ==============================
        try {
            $db->beginTransaction();

            // ==============================
            // USERS
            // ==============================
            $sqlUser = "
                UPDATE users
                SET
                    name = ?,
                    phone = ?
            ";

            $paramsUser = [
                $name,
                $phone
            ];

            if ($fotoPath !== null) {
                $sqlUser .= ", foto = ?";
                $paramsUser[] = $fotoPath;
            }

            $sqlUser .= " WHERE id = ?";

            $paramsUser[] = $userId;

            $stmt = $db->prepare($sqlUser);
            $stmt->execute($paramsUser);

            // ==============================
            // LAWYER PROFILES
            // ==============================
            $stmt = $db->prepare("
                UPDATE lawyer_profiles
                SET
                    matricula = ?,
                    provincia = ?,
                    ciudad = ?,
                    bio = ?,
                    costo_consulta = ?,
                    virtual = ?,
                    presencial = ?,
                    mostrar_telefono = ?,
                    lat = ?,
                    lng = ?
                WHERE user_id = ?
            ");

            $stmt->execute([
                $matricula,
                $provincia,
                $ciudad,
                $bio,
                $costo_consulta,
                $virtual,
                $presencial,
                $mostrar_telefono,
                $lat,
                $lng,
                $userId
            ]);

            // ==============================
            // ESPECIALIDADES
            // ==============================
            $stmt = $db->prepare("
                DELETE FROM lawyer_specialties
                WHERE user_id = ?
            ");

            $stmt->execute([$userId]);

            if (!empty($especialidadesLimpias)) {
                $stmt = $db->prepare("
                    INSERT INTO lawyer_specialties
                        (user_id, especialidad)
                    VALUES
                        (?, ?)
                ");

                foreach ($especialidadesLimpias as $especialidad) {
                    $stmt->execute([
                        $userId,
                        $especialidad
                    ]);
                }
            }

            // ==============================
            // OBTENER PERFIL ACTUALIZADO
            // ==============================
            $stmt = $db->prepare("
                SELECT
                    u.id,
                    u.name,
                    u.email,
                    u.email_verified,
                    u.phone,
                    u.foto,
                    u.role,
                    lp.matricula,
                    lp.provincia,
                    lp.ciudad,
                    lp.bio,
                    lp.costo_consulta,
                    lp.virtual,
                    lp.presencial,
                    lp.lat,
                    lp.lng,
                    lp.plan_type,
                    lp.plan_expires,
                    lp.verified,
                    lp.mostrar_telefono
                FROM users u
                JOIN lawyer_profiles lp
                    ON u.id = lp.user_id
                WHERE u.id = ?
                LIMIT 1
            ");

            $stmt->execute([$userId]);

            $profile = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$profile) {
                throw new Exception(
                    'No se pudo recuperar el perfil actualizado'
                );
            }

            $stmt = $db->prepare("
                SELECT especialidad
                FROM lawyer_specialties
                WHERE user_id = ?
                ORDER BY id ASC
            ");

            $stmt->execute([$userId]);

            $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);

            $profile['especialidades'] = implode(
                ', ',
                $rows
            );

            $db->commit();

            // ==============================
            // ELIMINAR FOTO ANTERIOR
            // ==============================
            if (
                $fotoPath !== null &&
                $fotoAnterior
            ) {
                $oldRelativePath = str_replace(
                    '/bogaya/',
                    '',
                    $fotoAnterior
                );

                $oldFile = dirname(__DIR__) . '/' . $oldRelativePath;

                if (
                    is_file($oldFile) &&
                    strpos(
                        realpath($oldFile) ?: '',
                        realpath($uploadDir) ?: ''
                    ) === 0
                ) {
                    @unlink($oldFile);
                }
            }

            Response::success([
                'message' => 'Perfil actualizado correctamente',
                'profile' => $profile
            ]);
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }

            // Si se subió una foto nueva pero la BD falló,
            // eliminamos el archivo huérfano.
            if (
                $fotoPath !== null &&
                isset($target) &&
                is_file($target)
            ) {
                @unlink($target);
            }

            Response::error(
                'No se pudo actualizar el perfil',
                500
            );
        }
    }
}