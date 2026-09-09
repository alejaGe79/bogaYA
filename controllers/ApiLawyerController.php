<?php
class ApiLawyerController {

    public function list() {
        $db = Database::getInstance()->getConnection();
        
        $especialidad = $_GET['especialidad'] ?? '';
        $provincia = $_GET['provincia'] ?? '';
        $modo = $_GET['modo'] ?? '';

        $sql = "SELECT DISTINCT u.id, u.name, u.email, u.foto,
                       CASE WHEN lp.mostrar_telefono = 1 THEN u.phone ELSE NULL END as phone,
                       lp.matricula, lp.provincia, lp.ciudad, lp.bio,
                       lp.virtual, lp.presencial, lp.verified,
                       (SELECT AVG(rating) FROM reviews WHERE lawyer_id = u.id) as avg_rating,
                       (SELECT COUNT(*) FROM reviews WHERE lawyer_id = u.id) as total_ratings,
                       (SELECT GROUP_CONCAT(especialidad SEPARATOR ', ') FROM lawyer_specialties WHERE user_id = u.id) as especialidades
                FROM users u 
                JOIN lawyer_profiles lp ON u.id = lp.user_id 
                WHERE u.role = 'lawyer' ";

        $params = [];
        if ($especialidad) {
            $sql .= " AND EXISTS (SELECT 1 FROM lawyer_specialties ls WHERE ls.user_id = u.id AND ls.especialidad LIKE ?)";
            $params[] = "%$especialidad%";
        }
        if ($provincia) {
            $sql .= " AND lp.provincia = ?";
            $params[] = $provincia;
        }
        if ($modo === 'virtual') {
            $sql .= " AND lp.virtual = 1";
        } elseif ($modo === 'presencial') {
            $sql .= " AND lp.presencial = 1";
        }

        $sql .= " ORDER BY 
                  CASE WHEN EXISTS (SELECT 1 FROM lawyer_specialties ls WHERE ls.user_id = u.id AND ls.especialidad LIKE ?) THEN 1 ELSE 0 END DESC,
                  CASE lp.plan_type WHEN 'estudio' THEN 1 WHEN 'pro' THEN 2 WHEN 'premium' THEN 3 ELSE 4 END,
                  avg_rating DESC";
        $params[] = "%$especialidad%";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($data);
    }

    public function get($id) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT u.id, u.name, u.email, u.foto,
                                     CASE WHEN lp.mostrar_telefono = 1 THEN u.phone ELSE NULL END as phone,
                                     lp.matricula, lp.provincia, lp.ciudad, lp.bio, lp.costo_consulta,
                                     lp.virtual, lp.presencial, lp.lat, lp.lng,
                                     lp.plan_type, lp.plan_expires, lp.verified, lp.mostrar_telefono,
                                     (SELECT GROUP_CONCAT(especialidad SEPARATOR ', ') FROM lawyer_specialties WHERE user_id = u.id) as especialidades
                              FROM users u 
                              JOIN lawyer_profiles lp ON u.id = lp.user_id 
                              WHERE u.id = ? AND u.role = 'lawyer'");
        $stmt->execute([$id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$data) Response::error('Abogado no encontrado', 404);
        Response::success($data);
    }

    public function updateProfile() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);
        if (Auth::getUserRole() !== 'lawyer') Response::error('Solo abogados pueden actualizar perfil', 403);

        // Manejar subida de foto
        $foto_path = null;
        if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = __DIR__ . '/../public/uploads/';
            if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);
            $ext = pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION);
            $filename = 'lawyer_' . $userId . '_' . time() . '.' . $ext;
            $target = $upload_dir . $filename;
            if (move_uploaded_file($_FILES['foto']['tmp_name'], $target)) {
                $foto_path = '/bogaya/public/uploads/' . $filename;
            }
        }

        // Obtener todos los campos del formulario
        $matricula = $_POST['matricula'] ?? '';
        $provincia = $_POST['provincia'] ?? '';
        $ciudad = $_POST['ciudad'] ?? '';
        $bio = $_POST['bio'] ?? '';
        $costo_consulta = $_POST['costo_consulta'] ?? 0;
        $virtual = isset($_POST['virtual']) ? (int)$_POST['virtual'] : 1;
        $presencial = isset($_POST['presencial']) ? (int)$_POST['presencial'] : 0;
        $mostrar_telefono = isset($_POST['mostrar_telefono']) ? (int)$_POST['mostrar_telefono'] : 1;
        $lat = isset($_POST['lat']) && $_POST['lat'] !== '' ? (float)$_POST['lat'] : null;
        $lng = isset($_POST['lng']) && $_POST['lng'] !== '' ? (float)$_POST['lng'] : null;
        $especialidades = isset($_POST['especialidades']) ? explode(',', $_POST['especialidades']) : [];

        $db = Database::getInstance()->getConnection();

        // Actualizar tabla users (nombre, email, teléfono, foto)
        $sql_user = "UPDATE users SET name = ?, email = ?, phone = ?";
        $params_user = [$_POST['name'] ?? '', $_POST['email'] ?? '', $_POST['phone'] ?? ''];
        if ($foto_path) {
            $sql_user .= ", foto = ?";
            $params_user[] = $foto_path;
        }
        $sql_user .= " WHERE id = ?";
        $params_user[] = $userId;
        $stmt = $db->prepare($sql_user);
        $stmt->execute($params_user);

        // Actualizar lawyer_profiles
        $sql = "UPDATE lawyer_profiles SET 
                matricula = ?, provincia = ?, ciudad = ?, bio = ?, 
                costo_consulta = ?, virtual = ?, presencial = ?, 
                mostrar_telefono = ?, lat = ?, lng = ?";
        $params = [$matricula, $provincia, $ciudad, $bio, $costo_consulta, $virtual, $presencial, $mostrar_telefono, $lat, $lng];
        $sql .= " WHERE user_id = ?";
        $params[] = $userId;
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        // Actualizar especialidades
        $stmt = $db->prepare("DELETE FROM lawyer_specialties WHERE user_id = ?");
        $stmt->execute([$userId]);
        foreach ($especialidades as $esp) {
            $esp = trim($esp);
            if ($esp) {
                $stmt = $db->prepare("INSERT INTO lawyer_specialties (user_id, especialidad) VALUES (?, ?)");
                $stmt->execute([$userId, $esp]);
            }
        }

        Response::success(['message' => 'Perfil actualizado correctamente']);
    }
}