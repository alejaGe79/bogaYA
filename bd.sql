-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 09-09-2026 a las 09:14:59
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
(1, 4, 2, NULL, '2026-09-11 12:30:00', 60, 'virtual', '', 'confirmada', 'es muy urgente', ' | Solicitud de cambio de fecha: 2026-09-11T12:30 - Motivo: puede ser un poquito mas tarde?', '2026-09-08 19:39:45');

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
('45348983-418d-4997-ac49-89f658f224a7', 5, 'Abogado del niño', 'Me quiero divorciar de mis padres', 'Familia', 'Buenos Aires', 30, NULL, 'abierto', '2026-09-09 09:03:41'),
('75386b75-92e1-49ee-8649-2ac607647d7f', 4, 'Me despidieron sin causa', 'Sol aleja me despidieron sin causa', 'Laboral', 'Buenos Aires', 30, NULL, 'abierto', '2026-09-08 19:39:07');

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
(2, '', '', '', '', 0.00, 1, 0, NULL, NULL, 'comun', NULL, 0, 1, NULL),
(3, '', '', '', '', 0.00, 1, 0, NULL, NULL, 'comun', NULL, 0, 1, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `lawyer_specialties`
--

CREATE TABLE `lawyer_specialties` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `especialidad` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(5, 4, 'appointment_confirmed', '✅ Turno confirmado', 'Tu turno fue confirmado por el abogado.', '/agenda', '2026-09-08 21:48:30', '2026-09-08 21:47:46');

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
(1, '75386b75-92e1-49ee-8649-2ac607647d7f', 2, 50000.00, 'Yo quiero', 'pendiente', '2026-09-08 21:33:19');

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
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `email`, `email_verified`, `verification_token`, `verification_expires`, `password_hash`, `name`, `role`, `phone`, `foto`, `created_at`) VALUES
(1, 'admin@bogaya.com', 1, 'a35480a13e816706afe94107fe0e18bedba0ace8e814760812addbedc4657bee', NULL, '$2y$10$V/EGJ4esp9Sbv0s.nKXkg./XZVIccwtqsbDUIVRU6b8PgWJlOGRuu', 'Administrador', 'admin', NULL, NULL, '2026-09-08 13:02:53'),
(2, 'msolbucci@gmail.com', 1, 'a35480a13e816706afe94107fe0e18bedba0ace8e814760812addbedc4657bee', '2026-09-09 13:16:59', '$2y$10$V/EGJ4esp9Sbv0s.nKXkg./XZVIccwtqsbDUIVRU6b8PgWJlOGRuu', 'Maria Sol', 'lawyer', '221 637 2123', NULL, '2026-09-08 13:16:59'),
(3, 'pomelc@gmail.com', 1, 'c23b97f70a2152eb70f5e316d4bd960b35f5cdb3e2aef414c8fcd86dc1754b94', '2026-09-09 13:17:31', '$2y$10$V/EGJ4esp9Sbv0s.nKXkg./XZVIccwtqsbDUIVRU6b8PgWJlOGRuu', 'Patricio Melconi', 'lawyer', '221 456 4534', NULL, '2026-09-08 13:17:31'),
(4, 'aleja.geier@gmail.com', 1, 'ac45d064304401b3160ae67e0b646fab3421c8cb5fe3217a67d67c55e2653f7b', '2026-09-09 13:18:29', '$2y$10$V/EGJ4esp9Sbv0s.nKXkg./XZVIccwtqsbDUIVRU6b8PgWJlOGRuu', 'Aleja Geier', 'client', '221 6372123', NULL, '2026-09-08 13:18:29'),
(5, 'rio@mail.com', 1, 'c50cfd59eb6c2b8e692356ef2aa1cc5dfa76762ec59dbce0ab01b285f9f21609', '2026-09-10 08:36:29', '$2y$10$5PEsLEqknJ6qntwIDZopp.4UyqZ/tKL8XfD5Ud3YLWjcKMhFaCAze', 'Rio', 'client', '2213456789', NULL, '2026-09-09 08:36:29');

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
  ADD KEY `case_id` (`case_id`);

--
-- Indices de la tabla `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

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
  ADD KEY `case_id` (`case_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `estudios`
--
ALTER TABLE `estudios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `lawyer_specialties`
--
ALTER TABLE `lawyer_specialties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proposals`
--
ALTER TABLE `proposals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `push_tokens`
--
ALTER TABLE `push_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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