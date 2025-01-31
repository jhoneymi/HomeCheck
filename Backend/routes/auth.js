const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Asegúrate de tener jwt importado
const connection = require('../db');

const router = express.Router();

// Definir la clave secreta directamente en el código
const JWT_SECRET = 'home'; // Usa una clave secreta segura

// Registro de usuario
router.post('/register', (req, res) => {
    const { nombre_completo, direccion, email, numero_cedula, tipo_domicilio, password, telefono } = req.body;

    if (!nombre_completo || !direccion || !email || !numero_cedula || !tipo_domicilio || !password || !telefono) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const sql = `INSERT INTO usuarios (nombre_completo, direccion, email, numero_cedula, tipo_domicilio, password, telefono) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const values = [nombre_completo, direccion, email, numero_cedula, tipo_domicilio, hashedPassword, telefono];

    connection.query(sql, values, (error, results) => {
        if (error) {
            console.error('❌ Error en MySQL:', error.sqlMessage || error);
            return res.status(500).json({ error: 'Error en MySQL', details: error.sqlMessage || error });
        }
        res.status(201).json({ message: 'Usuario registrado correctamente' });
    });
});

// Login de usuario
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Por favor, ingresa tu email y contraseña' });
    }

    const sql = `SELECT * FROM usuarios WHERE email = ?`;
    connection.query(sql, [email], (error, results) => {
        if (error) {
            console.error('❌ Error en MySQL:', error.sqlMessage || error);
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const user = results[0];

        // Comparar la contraseña ingresada con la almacenada
        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Crear un token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email }, // Payload
            JWT_SECRET, // Clave secreta
            { expiresIn: '1h' } // Expiración de 1 hora
        );

        res.status(200).json({ message: 'Login exitoso', token });
    });
});

module.exports = router;