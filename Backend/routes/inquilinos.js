const express = require('express');
const router = express.Router();
const connection = require('../db');

// Obtener todos los inquilinos
router.get('/inquilinos', (req, res) => {
    connection.query('SELECT * FROM inquilinos', (error, results) => {
        if (error) {
            res.status(500).json({ error: error.message });
        } else {
            res.json(results);
        }
    });
});

// Crear un nuevo inquilino
router.post('/inquilinos', (req, res) => {
    const { nombre, telefono, email, vivienda_id, metodo_pago } = req.body;
    connection.query(
        'INSERT INTO inquilinos (nombre, telefono, email, vivienda_id, metodo_pago) VALUES (?, ?, ?, ?, ?)',
        [nombre, telefono, email, vivienda_id, metodo_pago],
        (error, result) => {
            if (error) {
                res.status(500).json({ error: error.message });
            } else {
                res.json({ message: 'Inquilino agregado', id: result.insertId });
            }
        }
    );
});

module.exports = router;