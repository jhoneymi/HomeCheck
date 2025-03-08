const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const connection = require('../db');

const router = express.Router();

const JWT_SECRET = 'home';

// Configuración de multer para guardar imágenes
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Filtrar solo imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('El archivo debe ser una imagen'), false);
  }
};

// Configurar multer con almacenamiento, filtro y límites
const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB
});

// Middleware para verificar el token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido.' });
  }
};

// Registro de usuario
router.post('/register', (req, res) => {
  const { nombre_completo, direccion, email, numero_cedula, tipo_domicilio, password, telefono, role_id } = req.body;

  if (!nombre_completo || !direccion || !email || !numero_cedula || !tipo_domicilio || !password || !telefono) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = `INSERT INTO usuarios (nombre_completo, direccion, email, numero_cedula, tipo_domicilio, password, telefono, role_id) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 2)`;

  const values = [nombre_completo, direccion, email, numero_cedula, tipo_domicilio, hashedPassword, telefono, role_id];

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

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Login exitoso', token });
  });
});

// Obtener todas las viviendas (protegido)
router.get('/viviendas', authenticateToken, (req, res) => {
  const query = 'SELECT * FROM viviendas';
  connection.query(query, (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(results);
  });
});

// Agregar una nueva vivienda (protegido)
router.post('/viviendas', authenticateToken, upload.single('img'), (req, res) => {
  const { nombre, direccion, estado, id_adm } = req.body;
  const img = req.file ? req.file.path : null;

  if (!nombre || !direccion || !estado || !id_adm || !img) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  // Validar que el id_adm coincida con el userId del token
  if (parseInt(id_adm) !== req.user.userId) {
    return res.status(403).json({ error: 'No tienes permiso para usar este id_adm.' });
  }

  const query = 'INSERT INTO viviendas (nombre, direccion, estado, img, id_adm) VALUES (?, ?, ?, ?, ?)';
  const values = [nombre, direccion, estado, img, id_adm];

  connection.query(query, values, (error, result) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ message: 'Vivienda agregada', id: result.insertId });
  });
});

//? CRUD para Inquilinos

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

// Actualizar un inquilino
router.put('/inquilinos/:id', (req, res) => {
    const { nombre, telefono, email, vivienda_id, metodo_pago } = req.body;
    const { id } = req.params;
    
    connection.query(
        'UPDATE inquilinos SET nombre = ?, telefono = ?, email = ?, vivienda_id = ?, metodo_pago = ? WHERE id = ?',
        [nombre, telefono, email, vivienda_id, metodo_pago, id],
        (error, result) => {
            if (error) {
                res.status(500).json({ error: error.message });
            } else if (result.affectedRows === 0) {
                res.status(404).json({ message: 'Inquilino no encontrado' });
            } else {
                res.json({ message: 'Inquilino actualizado' });
            }
        }
    );
});

// Eliminar un inquilino
router.delete('/inquilinos/:id', (req, res) => {
    const { id } = req.params;

    connection.query(
        'DELETE FROM inquilinos WHERE id = ?',
        [id],
        (error, result) => {
            if (error) {
                res.status(500).json({ error: error.message });
            } else if (result.affectedRows === 0) {
                res.status(404).json({ message: 'Inquilino no encontrado' });
            } else {
                res.json({ message: 'Inquilino eliminado' });
            }
        }
    );
});

//! CRUD para Viviendas

// READ: Obtener una vivienda por ID
router.get('/viviendas/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM viviendas WHERE id = ?';
    connection.query(query, [id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Vivienda no encontrada' });
        }
        res.json(results[0]);
    });
});

// UPDATE: Actualizar una vivienda
router.put('/viviendas/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, direccion, estado, img, id_adm } = req.body;

    if (!nombre || !direccion || !estado || !img || !id_adm) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const query = 'UPDATE viviendas SET nombre = ?, direccion = ?, estado = ?, img = ?, id_adm = ? WHERE id = ?';
    const values = [nombre, direccion, estado, img, id_adm, id];

    connection.query(query, values, (error, result) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Vivienda no encontrada' });
        }
        res.json({ message: 'Vivienda actualizada' });
    });
});

// DELETE: Eliminar una vivienda
router.delete('/viviendas/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM viviendas WHERE id = ?';
    connection.query(query, [id], (error, result) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Vivienda no encontrada' });
        }
        res.json({ message: 'Vivienda eliminada' });
    });
});

module.exports = router;