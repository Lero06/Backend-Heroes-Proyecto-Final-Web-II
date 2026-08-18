-- ============================================================
-- Datos de prueba para el módulo de Reportes (Integrante 3)
-- Fecha: 18/08/2026
-- Cubre: dispositivos distintos entrada/salida, solo-SALIDA (fallback IP),
--        2 departamentos, 2 meses/años distintos, usuario normal
-- ============================================================

USE marcas_equipos;

-- ---- Departamento extra ----
INSERT INTO departamentos (nombre, descripcion, encargado) VALUES
  ('Contabilidad', 'Departamento de Contabilidad', 'Por definir')
  ON DUPLICATE KEY UPDATE nombre = nombre;

-- ---- Rol usuario (ya existe, pero guardamos el id en variable) ----
-- rol_id 1 = usuario, 2 = administrador (según init.sql)

-- ---- Usuario normal en departamento 1 (TI) ----
INSERT INTO usuarios (nombre_completo, fecha_nacimiento, correo, usuario, password_hash, departamento_id, rol_id)
VALUES (
  'Maria Garcia Jimenez',
  '1995-05-10',
  'maria.garcia@test.cr',
  'maria_garcia',
  '.aMo.DalSH9i5bv.S5Lyw8tvUrXvGJEMeeknRXXpO0sDsim',
  1,
  1
) ON DUPLICATE KEY UPDATE nombre_completo = nombre_completo;

-- ---- Usuario normal en departamento 2 (Contabilidad) ----
INSERT INTO usuarios (nombre_completo, fecha_nacimiento, correo, usuario, password_hash, departamento_id, rol_id)
VALUES (
  'Carlos Mora Salazar',
  '1990-11-22',
  'carlos.mora@test.cr',
  'carlos_mora',
  '.aMo.DalSH9i5bv.S5Lyw8tvUrXvGJEMeeknRXXpO0sDsim',
  2,
  1
) ON DUPLICATE KEY UPDATE nombre_completo = nombre_completo;

-- ---- Dispositivos para maria_garcia ----
INSERT INTO dispositivos (id, usuario_id, nombre, descripcion, estado)
SELECT 'disp-maria-laptop', u.id, 'Laptop HP', 'Laptop personal', 'ACTIVO'
FROM usuarios u WHERE u.usuario = 'maria_garcia'
ON DUPLICATE KEY UPDATE nombre = nombre;

INSERT INTO dispositivos (id, usuario_id, nombre, descripcion, estado)
SELECT 'disp-maria-movil', u.id, 'Samsung Galaxy', 'Teléfono móvil', 'ACTIVO'
FROM usuarios u WHERE u.usuario = 'maria_garcia'
ON DUPLICATE KEY UPDATE nombre = nombre;

-- ---- Dispositivo para carlos_mora ----
INSERT INTO dispositivos (id, usuario_id, nombre, descripcion, estado)
SELECT 'disp-carlos-pc', u.id, 'PC Escritorio', 'PC de oficina', 'ACTIVO'
FROM usuarios u WHERE u.usuario = 'carlos_mora'
ON DUPLICATE KEY UPDATE nombre = nombre;

-- ==============================================================
-- CASO 1: maria_garcia — ENTRADA desde Laptop, SALIDA desde Samsung
--         (verifica que dispositivo_entrada != dispositivo_salida)
--         Fecha: 2026-08-01
-- ==============================================================
INSERT INTO marcas (usuario_id, dispositivo_id, fecha, hora, tipo, ip)
SELECT u.id, 'disp-maria-laptop', '2026-08-01', '08:05:00', 'ENTRADA', '192.168.1.10'
FROM usuarios u WHERE u.usuario = 'maria_garcia';

INSERT INTO marcas (usuario_id, dispositivo_id, fecha, hora, tipo, ip)
SELECT u.id, 'disp-maria-movil', '2026-08-01', '17:30:00', 'SALIDA', '192.168.1.55'
FROM usuarios u WHERE u.usuario = 'maria_garcia';

-- ==============================================================
-- CASO 2: carlos_mora — SOLO marca de SALIDA (sin ENTRADA)
--         (verifica que ip no queda NULL gracias a COALESCE)
--         Fecha: 2026-08-01
-- ==============================================================
INSERT INTO marcas (usuario_id, dispositivo_id, fecha, hora, tipo, ip)
SELECT u.id, 'disp-carlos-pc', '2026-08-01', '17:45:00', 'SALIDA', '10.0.0.55'
FROM usuarios u WHERE u.usuario = 'carlos_mora';

-- ==============================================================
-- CASO 3: marcas en un MES/AÑO diferente (2025-12) para filtro
-- ==============================================================
INSERT INTO marcas (usuario_id, dispositivo_id, fecha, hora, tipo, ip)
SELECT u.id, 'disp-maria-laptop', '2025-12-15', '08:00:00', 'ENTRADA', '192.168.1.10'
FROM usuarios u WHERE u.usuario = 'maria_garcia';

INSERT INTO marcas (usuario_id, dispositivo_id, fecha, hora, tipo, ip)
SELECT u.id, 'disp-maria-laptop', '2025-12-15', '17:00:00', 'SALIDA', '192.168.1.10'
FROM usuarios u WHERE u.usuario = 'maria_garcia';

-- ==============================================================
-- CASO 4: maria_garcia — otro dia en agosto 2026 (dia=15)
-- ==============================================================
INSERT INTO marcas (usuario_id, dispositivo_id, fecha, hora, tipo, ip)
SELECT u.id, 'disp-maria-laptop', '2026-08-15', '09:00:00', 'ENTRADA', '192.168.1.10'
FROM usuarios u WHERE u.usuario = 'maria_garcia';

INSERT INTO marcas (usuario_id, dispositivo_id, fecha, hora, tipo, ip)
SELECT u.id, 'disp-maria-movil', '2026-08-15', '18:00:00', 'SALIDA', '192.168.1.55'
FROM usuarios u WHERE u.usuario = 'maria_garcia';

SELECT 'Datos de prueba insertados correctamente' AS resultado;