// Formato estándar de respuesta que debe usar TODO el equipo:
// { ok: boolean, data: any, message: string }

function ok(res, data = null, message = 'OK', status = 200) {
  return res.status(status).json({ ok: true, data, message });
}

function error(res, message = 'Error', status = 400, data = null) {
  return res.status(status).json({ ok: false, data, message });
}

module.exports = { ok, error };
