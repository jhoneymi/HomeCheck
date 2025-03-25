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
  
      // Incluir userId en la respuesta
      res.status(200).json({ message: 'Login exitoso', token, userId: user.id });
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

//? CRUD para Inquilinos

// Obtener inquilinos
router.get('/inquilinos', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const query = `
      SELECT i.*, v.nombre AS vivienda_nombre, v.precio_alquiler
      FROM inquilinos i
      LEFT JOIN viviendas v ON i.vivienda_id = v.id
      WHERE i.admin_id = ?
    `;
    connection.query(query, [userId], (error, results) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json(results);
    });
});

// Crear un nuevo inquilino
router.post('/inquilinos', authenticateToken, (req, res) => {
    const { nombre, telefono, email, vivienda_id, fecha_ingreso, estado, metodo_pago, documento, notas, referencias, admin_id } = req.body;
    console.log('Datos recibidos para crear inquilino:', req.body);
  
    // Validar campos requeridos
    if (!nombre || !telefono || !documento || !vivienda_id || !estado || !metodo_pago || !admin_id) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
  
    // Insertar el inquilino
    const insertInquilinoQuery = 'INSERT INTO inquilinos (nombre, telefono, email, vivienda_id, fecha_ingreso, estado, metodo_pago, documento, notas, referencias, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    connection.query(insertInquilinoQuery, [nombre, telefono, email, vivienda_id, fecha_ingreso, estado, metodo_pago, documento, notas, referencias, admin_id], (error, results) => {
      if (error) {
        console.error('Error al crear inquilino:', error);
        return res.status(500).json({ error: error.message });
      }
  
      // Actualizar el estado de la vivienda a "Alquilada"
      const updateViviendaQuery = "UPDATE viviendas SET estado = 'Alquilada' WHERE id = ?";
      connection.query(updateViviendaQuery, [vivienda_id], (updateError) => {
        if (updateError) {
          console.error('Error al actualizar el estado de la vivienda:', updateError);
          return res.status(500).json({ error: 'Inquilino creado, pero no se pudo actualizar el estado de la vivienda: ' + updateError.message });
        }
  
        res.status(201).json({ message: 'Inquilino creado exitosamente y vivienda actualizada a Alquilada', id: results.insertId });
      });
    });
});

// Actualizar un inquilino
router.put('/inquilinos/:id', authenticateToken, (req, res) => {
    const inquilinoId = req.params.id;
    const { nombre, telefono, email, vivienda_id, fecha_ingreso, estado, metodo_pago, documento, notas, referencias, admin_id } = req.body;
    console.log('Datos recibidos para actualizar inquilino:', req.body);
  
    // Validar campos requeridos
    if (!nombre || !telefono || !documento || !vivienda_id || !estado || !metodo_pago || !admin_id) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
  
    // Obtener la vivienda actual del inquilino (para liberar la vivienda anterior si cambió)
    const getCurrentViviendaQuery = 'SELECT vivienda_id FROM inquilinos WHERE id = ?';
    connection.query(getCurrentViviendaQuery, [inquilinoId], (error, results) => {
      if (error) {
        console.error('Error al obtener la vivienda actual del inquilino:', error);
        return res.status(500).json({ error: error.message });
      }
  
      const previousViviendaId = results[0]?.vivienda_id;
  
      // Actualizar el inquilino
      const updateInquilinoQuery = 'UPDATE inquilinos SET nombre = ?, telefono = ?, email = ?, vivienda_id = ?, fecha_ingreso = ?, estado = ?, metodo_pago = ?, documento = ?, notas = ?, referencias = ?, admin_id = ? WHERE id = ?';
      connection.query(updateInquilinoQuery, [nombre, telefono, email, vivienda_id, fecha_ingreso, estado, metodo_pago, documento, notas, referencias, admin_id, inquilinoId], (updateError) => {
        if (updateError) {
          console.error('Error al actualizar inquilino:', updateError);
          return res.status(500).json({ error: updateError.message });
        }
  
        // Actualizar el estado de la nueva vivienda a "Alquilada"
        const updateNewViviendaQuery = "UPDATE viviendas SET estado = 'Alquilada' WHERE id = ?";
        connection.query(updateNewViviendaQuery, [vivienda_id], (updateNewError) => {
          if (updateNewError) {
            console.error('Error al actualizar el estado de la nueva vivienda:', updateNewError);
            return res.status(500).json({ error: 'Inquilino actualizado, pero no se pudo actualizar el estado de la nueva vivienda: ' + updateNewError.message });
          }
  
          // Si la vivienda cambió, liberar la vivienda anterior (cambiar su estado a "No Alquilada")
          if (previousViviendaId && previousViviendaId !== vivienda_id) {
            const updatePreviousViviendaQuery = "UPDATE viviendas SET estado = 'No Alquilada' WHERE id = ?";
            connection.query(updatePreviousViviendaQuery, [previousViviendaId], (updatePreviousError) => {
              if (updatePreviousError) {
                console.error('Error al liberar la vivienda anterior:', updatePreviousError);
                return res.status(500).json({ error: 'Inquilino y nueva vivienda actualizados, pero no se pudo liberar la vivienda anterior: ' + updatePreviousError.message });
              }
  
              res.status(200).json({ message: 'Inquilino actualizado exitosamente, vivienda actualizada a Alquilada y vivienda anterior liberada' });
            });
          } else {
            res.status(200).json({ message: 'Inquilino actualizado exitosamente, vivienda actualizada a Alquilada' });
          }
        });
      });
    });
});

// Eliminar un inquilino
router.delete('/inquilinos/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const admin_id = req.user.userId;
  
    // Obtener el inquilino para conocer la vivienda asignada
    const getInquilinoQuery = "SELECT vivienda_id FROM inquilinos WHERE id = ? AND admin_id = ?";
    connection.query(getInquilinoQuery, [id, admin_id], (error, results) => {
      if (error) return res.status(500).json({ error: error.message });
      if (results.length === 0) return res.status(404).json({ error: 'Inquilino no encontrado o no tienes permiso' });
  
      const vivienda_id = results[0].vivienda_id;
  
      // Eliminar el inquilino
      const deleteQuery = "DELETE FROM inquilinos WHERE id = ? AND admin_id = ?";
      connection.query(deleteQuery, [id, admin_id], (error, result) => {
        if (error) return res.status(500).json({ error: error.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Inquilino no encontrado' });
  
        // Si tenía una vivienda asignada, actualizar su estado a 'No Alquilada'
        if (vivienda_id) {
          const updateViviendaQuery = "UPDATE viviendas SET estado = 'No Alquilada' WHERE id = ?";
          connection.query(updateViviendaQuery, [vivienda_id], (error) => {
            if (error) return res.status(500).json({ error: error.message });
            res.json({ message: 'Inquilino eliminado' });
          });
        } else {
          res.json({ message: 'Inquilino eliminado' });
        }
      });
    });
});

// Obtener viviendas disponibles
router.get('/viviendas/disponibles', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    console.log('UserID extraído del token:', userId);
    const query = "SELECT * FROM viviendas WHERE estado = 'No Alquilada' AND id_adm = ?";
    connection.query(query, [userId], (error, results) => {
      if (error) {
        console.error('Error en la consulta:', error);
        return res.status(500).json({ error: error.message });
      }
      console.log('Viviendas disponibles encontradas:', results);
      if (results.length === 0) {
        return res.status(200).json({ message: 'No se encontraron viviendas disponibles', data: [] });
      }
      res.json({ data: results }); // Devolver un objeto con propiedad data
    });
});

//? Login Inquilino and HomePage

// Login de inquilinos
router.post('/inquilinos/login', (req, res) => {
  const { nombre, documento } = req.body;

  if (!nombre || !documento) {
    return res.status(400).json({ error: 'Por favor, ingresa tu nombre y documento' });
  }

  // Limpiar el documento eliminando guiones
  const documentoLimpio = documento.replace(/-/g, '');
  console.log('Documento recibido:', documento, 'Documento limpio:', documentoLimpio);

  // Consulta ajustada para buscar el documento limpio en la base de datos
  const sql = `SELECT * FROM inquilinos WHERE nombre = ? AND REPLACE(documento, '-', '') = ?`;
  connection.query(sql, [nombre, documentoLimpio], (error, results) => {
    if (error) {
      console.error('❌ Error en MySQL:', error.sqlMessage || error);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Inquilino no encontrado' });
    }

    const inquilino = results[0];
    const token = jwt.sign(
      { inquilinoId: inquilino.id, nombre: inquilino.nombre },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Login exitoso', token });
  });
});

//* Inquilinos Facturas

// Obtener datos del inquilino autenticado
router.get('/inquilinos/me', authenticateToken, (req, res) => {
  const inquilinoId = req.user.inquilinoId; // Obtener el ID del inquilino desde el token
  console.log('InquilinoId del token:', inquilinoId);

  const inquilinoQuery = 'SELECT * FROM inquilinos WHERE id = ?';
  connection.query(inquilinoQuery, [inquilinoId], (error, inquilinoResults) => {
    if (error) {
      console.error('❌ Error al obtener inquilino:', error);
      return res.status(500).json({ error: 'Error al obtener datos del inquilino' });
    }
    if (inquilinoResults.length === 0) {
      return res.status(404).json({ error: 'Inquilino no encontrado' });
    }

    const inquilino = inquilinoResults[0];
    const viviendaQuery = 'SELECT * FROM viviendas WHERE id = ?';
    connection.query(viviendaQuery, [inquilino.vivienda_id], (error, viviendaResults) => {
      if (error) {
        console.error('❌ Error al obtener vivienda:', error);
        return res.status(500).json({ error: 'Error al obtener datos de la vivienda' });
      }

      res.status(200).json({
        inquilino,
        vivienda: viviendaResults[0] || null
      });
    });
  });
});

// Registrar un pago (protegido para inquilinos)
router.post('/pagos', authenticateToken, (req, res) => {
  const { inquilino_id, vivienda_id, monto, metodo_pago, fecha_pago, estado } = req.body;
  const inquilinoId = req.user.inquilinoId;

  if (!inquilino_id || !vivienda_id || !monto || !metodo_pago || !fecha_pago || !estado) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  if (parseInt(inquilino_id) !== inquilinoId) {
    return res.status(403).json({ error: 'No tienes permiso para registrar un pago para otro inquilino' });
  }

  const query = 'INSERT INTO pagos (inquilino_id, vivienda_id, monto, metodo_pago, fecha_pago, estado) VALUES (?, ?, ?, ?, ?, ?)';
  connection.query(query, [inquilino_id, vivienda_id, monto, metodo_pago, fecha_pago, estado], (error, results) => {
    if (error) {
      console.error('❌ Error al registrar pago:', error);
      return res.status(500).json({ error: 'Error al registrar el pago' });
    }

    res.status(201).json({ message: 'Pago registrado exitosamente', id: results.insertId });
  });
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