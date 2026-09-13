-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 13-09-2026 a las 20:02:10
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Base de datos: `bogaya_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `admin_logs`
--

CREATE TABLE `admin_logs` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `action` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `lawyer_id` int(11) NOT NULL,
  `case_id` char(36) DEFAULT NULL,
  `fecha_hora` datetime NOT NULL,
  `duracion_minutos` int(11) DEFAULT 60,
  `modalidad` enum('virtual','presencial') DEFAULT 'virtual',
  `direccion` varchar(255) DEFAULT NULL,
  `estado` enum('pendiente','confirmada','completada','cancelada') DEFAULT 'pendiente',
  `notas_cliente` text DEFAULT NULL,
  `notas_abogado` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `appointments`
--

INSERT INTO `appointments` (`id`, `client_id`, `lawyer_id`, `case_id`, `fecha_hora`, `duracion_minutos`, `modalidad`, `direccion`, `estado`, `notas_cliente`, `notas_abogado`, `created_at`) VALUES
(1, 4, 2, NULL, '2026-09-16 10:45:00', 60, 'virtual', '', 'cancelada', 'es muy urgente', ' | Solicitud de cambio de fecha: 2026-09-11T12:30 - Motivo: puede ser un poquito mas tarde? | Solicitud de cambio de fecha: 2026-09-16T10:45 - Motivo: cambio juez', '2026-09-08 19:39:45'),
(2, 4, 2, NULL, '2026-09-16 14:00:00', 60, 'virtual', '', 'confirmada', '', NULL, '2026-09-10 12:47:20'),
(3, 5, 7, NULL, '2026-09-17 15:14:00', 60, 'virtual', '', 'confirmada', '', NULL, '2026-09-10 13:12:52'),
(4, 4, 7, NULL, '2026-09-13 17:14:00', 60, 'virtual', '', 'confirmada', '', NULL, '2026-09-10 14:12:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `avatars`
--

CREATE TABLE `avatars` (
  `id` int(11) NOT NULL,
  `codigo` varchar(30) NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `archivo` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `avatars`
--

INSERT INTO `avatars` (`id`, `codigo`, `nombre`, `archivo`, `activo`, `created_at`) VALUES
(1, 'avatar_01', 'Gatito', 'avatar_01.png', 1, '2026-09-10 17:41:04'),
(2, 'avatar_02', 'Perrito', 'avatar_02.png', 1, '2026-09-10 17:41:04'),
(3, 'avatar_03', 'Osito', 'avatar_03.png', 1, '2026-09-10 17:41:04'),
(4, 'avatar_04', 'Pandita', 'avatar_04.png', 1, '2026-09-10 17:41:04'),
(5, 'avatar_05', 'Conejito', 'avatar_05.png', 1, '2026-09-10 17:41:04'),
(6, 'avatar_06', 'Zorrito', 'avatar_06.png', 1, '2026-09-10 17:41:04'),
(7, 'avatar_07', 'Koala', 'avatar_07.png', 1, '2026-09-10 17:41:04'),
(8, 'avatar_08', 'Mapachito', 'avatar_08.png', 1, '2026-09-10 17:41:04'),
(9, 'avatar_09', 'Pingüinito', 'avatar_09.png', 1, '2026-09-10 17:41:04'),
(10, 'avatar_10', 'Búhito', 'avatar_10.png', 1, '2026-09-10 17:41:04'),
(11, 'avatar_11', 'Capibara', 'avatar_11.png', 1, '2026-09-10 17:41:04'),
(12, 'avatar_12', 'Leoncito', 'avatar_12.png', 1, '2026-09-10 17:41:04'),
(13, 'avatar_13', 'Unicornio', 'avatar_13.png', 1, '2026-09-10 17:41:04'),
(14, 'avatar_14', 'Panda rojo', 'avatar_14.png', 1, '2026-09-10 17:41:04'),
(15, 'avatar_15', 'Osito polar', 'avatar_15.png', 1, '2026-09-10 17:41:04');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cases`
--

CREATE TABLE `cases` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `client_id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `area_legal` varchar(100) DEFAULT NULL,
  `provincia` varchar(50) DEFAULT NULL,
  `vigencia_dias` int(11) DEFAULT 30,
  `fecha_cierre` datetime DEFAULT NULL,
  `estado` enum('abierto','en_negociacion','cerrado') DEFAULT 'abierto',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cases`
--

INSERT INTO `cases` (`id`, `client_id`, `titulo`, `descripcion`, `area_legal`, `provincia`, `vigencia_dias`, `fecha_cierre`, `estado`, `created_at`) VALUES
('45348983-418d-4997-ac49-89f658f224a7', 5, 'Abogado del niño', 'Me quiero divorciar de mis padres', 'Familia', 'Buenos Aires', 30, '2026-09-10 12:43:49', 'cerrado', '2026-09-09 09:03:41'),
('574585c5-b917-4bf6-a22a-3d73693f0f6d', 8, 'Debito de mi sueldo', 'El banco ma saca casi todo mi sueldo', 'Comercial', 'Buenos Aires', 30, '2026-09-10 17:32:46', 'cerrado', '2026-09-10 14:21:14'),
('75386b75-92e1-49ee-8649-2ac607647d7f', 4, 'Me despidieron sin causa', 'Sol aleja me despidieron sin causa', 'Laboral', 'Buenos Aires', 30, '2026-09-10 12:45:15', 'cerrado', '2026-09-08 19:39:07'),
('ad2aa7ce-2358-41b6-9ada-95189f54259d', 5, 'Abuso de autoridad', 'Las maestras nos quitaron el recreo', 'Familia', 'Buenos Aires', 30, '2026-09-10 15:03:14', 'cerrado', '2026-09-10 14:57:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudios`
--

CREATE TABLE `estudios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `lawyer_profiles`
--

CREATE TABLE `lawyer_profiles` (
  `user_id` int(11) NOT NULL,
  `matricula` varchar(50) NOT NULL DEFAULT '',
  `provincia` varchar(50) DEFAULT NULL,
  `ciudad` varchar(50) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `costo_consulta` decimal(10,2) DEFAULT 0.00,
  `virtual` tinyint(1) DEFAULT 1,
  `presencial` tinyint(1) DEFAULT 0,
  `lat` decimal(10,8) DEFAULT NULL,
  `lng` decimal(11,8) DEFAULT NULL,
  `plan_type` enum('comun','premium','pro','estudio') DEFAULT 'comun',
  `plan_expires` datetime DEFAULT NULL,
  `verified` tinyint(1) DEFAULT 0,
  `mostrar_telefono` tinyint(1) DEFAULT 1,
  `estudio_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `lawyer_profiles`
--

INSERT INTO `lawyer_profiles` (`user_id`, `matricula`, `provincia`, `ciudad`, `bio`, `costo_consulta`, `virtual`, `presencial`, `lat`, `lng`, `plan_type`, `plan_expires`, `verified`, `mostrar_telefono`, `estudio_id`) VALUES
(2, 'VXXIII 49', 'Buenos Aires', '', 'www.bucciestudiojuridico.com.ar', 35000.00, 1, 1, NULL, NULL, 'comun', NULL, 1, 1, NULL),
(3, 'MAT-001', 'Buenos Aires', '', 'Patricio Melconi', 50000.00, 1, 1, NULL, NULL, 'comun', NULL, 1, 1, NULL),
(7, 'MAT-934', 'Buenos Aires', '', 'burlando.com', 100000.00, 0, 1, NULL, NULL, 'comun', NULL, 1, 0, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `lawyer_specialties`
--

CREATE TABLE `lawyer_specialties` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `especialidad` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `lawyer_specialties`
--

INSERT INTO `lawyer_specialties` (`id`, `user_id`, `especialidad`) VALUES
(11, 2, 'Civil'),
(13, 2, 'Familia'),
(14, 2, 'Inmobiliario'),
(10, 2, 'Laboral'),
(12, 2, 'Penal'),
(15, 2, 'Sucesiones'),
(7, 3, 'Civil'),
(6, 3, 'Familia'),
(8, 3, 'Laboral'),
(9, 3, 'Penal'),
(17, 7, 'Civil'),
(19, 7, 'Comercial'),
(20, 7, 'Inmobiliario'),
(16, 7, 'Laboral'),
(18, 7, 'Penal'),
(22, 7, 'Sucesiones'),
(21, 7, 'Tributario');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `case_id` char(36) DEFAULT NULL,
  `message` text NOT NULL,
  `read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `messages`
--

INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `case_id`, `message`, `read`, `created_at`) VALUES
(1, 5, 2, NULL, 'hola sol', 1, '2026-09-10 15:30:41'),
(2, 5, 3, NULL, 'hola patricio', 0, '2026-09-10 15:30:54'),
(3, 4, 2, NULL, 'hola dol', 1, '2026-09-10 15:33:42'),
(4, 4, 2, NULL, 'sol', 1, '2026-09-10 15:43:41'),
(5, 8, 2, NULL, 'sol', 1, '2026-09-10 15:45:54'),
(6, 2, 8, NULL, 'hola', 1, '2026-09-10 16:33:24'),
(7, 5, 2, NULL, 'no escribe', 1, '2026-09-10 16:34:37'),
(8, 2, 5, NULL, 'a ver', 1, '2026-09-10 16:43:23'),
(9, 5, 3, NULL, 'dsffdsfsd', 0, '2026-09-10 16:46:19'),
(10, 2, 5, NULL, 'aca estoy', 0, '2026-09-10 17:32:16'),
(11, 8, 2, NULL, 'hola', 1, '2026-09-10 17:33:22'),
(12, 2, 8, NULL, 'aca estoy', 0, '2026-09-10 17:37:37'),
(13, 2, 5, NULL, 'hfdfgfdgdf', 0, '2026-09-10 17:37:45');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `link` varchar(255) DEFAULT NULL,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `link`, `read_at`, `created_at`) VALUES
(1, 2, 'new_appointment', '📅 Nuevo turno solicitado', 'Aleja Geier pidió un turno para el 11/09 11:00', '/agenda', '2026-09-08 21:47:17', '2026-09-08 19:39:46'),
(2, 4, 'appointment_confirmed', '✅ Turno confirmado', 'Tu turno fue confirmado por el abogado.', '/agenda', '2026-09-08 21:48:30', '2026-09-08 19:41:00'),
(3, 4, 'appointment_rescheduled', '📅 Cambio de turno', 'Se ha solicitado un cambio de fecha para el turno.', '/agenda', '2026-09-08 21:48:30', '2026-09-08 19:42:31'),
(4, 4, 'new_proposal', '📩 Nueva propuesta', 'Un abogado se ha postulado a tu caso.', '/dashboard', '2026-09-08 21:48:30', '2026-09-08 21:33:20'),
(5, 4, 'appointment_confirmed', '✅ Turno confirmado', 'Tu turno fue confirmado por el abogado.', '/agenda', '2026-09-08 21:48:30', '2026-09-08 21:47:46'),
(6, 5, 'new_proposal', '📩 Nueva propuesta', 'Un abogado se ha postulado a tu caso.', '/dashboard', '2026-09-10 11:02:48', '2026-09-10 09:42:32'),
(7, 2, 'appointment_rescheduled', '📅 Cambio de turno', 'Se ha solicitado un cambio de fecha para el turno.', '/agenda', '2026-09-10 09:45:40', '2026-09-10 09:44:52'),
(8, 4, 'appointment_confirmed', '✅ Turno confirmado', 'Tu turno fue confirmado por el abogado.', '/agenda', '2026-09-10 11:08:23', '2026-09-10 11:07:55'),
(9, 4, 'appointment_cancelled', '❌ Turno cancelado', 'El abogado canceló el turno.', '/agenda', '2026-09-10 11:57:18', '2026-09-10 11:56:55'),
(10, 2, 'proposal_accepted', '🎉 Propuesta aceptada', 'Tu propuesta fue aceptada por el cliente.', '/dashboard-lawyer', '2026-09-10 12:08:17', '2026-09-10 12:07:47'),
(11, 2, 'proposal_accepted', '🎉 Propuesta aceptada', 'Tu propuesta fue aceptada por el cliente.', '/dashboard-lawyer', '2026-09-10 12:44:39', '2026-09-10 12:43:45'),
(12, 2, 'case_closed', 'Caso cerrado', 'El caso ha sido cerrado. Dejá tu reseña.', '/dashboard-lawyer', '2026-09-10 12:44:39', '2026-09-10 12:43:50'),
(13, 5, 'case_closed', 'Caso cerrado', 'El caso ha sido cerrado. Podés dejar tu reseña.', '/dashboard', '2026-09-10 12:44:01', '2026-09-10 12:43:50'),
(14, 2, 'new_review', '⭐ Nueva reseña', 'El cliente te ha calificado con 5 estrellas.', '/profile', '2026-09-10 12:44:39', '2026-09-10 12:44:13'),
(15, 2, 'case_closed', 'Caso cerrado', 'El caso ha sido cerrado. Dejá tu reseña.', '/dashboard-lawyer', '2026-09-10 12:45:30', '2026-09-10 12:45:16'),
(16, 4, 'case_closed', 'Caso cerrado', 'El caso ha sido cerrado. Podés dejar tu reseña.', '/dashboard', '2026-09-10 12:45:40', '2026-09-10 12:45:18'),
(17, 2, 'new_review', '⭐ Nueva reseña', 'El cliente te ha calificado con 5 estrellas.', '/profile', '2026-09-10 12:48:31', '2026-09-10 12:46:11'),
(18, 2, 'new_appointment', '📅 Nuevo turno solicitado', 'Aleja Geier pidió un turno para el 16/09 14:00', '/agenda', '2026-09-10 12:48:31', '2026-09-10 12:47:21'),
(19, 4, 'appointment_confirmed', '✅ Turno confirmado', 'Tu turno fue confirmado por el abogado.', '/agenda', '2026-09-10 12:51:40', '2026-09-10 12:51:35'),
(20, 7, 'new_appointment', '📅 Nuevo turno solicitado', 'Rio pidió un turno para el 17/09 15:14', '/agenda', '2026-09-10 14:59:03', '2026-09-10 13:12:52'),
(21, 7, 'new_appointment', '📅 Nuevo turno solicitado', 'Aleja Geier pidió un turno para el 13/09 17:14', '/agenda', '2026-09-10 14:59:03', '2026-09-10 14:12:01'),
(22, 8, 'new_proposal', '📩 Nueva propuesta', 'Un abogado se ha postulado a tu caso.', '/dashboard', '2026-09-10 15:45:13', '2026-09-10 14:34:19'),
(23, 5, 'appointment_confirmed', '✅ Turno confirmado', 'Tu turno fue confirmado por el abogado.', '/agenda', '2026-09-10 15:02:31', '2026-09-10 14:59:25'),
(24, 4, 'appointment_confirmed', '✅ Turno confirmado', 'Tu turno fue confirmado por el abogado.', '/agenda', '2026-09-10 14:59:40', '2026-09-10 14:59:29'),
(25, 5, 'new_proposal', '📩 Nueva propuesta', 'Un abogado se ha postulado a tu caso.', '/dashboard', '2026-09-10 15:02:31', '2026-09-10 14:59:55'),
(26, 7, 'proposal_accepted', '🎉 Propuesta aceptada', 'Tu propuesta fue aceptada por el cliente.', '/dashboard-lawyer', '2026-09-10 15:05:11', '2026-09-10 15:02:59'),
(27, 7, 'case_closed', '📌 Caso cerrado', 'El cliente cerró el caso.', '/dashboard-lawyer', '2026-09-10 15:05:11', '2026-09-10 15:03:14'),
(28, 7, 'new_review', '⭐ Nueva reseña', 'El cliente te ha calificado con 3 estrellas.', '/profile', '2026-09-10 15:05:11', '2026-09-10 15:03:35'),
(29, 2, 'new_message', '💬 Nuevo mensaje', 'Recibiste un nuevo mensaje en BogaYA.', '/messages', '2026-09-10 15:31:16', '2026-09-10 15:30:42'),
(30, 3, 'new_message', '💬 Nuevo mensaje', 'Recibiste un nuevo mensaje en BogaYA.', '/messages', NULL, '2026-09-10 15:30:54'),
(31, 2, 'new_message', '💬 Nuevo mensaje', 'Recibiste un nuevo mensaje en BogaYA.', '/messages', '2026-09-10 15:33:58', '2026-09-10 15:33:43'),
(32, 2, 'new_message', '💬 Nuevo mensaje', 'Recibiste un nuevo mensaje en BogaYA.', '/messages', '2026-09-10 15:44:20', '2026-09-10 15:43:42'),
(33, 2, 'proposal_accepted', '🎉 Propuesta aceptada', 'Tu propuesta fue aceptada por el cliente.', '/dashboard-lawyer', '2026-09-10 15:46:12', '2026-09-10 15:45:32'),
(34, 2, 'new_message', '💬 Nuevo mensaje', 'Recibiste un nuevo mensaje en BogaYA.', '/messages', '2026-09-10 15:46:12', '2026-09-10 15:45:55'),
(35, 8, 'new_message', '💬 Nuevo mensaje', 'Recibiste un nuevo mensaje en BogaYA.', '/messages', '2026-09-10 17:33:01', '2026-09-10 16:33:24'),
(36, 2, 'new_message', '💬 Nuevo mensaje', 'Recibiste un nuevo mensaje en BogaYA.', '/messages', '2026-09-10 16:43:09', '2026-09-10 16:34:38'),
(37, 5, 'new_message', '💬 Nuevo mensaje', 'Recibiste un nuevo mensaje en BogaYA.', '/messages', '2026-09-10 16:43:40', '2026-09-10 16:43:23'),
(38, 3, 'new_message', '💬 Nuevo mensaje', 'Recibiste un nuevo mensaje en BogaYA.', '/messages', NULL, '2026-09-10 16:46:19'),
(39, 5, 'new_message', '💬 Nuevo mensaje', 'Recibiste un nuevo mensaje en BogaYA.', '/messages', '2026-09-10 17:43:19', '2026-09-10 17:32:16'),
(40, 8, 'case_closed', '📌 Caso cerrado', 'El abogado cerró el caso. Ahora podés dejar una reseña.', '/dashboard', '2026-09-10 17:33:01', '2026-09-10 17:32:46'),
(41, 2, 'new_message', '💬 Nuevo mensaje', 'Recibiste un nuevo mensaje en BogaYA.', '/messages', '2026-09-10 17:37:29', '2026-09-10 17:33:24'),
(42, 8, 'new_message', '💬 Nuevo mensaje', 'Recibiste un nuevo mensaje en BogaYA.', '/messages', NULL, '2026-09-10 17:37:37'),
(43, 5, 'new_message', '💬 Nuevo mensaje', 'Recibiste un nuevo mensaje en BogaYA.', '/messages', '2026-09-10 17:43:19', '2026-09-10 17:37:45');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `mp_preference_id` varchar(100) DEFAULT NULL,
  `mp_payment_id` varchar(100) DEFAULT NULL,
  `plan` enum('comun','premium','pro','estudio') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','paid','failed') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proposals`
--

CREATE TABLE `proposals` (
  `id` int(11) NOT NULL,
  `case_id` char(36) NOT NULL,
  `lawyer_id` int(11) NOT NULL,
  `presupuesto` decimal(10,2) NOT NULL,
  `mensaje` text DEFAULT NULL,
  `estado` enum('pendiente','aceptada','rechazada') DEFAULT 'pendiente',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `proposals`
--

INSERT INTO `proposals` (`id`, `case_id`, `lawyer_id`, `presupuesto`, `mensaje`, `estado`, `created_at`) VALUES
(1, '75386b75-92e1-49ee-8649-2ac607647d7f', 2, 50000.00, 'Yo quiero', 'aceptada', '2026-09-08 21:33:19'),
(2, '45348983-418d-4997-ac49-89f658f224a7', 2, 20000.00, 'Quiero cubrir esto', 'aceptada', '2026-09-10 09:42:32'),
(5, '574585c5-b917-4bf6-a22a-3d73693f0f6d', 2, 150000.00, 'te escribo', 'aceptada', '2026-09-10 14:34:19'),
(6, 'ad2aa7ce-2358-41b6-9ada-95189f54259d', 7, 3.00, 'dale', 'aceptada', '2026-09-10 14:59:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `push_tokens`
--

CREATE TABLE `push_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` text NOT NULL,
  `device` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `push_tokens`
--

INSERT INTO `push_tokens` (`id`, `user_id`, `token`, `device`, `created_at`) VALUES
(2, 1, 'dummy_token_1788883502592', 'web', '2026-09-08 13:05:02'),
(3, 4, 'dummy_token_1788884894716', 'web', '2026-09-08 13:28:14'),
(4, 4, 'dummy_token_1788884991482', 'web', '2026-09-08 13:29:51'),
(5, 4, 'dummy_token_1788906754713', 'web', '2026-09-08 19:32:34'),
(6, 2, 'dummy_token_1788906895500', 'web', '2026-09-08 19:34:55'),
(7, 4, 'dummy_token_1788907049574', 'web', '2026-09-08 19:37:29'),
(8, 2, 'dummy_token_1788907219073', 'web', '2026-09-08 19:40:19');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `lawyer_id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `case_id` char(36) DEFAULT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `resumen` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `visible` tinyint(1) NOT NULL DEFAULT 1,
  `hidden_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `reviews`
--

INSERT INTO `reviews` (`id`, `lawyer_id`, `client_id`, `case_id`, `rating`, `comment`, `resumen`, `created_at`, `visible`, `hidden_at`) VALUES
(1, 2, 5, '45348983-418d-4997-ac49-89f658f224a7', 5, 'perfecto me encanto', 'llebo todo paso por paso', '2026-09-10 12:44:12', 1, NULL),
(2, 2, 4, '75386b75-92e1-49ee-8649-2ac607647d7f', 5, 'efgfdgfdg', 'fdgfdgfdgfd', '2026-09-10 12:46:10', 1, NULL),
(3, 7, 5, 'ad2aa7ce-2358-41b6-9ada-95189f54259d', 3, 'no me gusto su autoritarismo', 'lo hizo bien pero no me dejo opínar', '2026-09-10 15:03:35', 1, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `verification_token` varchar(64) DEFAULT NULL,
  `verification_expires` datetime DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('client','lawyer','admin') DEFAULT 'client',
  `phone` varchar(20) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `avatar` varchar(30) DEFAULT 'avatar_01'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `email`, `email_verified`, `verification_token`, `verification_expires`, `password_hash`, `name`, `role`, `phone`, `foto`, `created_at`, `avatar`) VALUES
(1, 'admin@bogaya.com', 1, 'a35480a13e816706afe94107fe0e18bedba0ace8e814760812addbedc4657bee', NULL, '$2y$10$V/EGJ4esp9Sbv0s.nKXkg./XZVIccwtqsbDUIVRU6b8PgWJlOGRuu', 'Administrador', 'admin', NULL, NULL, '2026-09-08 13:02:53', 'avatar_01'),
(2, 'msolbucci@gmail.com', 1, 'a35480a13e816706afe94107fe0e18bedba0ace8e814760812addbedc4657bee', '2026-09-09 13:16:59', '$2y$10$S.Zj13Rw.xzxvD7KyEn/OOpcu/MSzhEgADGlLytYfWdkbcIuPQ.Re', 'Maria Sol', 'lawyer', '221 637 2123', '/bogaya/public/uploads/lawyer_2_438664cf21327513.png', '2026-09-08 13:16:59', 'avatar_01'),
(3, 'pomelc@gmail.com', 1, 'c23b97f70a2152eb70f5e316d4bd960b35f5cdb3e2aef414c8fcd86dc1754b94', '2026-09-09 13:17:31', '$2y$10$V/EGJ4esp9Sbv0s.nKXkg./XZVIccwtqsbDUIVRU6b8PgWJlOGRuu', 'Patricio Melconi', 'lawyer', '221 456 4534', '/bogaya/public/uploads/lawyer_3_2acec6518ac5f89b.png', '2026-09-08 13:17:31', 'avatar_01'),
(4, 'aleja.geier@gmail.com', 1, 'ac45d064304401b3160ae67e0b646fab3421c8cb5fe3217a67d67c55e2653f7b', '2026-09-09 13:18:29', '$2y$10$TbErwHVOH7rTHLCv/rhDveEZedBj6XVCNpm.57xrcOa65BmAupvza', 'Aleja Geier', 'client', '221 6372123', NULL, '2026-09-08 13:18:29', 'avatar_01'),
(5, 'rio@gmail.com', 1, NULL, NULL, '$2y$10$5PEsLEqknJ6qntwIDZopp.4UyqZ/tKL8XfD5Ud3YLWjcKMhFaCAze', 'Rio', 'client', '2213456789', NULL, '2026-09-09 08:36:29', 'avatar_01'),
(6, 'piti@mail.com', 1, NULL, NULL, '$2y$10$VnxPPJK3UGZ4Jlx7vUGVteK8sz77tNjTLlo9.k0n.WqNr.fxaryoe', 'Piti Alvarez', 'client', '', NULL, '2026-09-10 12:54:57', 'avatar_01'),
(7, 'burlando@mail.com', 1, NULL, NULL, '$2y$10$DFZwzEMExKiGZpFM75zkEeq3zCqClXMZ0rxa8y2CMZQzLbZA2dsjK', 'Burlando', 'lawyer', '11 2345 6787', '/bogaya/public/uploads/lawyer_7_aeab2fddfcb09f2a.png', '2026-09-10 13:07:57', 'avatar_01'),
(8, 'prey@mail.com', 1, NULL, NULL, '$2y$10$7nsuKpGyx6TrBxpg7.7H1.M3p5ShA8gDQTtahDJkypm2XaXECQnmq', 'Patricio Rey', 'client', '11 3453 5647', NULL, '2026-09-10 14:19:12', 'avatar_01'),
(9, 'yaco@mail.com', 1, NULL, NULL, '$2y$10$H7pGTLLADt7rm1XbYHJEceqwWY3Gouto3ul6tY5/QeB0nacqlZoOy', 'yaco', 'client', '221 333 4444', NULL, '2026-09-13 19:54:40', 'avatar_11');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indices de la tabla `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `case_id` (`case_id`),
  ADD KEY `idx_appointments_lawyer` (`lawyer_id`),
  ADD KEY `idx_appointments_client` (`client_id`);

--
-- Indices de la tabla `avatars`
--
ALTER TABLE `avatars`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Indices de la tabla `cases`
--
ALTER TABLE `cases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `idx_cases_estado` (`estado`);

--
-- Indices de la tabla `estudios`
--
ALTER TABLE `estudios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indices de la tabla `lawyer_profiles`
--
ALTER TABLE `lawyer_profiles`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `idx_lawyer_plan` (`plan_type`);

--
-- Indices de la tabla `lawyer_specialties`
--
ALTER TABLE `lawyer_specialties`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_specialty` (`user_id`,`especialidad`);

--
-- Indices de la tabla `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`),
  ADD KEY `case_id` (`case_id`),
  ADD KEY `idx_messages_conversation` (`sender_id`,`receiver_id`,`created_at`),
  ADD KEY `idx_messages_unread` (`receiver_id`,`read`,`created_at`);

--
-- Indices de la tabla `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_notifications_unread` (`user_id`,`read_at`,`created_at`);

--
-- Indices de la tabla `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `proposals`
--
ALTER TABLE `proposals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_proposal` (`case_id`,`lawyer_id`),
  ADD KEY `lawyer_id` (`lawyer_id`);

--
-- Indices de la tabla `push_tokens`
--
ALTER TABLE `push_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_token` (`token`(255)),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lawyer_id` (`lawyer_id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `case_id` (`case_id`),
  ADD KEY `idx_reviews_lawyer_created` (`lawyer_id`,`created_at`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `admin_logs`
--
ALTER TABLE `admin_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `avatars`
--
ALTER TABLE `avatars`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `estudios`
--
ALTER TABLE `estudios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `lawyer_specialties`
--
ALTER TABLE `lawyer_specialties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT de la tabla `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proposals`
--
ALTER TABLE `proposals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `push_tokens`
--
ALTER TABLE `push_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`lawyer_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`);

--
-- Filtros para la tabla `cases`
--
ALTER TABLE `cases`
  ADD CONSTRAINT `cases_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `estudios`
--
ALTER TABLE `estudios`
  ADD CONSTRAINT `estudios_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `lawyer_profiles`
--
ALTER TABLE `lawyer_profiles`
  ADD CONSTRAINT `lawyer_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `lawyer_specialties`
--
ALTER TABLE `lawyer_specialties`
  ADD CONSTRAINT `lawyer_specialties_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `proposals`
--
ALTER TABLE `proposals`
  ADD CONSTRAINT `proposals_ibfk_1` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `proposals_ibfk_2` FOREIGN KEY (`lawyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `push_tokens`
--
ALTER TABLE `push_tokens`
  ADD CONSTRAINT `push_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`lawyer_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE SET NULL;
COMMIT;
