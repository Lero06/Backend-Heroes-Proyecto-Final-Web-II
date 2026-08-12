const express = require('express');
const router = express.Router();

const validar = require('../../middlewares/validate.middleware');
const { esquemaRegistro } = require('./auth.validations');
const { registrar } = require('./auth.controller');

router.post('/registro', validar(esquemaRegistro), registrar);

// Proximos commits: /login, /logout, /recuperar-password, /restablecer-password

module.exports = router;
