-- ============================================================
-- Sistema de Marcas y Préstamo de Equipos
-- Script de inicialización (se ejecuta automáticamente al
-- crear el contenedor de MySQL por primera vez)
-- ============================================================

CREATE DATABASE IF NOT EXISTS marcas_equipos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE marcas_equipos;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. Roles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. Departamentos / carreras
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departamentos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  descripcion   VARCHAR(255),
  encargado     VARCHAR(100),
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. Usuarios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  nombre_completo   VARCHAR(150) NOT NULL,
  fecha_nacimiento  DATE NOT NULL,
  correo            VARCHAR(150) NOT NULL UNIQUE,
  usuario           VARCHAR(50) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  departamento_id   INT,
  rol_id            INT NOT NULL,
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  creado_en         DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_departamento
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_usuarios_rol
    FOREIGN KEY (rol_id) REFERENCES roles(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_usuarios_correo (correo),
  INDEX idx_usuarios_usuario (usuario)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. Sesiones
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sesiones (
  id            VARCHAR(64) PRIMARY KEY,          -- id de sesión (uuid/token)
  usuario_id    INT NOT NULL,
  ip            VARCHAR(45),
  user_agent    VARCHAR(255),
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP,
  expira_en     DATETIME NOT NULL,
  CONSTRAINT fk_sesiones_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_sesiones_usuario (usuario_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. Tokens de recuperación de contraseña
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tokens_recuperacion (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id    INT NOT NULL,
  token         VARCHAR(128) NOT NULL UNIQUE,
  usado         TINYINT(1) NOT NULL DEFAULT 0,
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP,
  expira_en     DATETIME NOT NULL,
  CONSTRAINT fk_tokens_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_tokens_token (token)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 6. Dispositivos autorizados
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dispositivos (
  id                VARCHAR(64) PRIMARY KEY,      -- identificador único generado (uuid)
  usuario_id        INT NOT NULL,
  nombre            VARCHAR(100) NOT NULL,
  descripcion       VARCHAR(255),
  estado            ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  fecha_registro    DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dispositivos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_dispositivos_usuario (usuario_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 7. Marcas (entrada/salida)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marcas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id    INT NOT NULL,
  dispositivo_id VARCHAR(64),
  fecha         DATE NOT NULL,
  hora          TIME NOT NULL,
  tipo          ENUM('ENTRADA','SALIDA') NOT NULL,
  ip            VARCHAR(45) NOT NULL,
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_marcas_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_marcas_dispositivo
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_marcas_usuario_fecha (usuario_id, fecha)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 8. Equipos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  codigo        VARCHAR(50) NOT NULL UNIQUE,
  descripcion   VARCHAR(255) NOT NULL,
  imagen        VARCHAR(255),
  estado        ENUM('DISPONIBLE','PRESTADO','MANTENIMIENTO','INACTIVO') NOT NULL DEFAULT 'DISPONIBLE',
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 9. Préstamos (encabezado)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prestamos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id    INT NOT NULL,          -- a quien se le presta
  encargado_id  INT NOT NULL,          -- quien registra el préstamo
  fecha         DATETIME DEFAULT CURRENT_TIMESTAMP,
  estado        ENUM('ACTIVO','FINALIZADO') NOT NULL DEFAULT 'ACTIVO',
  CONSTRAINT fk_prestamos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_prestamos_encargado
    FOREIGN KEY (encargado_id) REFERENCES usuarios(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_prestamos_usuario (usuario_id),
  INDEX idx_prestamos_estado (estado)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 10. Detalle de préstamo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prestamo_detalle (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  prestamo_id         INT NOT NULL,
  equipo_id           INT NOT NULL,
  estado_devolucion   ENUM('PENDIENTE','DEVUELTO') NOT NULL DEFAULT 'PENDIENTE',
  fecha_devolucion    DATETIME NULL,
  CONSTRAINT fk_detalle_prestamo
    FOREIGN KEY (prestamo_id) REFERENCES prestamos(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_detalle_equipo
    FOREIGN KEY (equipo_id) REFERENCES equipos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE KEY uq_prestamo_equipo (prestamo_id, equipo_id),
  INDEX idx_detalle_prestamo (prestamo_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 11. Configuración del sistema
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracion (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  clave         VARCHAR(100) NOT NULL UNIQUE,
  valor         VARCHAR(255) NOT NULL,
  descripcion   VARCHAR(255)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Datos iniciales
-- ============================================================

INSERT INTO roles (nombre) VALUES
  ('usuario'),
  ('administrador');

INSERT INTO departamentos (nombre, descripcion, encargado) VALUES
  ('Tecnologías de Información', 'Departamento de Ingeniería en TI', 'Por definir');

-- Usuario administrador inicial
-- usuario: admin  |  contraseña: Admin123!  (cámbienla después del primer login)
INSERT INTO usuarios (nombre_completo, fecha_nacimiento, correo, usuario, password_hash, departamento_id, rol_id)
VALUES (
  'Administrador del Sistema',
  '2000-01-01',
  'admin@utn.ac.cr',
  'admin',
  '$2b$10$2h7aCM.aMo.DalSH9i5bv.S5Lyw8tvUrXvGJEMeeknRXXpO0sDsim',
  1,
  (SELECT id FROM roles WHERE nombre = 'administrador')
);

INSERT INTO configuracion (clave, valor, descripcion) VALUES
  ('nombre_institucion', 'Universidad Técnica Nacional', 'Nombre mostrado en el sistema'),
  ('rango_ip_permitido', '0.0.0.0/0', 'Rango de IP permitido para registrar marcas'),
  ('tiempo_max_sesion_min', '120', 'Duración máxima de una sesión en minutos'),
  ('tamano_max_archivo_mb', '5', 'Tamaño máximo permitido para imágenes de equipos (MB)');
