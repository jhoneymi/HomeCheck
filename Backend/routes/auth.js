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
  
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('El archivo debe ser una imagen'), false);
    }
};
  
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});
  
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

// Obtener todas las viviendas del usuario autenticado (protegido)
router.get('/viviendas', authenticateToken, (req, res) => {
  const userId = req.user.userId; // Obtener el ID del usuario autenticado desde el token
  const query = 'SELECT * FROM viviendas WHERE id_adm = ?';
  connection.query(query, [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(results);
  });
});

// Agregar una nueva vivienda (protegido)
router.post('/viviendas', authenticateToken, upload.single('img'), (req, res) => {
  const { nombre, direccion, estado, id_adm, precio_alquiler, notas } = req.body;
  const img = req.file ? req.file.path : null;

  if (!nombre || !direccion || !estado || !id_adm || !img || !precio_alquiler) {
    return res.status(400).json({ error: 'Todos los campos obligatorios son requeridos (nombre, direccion, estado, img, id_adm, precio_alquiler)' });
  }

  if (parseInt(id_adm) !== req.user.userId) {
    return res.status(403).json({ error: 'No tienes permiso para usar este id_adm.' });
  }

  const query = 'INSERT INTO viviendas (nombre, direccion, estado, img, id_adm, precio_alquiler, notas) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const values = [nombre, direccion, estado, img, id_adm, precio_alquiler, notas || null];

  connection.query(query, values, (error, result) => {
    if (error) {
      console.error('Error al agregar vivienda:', error);
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ message: 'Vivienda agregada', id: result.insertId });
  });
});

// CRUD para Inquilinos

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

// CRUD para Viviendas

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
router.put('/viviendas/:id', authenticateToken, upload.single('img'), (req, res) => {
    const { id } = req.params;
    const { nombre, direccion, estado, precio_alquiler, notas } = req.body;
    const userId = req.user.userId;
  
    // Validar que se proporcione un ID válido
    if (!id) {
        console.error(id);
        return res.status(400).json({ error: 'ID de la vivienda es requerido' });
    }
  
    // Verificar si la vivienda existe y pertenece al usuario autenticado
    connection.query('SELECT * FROM viviendas WHERE id = ? AND id_adm = ?', [id, userId], (error, results) => {
      if (error) {
        console.error('Error al buscar vivienda:', error, id);
        return res.status(500).json({ error: error.message });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'Vivienda no encontrada o no tienes permiso para editarla' });
      }
  
      const vivienda = results[0];
      let updatedImg = vivienda.img;
  
      // Manejar la nueva imagen si se proporciona
      if (req.file) {
        // Eliminar la imagen antigua si existe
        if (vivienda.img) {
          const oldImagePath = path.join(__dirname, '..', vivienda.img);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        updatedImg = req.file.path;
      }
  
      // Construir los valores actualizados
      const updates = {
        nombre: nombre || vivienda.nombre,
        direccion: direccion || vivienda.direccion,
        estado: estado || vivienda.estado,
        img: updatedImg,
        precio_alquiler: precio_alquiler || vivienda.precio_alquiler,
        notas: notas || vivienda.notas
      };
  
      // Actualizar la vivienda en la base de datos
      const query = `
        UPDATE viviendas 
        SET nombre = ?, direccion = ?, estado = ?, img = ?, precio_alquiler = ?, notas = ?
        WHERE id = ? AND id_adm = ?
      `;
      const values = [
        updates.nombre,
        updates.direccion,
        updates.estado,
        updates.img,
        updates.precio_alquiler,
        updates.notas,
        id,
        userId
      ];
  
      connection.query(query, values, (error, result) => {
        if (error) {
          console.error('Error al actualizar vivienda:', error);
          return res.status(500).json({ error: error.message });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'No se pudo actualizar la vivienda' });
        }
        res.json({ message: 'Vivienda actualizada correctamente' });
      });
    });
});

// DELETE: Eliminar una vivienda
router.delete('/viviendas/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  connection.query('SELECT id_adm FROM viviendas WHERE id = ?', [id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Vivienda no encontrada' });
    }
    if (results[0].id_adm !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta vivienda.' });
    }

    const query = 'DELETE FROM viviendas WHERE id = ?';
    connection.query(query, [id], (error, result) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json({ message: 'Vivienda eliminada' });
    });
  });
});

module.exports = router;