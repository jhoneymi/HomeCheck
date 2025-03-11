-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 11-03-2025 a las 05:09:02
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `homecheck`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `facturas`
--

CREATE TABLE `facturas` (
  `id` int(11) NOT NULL,
  `inquilino_id` int(11) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha_emision` date NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `estado` enum('Pagada','Pendiente') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ganancias`
--

CREATE TABLE `ganancias` (
  `id` int(11) NOT NULL,
  `vivienda_id` int(11) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha_ganancia` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gastos`
--

CREATE TABLE `gastos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha_gasto` date NOT NULL,
  `tipo` enum('Mantenimiento','Servicios','Otros') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inquilinos`
--

CREATE TABLE `inquilinos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `vivienda_id` int(11) DEFAULT NULL,
  `fecha_ingreso` date NOT NULL,
  `fecha_salida` date DEFAULT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL,
  `metodo_pago` enum('Efectivo','Tarjeta','Otro') NOT NULL,
  `documento` varchar(20) NOT NULL,
  `notas` text DEFAULT NULL,
  `ultimo_pago_fecha` datetime DEFAULT NULL,
  `ultimo_pago_estado` enum('Pagado','Pendiente','Atrasado') DEFAULT NULL,
  `monto_pendiente` decimal(10,2) DEFAULT NULL,
  `admin_id` int(11) NOT NULL,
  `referencias` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `inquilinos`
--

INSERT INTO `inquilinos` (`id`, `nombre`, `telefono`, `email`, `vivienda_id`, `fecha_ingreso`, `fecha_salida`, `estado`, `metodo_pago`, `documento`, `notas`, `ultimo_pago_fecha`, `ultimo_pago_estado`, `monto_pendiente`, `admin_id`, `referencias`) VALUES
(1, 'natanael', '8092826465', 'natanael@gmail.com', 10, '2025-03-10', NULL, 'Activo', 'Efectivo', '402-1231123-0', 'nose', NULL, NULL, NULL, 1, 'Rijo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id` int(11) NOT NULL,
  `inquilino_id` int(11) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha_pago` date NOT NULL,
  `metodo_pago` enum('Efectivo','Tarjeta') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `transacciones`
--

CREATE TABLE `transacciones` (
  `id` int(11) NOT NULL,
  `tipo` enum('Ingreso','Egreso') NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha_transaccion` date NOT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre_completo` varchar(100) NOT NULL,
  `direccion` text NOT NULL,
  `email` varchar(100) NOT NULL,
  `numero_cedula` varchar(20) NOT NULL,
  `tipo_domicilio` enum('Casa','Departamento','Residencia') NOT NULL,
  `password` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `role_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre_completo`, `direccion`, `email`, `numero_cedula`, `tipo_domicilio`, `password`, `telefono`, `fecha_registro`, `role_id`) VALUES
(1, 'Jhoneymi Batista Mena', 'Villa Maria C.4 Sur', 'jhoneymimena@gmail.com', '4024676964', 'Departamento', '$2a$10$ktpMvvFAmrGtnKI//FF7ceSFiBTpZAQf.12coH3lJxbn.eMEIMbsW', '8293361234', '2025-01-31 04:45:34', 1),
(2, 'Rigoberto Peres', 'Calle 4 Sur', 'slimerbatista27@gmail.com', '12345678910', 'Departamento', '$2a$10$EdQbBuzieI0znnIJdb/Yr.yAxEgtDvOqM8xVkUYQvXtfq62bplz86', '8095362206', '2025-03-08 17:00:45', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `viviendas`
--

CREATE TABLE `viviendas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `direccion` varchar(255) NOT NULL,
  `estado` enum('Alquilada','No Alquilada','En Remodelacion') NOT NULL,
  `img` varchar(255) NOT NULL,
  `precio_alquiler` decimal(10,2) NOT NULL,
  `notas` varchar(255) DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `id_adm` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `viviendas`
--

INSERT INTO `viviendas` (`id`, `nombre`, `direccion`, `estado`, `img`, `precio_alquiler`, `notas`, `fecha_registro`, `id_adm`) VALUES
(3, 'Casa blanca', 'Barrio 27 de febrero', 'No Alquilada', 'uploads\\1741453307781-images (1).jpeg', 0.00, '', '2025-03-08 17:01:47', 2),
(9, 'Casita en la playa', 'Calle 4 sur', 'No Alquilada', 'uploads\\1741541278412-images (1).jpeg', 2000.00, 'hola', '2025-03-09 17:27:58', 1),
(10, 'Invivienda Almirante', 'Mazana 4694 Ed.7', 'Alquilada', 'uploads\\1741608914766-images (1).jpeg', 20000.00, 'Es un departamento, con sala cocinas 3 habitaciones y un baño', '2025-03-10 12:15:14', 1),
(11, 'Pedriot', '113231123', 'No Alquilada', 'uploads\\1741658496753-tipos-de-cocina_opt-1280x720.jpg', 800000.00, NULL, '2025-03-11 02:01:36', 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inquilino_id` (`inquilino_id`);

--
-- Indices de la tabla `ganancias`
--
ALTER TABLE `ganancias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vivienda_id` (`vivienda_id`);

--
-- Indices de la tabla `gastos`
--
ALTER TABLE `gastos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `inquilinos`
--
ALTER TABLE `inquilinos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vivienda_id` (`vivienda_id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inquilino_id` (`inquilino_id`);

--
-- Indices de la tabla `transacciones`
--
ALTER TABLE `transacciones`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `numero_cedula` (`numero_cedula`);

--
-- Indices de la tabla `viviendas`
--
ALTER TABLE `viviendas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_adm` (`id_adm`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `facturas`
--
ALTER TABLE `facturas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ganancias`
--
ALTER TABLE `ganancias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `gastos`
--
ALTER TABLE `gastos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `inquilinos`
--
ALTER TABLE `inquilinos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `transacciones`
--
ALTER TABLE `transacciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `viviendas`
--
ALTER TABLE `viviendas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD CONSTRAINT `facturas_ibfk_1` FOREIGN KEY (`inquilino_id`) REFERENCES `inquilinos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `ganancias`
--
ALTER TABLE `ganancias`
  ADD CONSTRAINT `ganancias_ibfk_1` FOREIGN KEY (`vivienda_id`) REFERENCES `viviendas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `inquilinos`
--
ALTER TABLE `inquilinos`
  ADD CONSTRAINT `inquilinos_ibfk_1` FOREIGN KEY (`vivienda_id`) REFERENCES `viviendas` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `inquilinos_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`inquilino_id`) REFERENCES `inquilinos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `viviendas`
--
ALTER TABLE `viviendas`
  ADD CONSTRAINT `viviendas_ibfk_1` FOREIGN KEY (`id_adm`) REFERENCES `usuarios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
