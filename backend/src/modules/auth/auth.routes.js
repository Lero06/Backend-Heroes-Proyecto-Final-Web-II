const express = require('express');
const router = express.Router();

const validar = require('../../middlewares/validate.middleware');
const { esquemaRegistro, esquemaLogin } = require('./auth.validations');
const { registrar, login } = require('./auth.controller');

router.post('/registro', validar(esquemaRegistro), registrar);
router.post('/login', validar(esquemaLogin), login);

// Proximos commits: /logout, /recuperar-password, /restablecer-password

module.exports = router;
