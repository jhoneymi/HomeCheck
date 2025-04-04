// auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const connection = require('../db');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const JWT_SECRET = 'home';

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
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
  limits: { fileSize: 5 * 1024 * 1024 },
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
      { userId: user.id, email: user.email, role: user.role_id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Login exitoso', token, userId: user.id, role: user.role_id });
  });
});

// Obtener todas las viviendas del usuario autenticado (protegido)
router.get('/viviendas', authenticateToken, (req, res) => {
  const userId = req.user.userId;
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

// Obtener un inquilino por ID (nuevo endpoint para inquilino-profile)
router.get('/inquilinos/:id', authenticateToken, (req, res) => {
  const inquilinoId = req.params.id;
  const userId = req.user.userId;

  const query = `
    SELECT i.*, v.nombre AS vivienda_nombre, v.precio_alquiler
    FROM inquilinos i
    LEFT JOIN viviendas v ON i.vivienda_id = v.id
    WHERE i.id = ? AND i.admin_id = ?
  `;
  connection.query(query, [inquilinoId, userId], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Inquilino no encontrado o no tienes permiso' });
    }
    res.json(results[0]);
  });
});

// Crear un nuevo inquilino
router.post('/inquilinos', authenticateToken, (req, res) => {
  const { nombre, telefono, email, vivienda_id, fecha_ingreso, estado, metodo_pago, documento, notas, referencias, admin_id } = req.body;

  if (!nombre || !telefono || !documento || !vivienda_id || !estado || !metodo_pago || !admin_id) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const insertInquilinoQuery = 'INSERT INTO inquilinos (nombre, telefono, email, vivienda_id, fecha_ingreso, estado, metodo_pago, documento, notas, referencias, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  connection.query(insertInquilinoQuery, [nombre, telefono, email, vivienda_id, fecha_ingreso, estado, metodo_pago, documento, notas, referencias, admin_id], (error, results) => {
    if (error) {
      console.error('Error al crear inquilino:', error);
      return res.status(500).json({ error: error.message });
    }

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

  if (!nombre || !telefono || !documento || !vivienda_id || !estado || !metodo_pago || !admin_id) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const getCurrentViviendaQuery = 'SELECT vivienda_id FROM inquilinos WHERE id = ?';
  connection.query(getCurrentViviendaQuery, [inquilinoId], (error, results) => {
    if (error) {
      console.error('Error al obtener la vivienda actual del inquilino:', error);
      return res.status(500).json({ error: error.message });
    }

    const previousViviendaId = results[0]?.vivienda_id;

    const updateInquilinoQuery = 'UPDATE inquilinos SET nombre = ?, telefono = ?, email = ?, vivienda_id = ?, fecha_ingreso = ?, estado = ?, metodo_pago = ?, documento = ?, notas = ?, referencias = ?, admin_id = ? WHERE id = ?';
    connection.query(updateInquilinoQuery, [nombre, telefono, email, vivienda_id, fecha_ingreso, estado, metodo_pago, documento, notas, referencias, admin_id, inquilinoId], (updateError) => {
      if (updateError) {
        console.error('Error al actualizar inquilino:', updateError);
        return res.status(500).json({ error: updateError.message });
      }

      const updateNewViviendaQuery = "UPDATE viviendas SET estado = 'Alquilada' WHERE id = ?";
      connection.query(updateNewViviendaQuery, [vivienda_id], (updateNewError) => {
        if (updateNewError) {
          console.error('Error al actualizar el estado de la nueva vivienda:', updateNewError);
          return res.status(500).json({ error: 'Inquilino actualizado, pero no se pudo actualizar el estado de la nueva vivienda: ' + updateNewError.message });
        }

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

  const getInquilinoQuery = "SELECT vivienda_id FROM inquilinos WHERE id = ? AND admin_id = ?";
  connection.query(getInquilinoQuery, [id, admin_id], (error, results) => {
    if (error) return res.status(500).json({ error: error.message });
    if (results.length === 0) return res.status(404).json({ error: 'Inquilino no encontrado o no tienes permiso' });

    const vivienda_id = results[0].vivienda_id;

    const deleteQuery = "DELETE FROM inquilinos WHERE id = ? AND admin_id = ?";
    connection.query(deleteQuery, [id, admin_id], (error, result) => {
      if (error) return res.status(500).json({ error: error.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Inquilino no encontrado' });

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
  const query = "SELECT * FROM viviendas WHERE estado = 'No Alquilada' AND id_adm = ?";
  connection.query(query, [userId], (error, results) => {
    if (error) {
      console.error('Error en la consulta:', error);
      return res.status(500).json({ error: error.message });
    }
    if (results.length === 0) {
      return res.status(200).json({ message: 'No se encontraron viviendas disponibles', data: [] });
    }
    res.json({ data: results });
  });
});

// Login de inquilinos
router.post('/inquilinos/login', (req, res) => {
  const { nombre, documento } = req.body;

  if (!nombre || !documento) {
    return res.status(400).json({ error: 'Por favor, ingresa tu nombre y documento' });
  }

  const documentoLimpio = documento.replace(/-/g, '');

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

// Obtener datos del inquilino autenticado
router.get('/inquilinos/me', authenticateToken, (req, res) => {
  console.log('Solicitud recibida en GET /inquilinos/me');
  console.log('Token decodificado:', req.user);

  const inquilinoId = req.user.inquilinoId;

  if (!inquilinoId) {
    console.error('ID del inquilino no encontrado en el token:', req.user);
    return res.status(400).json({ error: 'ID del inquilino no encontrado en el token' });
  }

  const inquilinoQuery = 'SELECT * FROM inquilinos WHERE id = ?';
  connection.query(inquilinoQuery, [inquilinoId], (error, inquilinoResults) => {
    if (error) {
      console.error('❌ Error al obtener inquilino:', error);
      return res.status(500).json({ error: 'Error al obtener datos del inquilino', details: error.message });
    }

    if (inquilinoResults.length === 0) {
      console.log(`Inquilino con ID ${inquilinoId} no encontrado`);
      return res.status(404).json({ error: 'Inquilino no encontrado' });
    }

    const inquilino = inquilinoResults[0];

    if (!inquilino.vivienda_id) {
      return res.status(200).json({
        inquilino: {
          id: inquilino.id,
          nombre: inquilino.nombre,
          apellido: inquilino.apellido,
          email: inquilino.email,
          telefono: inquilino.telefono,
          vivienda_id: inquilino.vivienda_id,
          metodo_pago: inquilino.metodo_pago,
          ultimo_pago_fecha: inquilino.ultimo_pago_fecha,
          admin_id: inquilino.admin_id
        },
        vivienda: null
      });
    }

    const viviendaQuery = 'SELECT * FROM viviendas WHERE id = ?';
    connection.query(viviendaQuery, [inquilino.vivienda_id], (error, viviendaResults) => {
      if (error) {
        console.error('❌ Error al obtener vivienda:', error);
        return res.status(500).json({ error: 'Error al obtener datos de la vivienda', details: error.message });
      }

      res.status(200).json({
        inquilino: {
          id: inquilino.id,
          nombre: inquilino.nombre,
          apellido: inquilino.apellido,
          email: inquilino.email,
          telefono: inquilino.telefono,
          vivienda_id: inquilino.vivienda_id,
          metodo_pago: inquilino.metodo_pago,
          ultimo_pago_fecha: inquilino.ultimo_pago_fecha,
          admin_id: inquilino.admin_id
        },
        vivienda: viviendaResults[0] || null,
      });
    });
  });
});

// Registrar un pago por el administrador (protegido para admins)
router.post('/pagos/admin', authenticateToken, (req, res) => {
  const { inquilino_id, vivienda_id, monto, fecha_pago, metodo_pago, estado } = req.body;
  const userId = req.user.userId;
  const userRole = req.user.role;

  if (!inquilino_id || !vivienda_id || !monto || !fecha_pago || !metodo_pago || !estado) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  // Verificar permisos: el usuario debe ser admin o el propietario de la vivienda
  const sqlCheckPermission = `
    SELECT v.id
    FROM viviendas v
    WHERE v.id = ? AND (v.id_adm = ? OR ? = 1)
  `;
  connection.query(sqlCheckPermission, [vivienda_id, userId, userRole], (error, results) => {
    if (error) {
      console.error('Error al verificar permisos:', error);
      return res.status(500).json({ error: 'Error al verificar permisos', details: error.message });
    }
    if (results.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para registrar un pago para esta vivienda' });
    }

    // Registrar el pago
    const sqlInsertPago = `
      INSERT INTO pagos (inquilino_id, vivienda_id, monto, fecha_pago, metodo_pago, estado)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    connection.query(
      sqlInsertPago,
      [inquilino_id, vivienda_id, monto, fecha_pago, metodo_pago, estado],
      (error, results) => {
        if (error) {
          console.error('Error al registrar el pago:', error);
          return res.status(500).json({ error: 'Error al registrar el pago', details: error.message });
        }
        res.status(201).json({ message: 'Pago registrado correctamente' });
      }
    );
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

  const checkInquilinoQuery = 'SELECT metodo_pago FROM inquilinos WHERE id = ?';
  connection.query(checkInquilinoQuery, [inquilino_id], (error, results) => {
    if (error) {
      console.error('❌ Error al verificar inquilino:', error);
      return res.status(500).json({ error: 'Error al verificar inquilino' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Inquilino no encontrado' });
    }

    const inquilinoMetodoPago = results[0].metodo_pago;
    if (metodo_pago === 'Efectivo' && inquilinoMetodoPago === 'Efectivo') {
      return res.status(403).json({ error: 'El pago en efectivo debe ser registrado por el administrador.' });
    }
    if (metodo_pago === 'Tarjeta/Transferencia' && inquilinoMetodoPago !== 'Tarjeta/Transferencia') {
      return res.status(403).json({ error: 'Tu método de pago registrado no permite pagos por tarjeta o transferencia.' });
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
});

// Obtener pagos de un inquilino
router.get('/pagos/inquilino/:id', authenticateToken, (req, res) => {
  const inquilinoId = req.params.id;
  const userId = req.user.userId;

  const checkInquilinoQuery = 'SELECT * FROM inquilinos WHERE id = ? AND admin_id = ?';
  connection.query(checkInquilinoQuery, [inquilinoId, userId], (error, inquilinoResults) => {
    if (error) {
      console.error('❌ Error al verificar inquilino:', error);
      return res.status(500).json({ error: 'Error al verificar inquilino' });
    }
    if (inquilinoResults.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para ver los pagos de este inquilino.' });
    }

    const query = 'SELECT * FROM pagos WHERE inquilino_id = ?';
    connection.query(query, [inquilinoId], (error, results) => {
      if (error) {
        console.error('❌ Error al obtener pagos:', error);
        return res.status(500).json({ error: 'Error al obtener los pagos' });
      }
      res.status(200).json(results);
    });
  });
});

// Mensajes

// Enviar un mensaje
router.post('/mensajes', authenticateToken, (req, res) => {
  const { inquilino_id, contenido, tipo = 'texto' } = req.body; // Añadimos "tipo" con un valor por defecto
  const userId = req.user.userId;
  const userRole = req.user.role;

  console.log('Datos recibidos:', { inquilino_id, contenido, tipo, userId, userRole });

  // Validación de datos
  if (!inquilino_id || !contenido) {
    console.log('❌ Datos inválidos:', { inquilino_id, contenido });
    return res.status(400).json({ error: 'Faltan datos requeridos: inquilino_id y contenido son obligatorios' });
  }

  const inquilinoId = parseInt(inquilino_id, 10);
  if (isNaN(inquilinoId)) {
    console.log('❌ inquilino_id no es un número válido:', inquilino_id);
    return res.status(400).json({ error: 'inquilino_id debe ser un número válido' });
  }

  if (typeof contenido !== 'string' || !contenido.trim()) {
    console.log('❌ contenido no es una cadena válida:', contenido);
    return res.status(400).json({ error: 'contenido debe ser una cadena no vacía' });
  }

  if (typeof tipo !== 'string' || !tipo.trim()) {
    console.log('❌ tipo no es una cadena válida:', tipo);
    return res.status(400).json({ error: 'tipo debe ser una cadena no vacía' });
  }

  // Verificar si el inquilino existe
  const checkInquilinoQuery = 'SELECT id FROM inquilinos WHERE id = ?';
  connection.query(checkInquilinoQuery, [inquilinoId], (error, inquilinoResults) => {
    if (error) {
      console.error('❌ Error al verificar inquilino:', error);
      return res.status(500).json({ error: 'Error al verificar inquilino', details: error.message || error.sqlMessage || 'Error desconocido' });
    }
    if (inquilinoResults.length === 0) {
      console.log(`❌ Inquilino ${inquilinoId} no encontrado`);
      return res.status(404).json({ error: 'Inquilino no encontrado' });
    }

    // Verificar si el admin existe
    const checkAdminQuery = 'SELECT id FROM usuarios WHERE id = ?';
    connection.query(checkAdminQuery, [userId], (error, adminResults) => {
      if (error) {
        console.error('❌ Error al verificar admin:', error);
        return res.status(500).json({ error: 'Error al verificar admin', details: error.message || error.sqlMessage || 'Error desconocido' });
      }
      if (adminResults.length === 0) {
        console.log(`❌ Admin ${userId} no encontrado`);
        return res.status(404).json({ error: 'Admin no encontrado' });
      }

      // Si el usuario es admin (rol 1), puede enviar mensajes directamente
      if (userRole === 1) {
        const sqlInsert = `
          INSERT INTO mensajes (inquilino_id, admin_id, mensaje, fecha, tipo, leido)
          VALUES (?, ?, ?, CURDATE(), ?, 0)
        `;
        connection.query(sqlInsert, [inquilinoId, userId, contenido, tipo], (error, result) => {
          if (error) {
            console.error('❌ Error al enviar mensaje:', error);
            console.log('Detalles completos del error:', JSON.stringify(error, null, 2));
            return res.status(500).json({ error: 'Error al enviar el mensaje', details: error.message || error.sqlMessage || 'Error desconocido' });
          }
          console.log(`✅ Mensaje enviado por admin ${userId} al inquilino ${inquilinoId}`);
          res.status(201).json({ message: 'Mensaje enviado correctamente' });
        });
      } else {
        // Si no es admin, verificar permisos
        const sqlCheckPermission = `
          SELECT v.id
          FROM viviendas v
          JOIN inquilinos i ON i.vivienda_id = v.id
          WHERE i.id = ? AND v.id_adm = ?
        `;
        connection.query(sqlCheckPermission, [inquilinoId, userId], (error, results) => {
          if (error) {
            console.error('❌ Error al verificar permisos:', error);
            return res.status(500).json({ error: 'Error al verificar permisos', details: error.message || error.sqlMessage || 'Error desconocido' });
          }
          if (results.length === 0) {
            console.log(`❌ Usuario ${userId} no tiene permiso para enviar mensaje al inquilino ${inquilinoId}`);
            return res.status(403).json({ error: 'No tienes permiso para enviar un mensaje a este inquilino' });
          }

          // Insertar el mensaje
          const sqlInsert = `
            INSERT INTO mensajes (inquilino_id, admin_id, mensaje, fecha, tipo, leido)
            VALUES (?, ?, ?, CURDATE(), ?, 0)
          `;
          connection.query(sqlInsert, [inquilinoId, userId, contenido, tipo], (error, result) => {
            if (error) {
              console.error('❌ Error al enviar mensaje:', error);
              console.log('Detalles completos del error:', JSON.stringify(error, null, 2));
              return res.status(500).json({ error: 'Error al enviar el mensaje', details: error.message || error.sqlMessage || 'Error desconocido' });
            }
            console.log(`✅ Mensaje enviado por usuario ${userId} al inquilino ${inquilinoId}`);
            res.status(201).json({ message: 'Mensaje enviado correctamente' });
          });
        });
      }
    });
  });
});

// Obtener mensajes de un inquilino (para inquilino-profile)
router.get('/mensajes/inquilino/:id', authenticateToken, (req, res) => {
  console.log('📥 Solicitud recibida para GET /mensajes/inquilino/:id');
  console.log('Parámetros:', req.params);
  console.log('Usuario autenticado:', req.user);

  const inquilinoId = parseInt(req.params.id, 10);

  // Validar el inquilinoId
  if (isNaN(inquilinoId)) {
    console.log('❌ inquilino_id no es un número válido:', req.params.id);
    return res.status(400).json({ error: 'inquilino_id debe ser un número válido' });
  }

  // Verificar si el inquilino existe
  const checkInquilinoQuery = 'SELECT id FROM inquilinos WHERE id = ?';
  connection.query(checkInquilinoQuery, [inquilinoId], (error, inquilinoResults) => {
    if (error) {
      console.error('❌ Error al verificar inquilino:', error);
      return res.status(500).json({ error: 'Error al verificar inquilino', details: error.message || error.sqlMessage || 'Error desconocido' });
    }
    if (inquilinoResults.length === 0) {
      console.log(`❌ Inquilino ${inquilinoId} no encontrado`);
      return res.status(404).json({ error: 'Inquilino no encontrado' });
    }

    // Verificar permisos del usuario
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === 1) {
      // Si es admin, puede ver todos los mensajes
      const sql = `
        SELECT id, inquilino_id, admin_id, mensaje AS contenido, fecha, tipo, leido
        FROM mensajes
        WHERE inquilino_id = ?
        ORDER BY fecha DESC
      `;

      connection.query(sql, [inquilinoId], (error, results) => {
        if (error) {
          console.error('❌ Error al cargar mensajes:', error);
          return res.status(500).json({ error: 'Error al cargar los mensajes', details: error.message || error.sqlMessage || 'Error desconocido' });
        }
        console.log(`✅ Mensajes cargados para inquilino ${inquilinoId}:`, results.length);
        res.json(results);
      });
    } else {
      // Si no es admin, verificar permisos
      const sqlCheckPermission = `
        SELECT v.id
        FROM viviendas v
        JOIN inquilinos i ON i.vivienda_id = v.id
        WHERE i.id = ? AND v.id_adm = ?
      `;
      connection.query(sqlCheckPermission, [inquilinoId, userId], (error, results) => {
        if (error) {
          console.error('❌ Error al verificar permisos:', error);
          return res.status(500).json({ error: 'Error al verificar permisos', details: error.message || error.sqlMessage || 'Error desconocido' });
        }
        if (results.length === 0) {
          console.log(`❌ Usuario ${userId} no tiene permiso para ver mensajes del inquilino ${inquilinoId}`);
          return res.status(403).json({ error: 'No tienes permiso para ver los mensajes de este inquilino' });
        }

        // Obtener los mensajes
        const sql = `
          SELECT id, inquilino_id, admin_id, mensaje AS contenido, fecha, tipo, leido
          FROM mensajes
          WHERE inquilino_id = ?
          ORDER BY fecha DESC
        `;

        connection.query(sql, [inquilinoId], (error, results) => {
          if (error) {
            console.error('❌ Error al cargar mensajes:', error);
            return res.status(500).json({ error: 'Error al cargar los mensajes', details: error.message || error.sqlMessage || 'Error desconocido' });
          }
          console.log(`✅ Mensajes cargados para inquilino ${inquilinoId}:`, results.length);
          res.json(results);
        });
      });
    }
  });
});

// Obtener mensajes enviados al administrador (no se usa en inquilino-profile, pero lo ajustamos por consistencia)
router.get('/mensajes/admin', authenticateToken, (req, res) => {
  const adminId = req.user.userId;

  const query = 'SELECT id, inquilino_id, admin_id, mensaje AS contenido, fecha_envio AS fecha, leido FROM mensajes WHERE admin_id = ?';
  connection.query(query, [adminId], (error, results) => {
    if (error) {
      console.error('❌ Error al obtener mensajes:', error);
      return res.status(500).json({ error: 'Error al obtener los mensajes', details: error.sqlMessage });
    }

    res.status(200).json(results);
  });
});

// Marcar mensajes como leídos
router.put('/mensajes/marcar-leidos/:inquilinoId', authenticateToken, (req, res) => {
  const adminId = req.user.userId;
  const inquilinoId = req.params.inquilinoId;

  const sqlCheckPermission = `
    SELECT v.id
    FROM viviendas v
    JOIN inquilinos i ON i.vivienda_id = v.id
    WHERE i.id = ? AND v.id_adm = ?
  `;
  connection.query(sqlCheckPermission, [inquilinoId, adminId], (error, permissionResults) => {
    if (error) {
      console.error('❌ Error al verificar permisos:', error);
      return res.status(500).json({ error: 'Error al verificar permisos', details: error.sqlMessage });
    }
    if (permissionResults.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para marcar los mensajes de este inquilino como leídos' });
    }

    const query = 'UPDATE mensajes SET leido = 1 WHERE inquilino_id = ?';
    connection.query(query, [inquilinoId], (error, results) => {
      if (error) {
        console.error('❌ Error al marcar mensajes como leídos:', error);
        return res.status(500).json({ error: 'Error al marcar los mensajes como leídos', details: error.sqlMessage });
      }

      res.status(200).json({ message: 'Mensajes marcados como leídos' });
    });
  });
});

// CRUD para Viviendas

// READ: Obtener una vivienda por ID
router.get('/viviendas/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const query = 'SELECT * FROM viviendas WHERE id = ? AND id_adm = ?';
  connection.query(query, [id, userId], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Vivienda no encontrada o no tienes permiso' });
    }
    res.json(results[0]);
  });
});

// UPDATE: Actualizar una vivienda
router.put('/viviendas/:id', authenticateToken, upload.single('img'), (req, res) => {
  const { id } = req.params;
  const { nombre, direccion, estado, precio_alquiler, notas } = req.body;
  const userId = req.user.userId;

  if (!id) {
    return res.status(400).json({ error: 'ID de la vivienda es requerido' });
  }

  connection.query('SELECT * FROM viviendas WHERE id = ? AND id_adm = ?', [id, userId], (error, results) => {
    if (error) {
      console.error('Error al buscar vivienda:', error);
      return res.status(500).json({ error: error.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Vivienda no encontrada o no tienes permiso para editarla' });
    }

    const vivienda = results[0];
    let updatedImg = vivienda.img;

    if (req.file) {
      if (vivienda.img) {
        const oldImagePath = path.join(__dirname, '..', vivienda.img);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updatedImg = req.file.path;
    }

    const updates = {
      nombre: nombre || vivienda.nombre,
      direccion: direccion || vivienda.direccion,
      estado: estado || vivienda.estado,
      img: updatedImg,
      precio_alquiler: precio_alquiler || vivienda.precio_alquiler,
      notas: notas || vivienda.notas,
    };

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
      userId,
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