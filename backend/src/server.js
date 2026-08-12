const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 4000;

async function iniciar() {
  try {
    await pool.query('SELECT 1');
    console.log('Conexión a MySQL exitosa');
  } catch (err) {
    console.error('No se pudo conectar a MySQL:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}

iniciar();
