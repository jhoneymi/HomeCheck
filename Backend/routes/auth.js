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
  // Verificar múltiples ubicaciones posibles del token
  const token = req.headers['authorization']?.split(' ')[1] || 
                req.query.token || 
                req.cookies?.token;

  if (!token) {
    console.log('❌ Token no proporcionado - Headers:', req.headers);
    return res.status(401).json({ 
      error: 'Token no proporcionado',
      details: 'Por favor incluye el token en el header Authorization o como parámetro'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Error al verificar token:', error.message);
    res.status(403).json({ 
      error: 'Token inválido o expirado',
      details: error.message 
    });
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
      { userId: user.id, email: user.email, role_id: user.role_id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login exitoso',
      token,
      userId: user.id,
      role_id: user.role_id,
    });
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
router.get('/inquilino/me', authenticateToken, (req, res) => {
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

        // Determinar el mes y año del pago
        const fechaPago = new Date(fecha_pago);
        const mesPago = fechaPago.getMonth() + 1;
        const anioPago = fechaPago.getFullYear();

        // Determinar el mes y año actuales
        const today = new Date();
        const mesActual = today.getMonth() + 1;
        const anioActual = today.getFullYear();

        // Actualizar ganancias_mensuales si el pago pertenece al mes actual
        if (mesPago === mesActual && anioPago === anioActual) {
          recalcularGananciasMensuales(userId, mesPago, anioPago, connection, (error) => {
            if (error) {
              console.error('Error al recalcular ganancias mensuales después de registrar pago (admin):', error);
            }
            res.status(201).json({ message: 'Pago registrado correctamente' });
          });
        } else {
          res.status(201).json({ message: 'Pago registrado correctamente' });
        }
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

  // Obtener el admin_id asociado al inquilino a través de la vivienda
  const queryGetAdminId = `
    SELECT v.id_adm
    FROM viviendas v
    JOIN inquilinos i ON i.vivienda_id = v.id
    WHERE i.id = ?
  `;
  connection.query(queryGetAdminId, [inquilino_id], (error, adminResults) => {
    if (error) {
      console.error('❌ Error al obtener admin_id:', error);
      return res.status(500).json({ error: 'Error al obtener datos del administrador' });
    }
    if (adminResults.length === 0) {
      return res.status(404).json({ error: 'Inquilino no asociado a una vivienda' });
    }

    const adminId = adminResults[0].id_adm;

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

      // Validar el método de pago
      if (metodo_pago === 'Efectivo' && inquilinoMetodoPago === 'Efectivo') {
        return res.status(403).json({ error: 'El pago en efectivo debe ser registrado por el administrador.' });
      }
      if (metodo_pago === 'Tarjeta/Transferencia' && !['Tarjeta', 'Otro'].includes(inquilinoMetodoPago)) {
        return res.status(403).json({ error: 'Tu método de pago registrado no permite pagos por tarjeta o transferencia.' });
      }

      const query = 'INSERT INTO pagos (inquilino_id, vivienda_id, monto, metodo_pago, fecha_pago, estado) VALUES (?, ?, ?, ?, ?, ?)';
      connection.query(query, [inquilino_id, vivienda_id, monto, metodo_pago, fecha_pago, estado], (error, results) => {
        if (error) {
          console.error('❌ Error al registrar pago:', error);
          return res.status(500).json({ error: 'Error al registrar el pago' });
        }

        // Actualizar el último pago del inquilino
        const updateQuery = `
          UPDATE inquilinos 
          SET ultimo_pago_fecha = ?, ultimo_pago_estado = ?
          WHERE id = ?
        `;
        connection.query(updateQuery, [fecha_pago, estado, inquilino_id], (error) => {
          if (error) {
            console.error('❌ Error al actualizar último pago:', error);
            return res.status(500).json({ error: 'Error al actualizar el estado del inquilino' });
          }

          // Determinar el mes y año del pago
          const fechaPago = new Date(fecha_pago);
          const mesPago = fechaPago.getMonth() + 1;
          const anioPago = fechaPago.getFullYear();

          // Determinar el mes y año actuales
          const today = new Date();
          const mesActual = today.getMonth() + 1;
          const anioActual = today.getFullYear();

          // Actualizar ganancias_mensuales si el pago pertenece al mes actual
          if (mesPago === mesActual && anioPago === anioActual) {
            recalcularGananciasMensuales(adminId, mesPago, anioPago, connection, (error) => {
              if (error) {
                console.error('Error al recalcular ganancias mensuales después de registrar pago (inquilino):', error);
              }
              res.status(201).json({ message: 'Pago registrado exitosamente', id: results.insertId });
            });
          } else {
            res.status(201).json({ message: 'Pago registrado exitosamente', id: results.insertId });
          }
        });
      });
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

// Facturas

// Obtener facturas simuladas y pagos del inquilino autenticado
router.get('/facturas/inquilino', authenticateToken, (req, res) => {
  const inquilinoId = req.user.inquilinoId;

  if (!inquilinoId) {
    return res.status(400).json({ error: 'ID del inquilino no encontrado en el token' });
  }

  // Obtener los datos del inquilino y su vivienda (incluyendo el nombre de la vivienda)
  const viviendaQuery = `
    SELECT v.precio_alquiler, v.nombre AS vivienda_nombre
    FROM viviendas v
    JOIN inquilinos i ON i.vivienda_id = v.id
    WHERE i.id = ?
  `;
  connection.query(viviendaQuery, [inquilinoId], (error, viviendaResults) => {
    if (error) {
      console.error('❌ Error al obtener precio de alquiler:', error);
      return res.status(500).json({ error: 'Error al obtener el precio de alquiler', details: error.message });
    }
    if (viviendaResults.length === 0) {
      return res.status(404).json({ error: 'Vivienda no encontrada para este inquilino' });
    }

    const precioAlquiler = parseFloat(viviendaResults[0].precio_alquiler);
    const viviendaNombre = viviendaResults[0].vivienda_nombre;

    if (isNaN(precioAlquiler)) {
      return res.status(500).json({ error: 'El precio de alquiler de la vivienda no es válido' });
    }

    // Obtener los pagos del inquilino
    const query = 'SELECT * FROM pagos WHERE inquilino_id = ? ORDER BY fecha_pago DESC';
    connection.query(query, [inquilinoId], (error, pagos) => {
      if (error) {
        console.error('❌ Error al obtener pagos:', error);
        return res.status(500).json({ error: 'Error al obtener los pagos', details: error.message });
      }

      // Agrupar pagos por mes para simular facturas
      const facturasMap = new Map();
      pagos.forEach(pago => {
        const fechaPago = new Date(pago.fecha_pago);
        if (isNaN(fechaPago.getTime())) {
          console.error('Fecha de pago inválida:', pago.fecha_pago);
          return; // Saltar este pago si la fecha es inválida
        }

        const year = fechaPago.getFullYear();
        const month = fechaPago.getMonth() + 1;
        const facturaKey = `${year}-${String(month).padStart(2, '0')}`; // Ejemplo: "2025-05"

        if (!facturasMap.has(facturaKey)) {
          const fechaEmision = `${year}-${String(month).padStart(2, '0')}-01`;
          const fechaVencimiento = new Date(year, month, 0).toISOString().split('T')[0];
          facturasMap.set(facturaKey, {
            mesAnio: facturaKey, // Cambiado de "id" a "mesAnio"
            montoTotal: precioAlquiler, // Cambiado de "monto" a "montoTotal"
            fechaEmision: fechaEmision, // Cambiado de "fecha_emision" a "fechaEmision"
            fechaVencimiento: fechaVencimiento, // Cambiado de "fecha_vencimiento" a "fechaVencimiento"
            viviendaNombre: viviendaNombre, // Agregado
            estado: 'Pendiente', // Se calculará después
            pagos: []
          });
        }

        const factura = facturasMap.get(facturaKey);
        factura.pagos.push({
          id: pago.id, // Agregado
          monto: parseFloat(pago.monto),
          fecha_pago: new Date(pago.fecha_pago).toISOString().split('T')[0], // Formateado
          metodo_pago: pago.metodo_pago,
          estado: pago.estado // Agregado
        });
      });

      // Calcular el estado de cada factura y agregar montoPendiente y montoDevuelto
      const today = new Date();
      const facturas = Array.from(facturasMap.values()).map(factura => {
        const totalPagado = factura.pagos.reduce((sum, pago) => sum + pago.monto, 0);
        const fechaVencimiento = new Date(factura.fechaVencimiento);

        if (totalPagado >= factura.montoTotal) {
          factura.estado = 'Pagada';
          factura.montoPendiente = 0; // Agregado
          factura.montoDevuelto = totalPagado > factura.montoTotal ? totalPagado - factura.montoTotal : 0; // Agregado
        } else {
          factura.estado = 'Pendiente';
          factura.montoPendiente = factura.montoTotal - totalPagado; // Agregado
          factura.montoDevuelto = 0; // Agregado
          if (today > fechaVencimiento) {
            factura.estado = 'Atrasada';
          }
        }

        return factura;
      });

      res.status(200).json(facturas);
    });
  });
});

router.get('/facturas', authenticateToken, async (req, res) => {
  const userId = req.user?.userId;
  console.log('Payload del token (req.user):', req.user);
  console.log('userId extraído:', userId);

  if (!userId) {
    return res.status(401).json({ error: 'ID del usuario no encontrado en el token' });
  }

  const { search, sort = 'desc', fechaInicio, fechaFin } = req.query;

  try {
    const inquilinosQuery = `
      SELECT id, nombre, vivienda_id 
      FROM inquilinos 
      WHERE admin_id = ?
    `;
    const [inquilinos] = await new Promise((resolve, reject) => {
      connection.query(inquilinosQuery, [userId], (error, results) => {
        if (error) return reject(error);
        resolve([results]);
      });
    });

    if (inquilinos.length === 0) {
      return res.status(404).json({ error: 'No se encontraron inquilinos registrados por este administrador' });
    }

    const inquilinoIds = inquilinos.map(inquilino => inquilino.id);

    const viviendaQuery = `
      SELECT i.id AS inquilino_id, v.precio_alquiler, v.nombre AS vivienda_nombre
      FROM viviendas v
      JOIN inquilinos i ON i.vivienda_id = v.id
      WHERE i.id IN (${inquilinoIds.map(() => '?').join(',')})
    `;
    const [viviendaResults] = await new Promise((resolve, reject) => {
      connection.query(viviendaQuery, inquilinoIds, (error, results) => {
        if (error) return reject(error);
        resolve([results]);
      });
    });

    if (viviendaResults.length === 0) {
      return res.status(404).json({ error: 'No se encontraron viviendas asociadas a los inquilinos' });
    }

    const preciosAlquiler = {};
    const viviendas = {};
    viviendaResults.forEach(row => {
      preciosAlquiler[row.inquilino_id] = parseFloat(row.precio_alquiler) || 0;
      viviendas[row.inquilino_id] = row.vivienda_nombre || 'Sin asignar';
    });

    const pagosQuery = `
      SELECT p.*, i.nombre AS inquilino_nombre
      FROM pagos p
      JOIN inquilinos i ON p.inquilino_id = i.id
      WHERE p.inquilino_id IN (${inquilinoIds.map(() => '?').join(',')})
      ORDER BY p.fecha_pago DESC
    `;
    const [pagos] = await new Promise((resolve, reject) => {
      connection.query(pagosQuery, inquilinoIds, (error, results) => {
        if (error) return reject(error);
        resolve([results]);
      });
    });

    const facturasMap = new Map();
    pagos.forEach(pago => {
      const fechaPago = new Date(pago.fecha_pago);
      if (isNaN(fechaPago.getTime())) {
        console.error('Fecha de pago inválida:', pago.fecha_pago);
        return;
      }

      const inquilinoId = pago.inquilino_id;
      const year = fechaPago.getFullYear();
      const month = fechaPago.getMonth() + 1;
      const facturaKey = `${inquilinoId}-${year}-${String(month).padStart(2, '0')}`;

      if (!facturasMap.has(facturaKey)) {
        const fechaEmision = `${year}-${String(month).padStart(2, '0')}-01`;
        const fechaVencimiento = new Date(year, month, 0).toISOString().split('T')[0];
        facturasMap.set(facturaKey, {
          id: facturaKey,
          inquilino_id: inquilinoId,
          inquilino_nombre: pago.inquilino_nombre,
          vivienda: viviendas[inquilinoId] || 'Sin asignar',
          montoTotal: preciosAlquiler[inquilinoId] || 0,
          fechaEmision,
          fechaVencimiento,
          estado: 'Pendiente',
          pagos: [],
          montoPendiente: 0,
          montoDevuelto: 0
        });
      }

      const factura = facturasMap.get(facturaKey);
      factura.pagos.push({
        id: pago.id,
        monto: parseFloat(pago.monto),
        fecha_pago: new Date(pago.fecha_pago).toISOString().split('T')[0],
        metodo_pago: pago.metodo_pago,
        estado: pago.estado
      });
    });

    const today = new Date();
    const facturas = Array.from(facturasMap.values()).map(factura => {
      const totalPagado = factura.pagos.reduce((sum, pago) => sum + pago.monto, 0);
      const fechaVencimiento = new Date(factura.fechaVencimiento);

      if (totalPagado >= factura.montoTotal) {
        factura.estado = 'Pagada';
        factura.montoPendiente = 0;
        factura.montoDevuelto = totalPagado > factura.montoTotal ? totalPagado - factura.montoTotal : 0;
      } else {
        factura.estado = 'Pendiente';
        factura.montoPendiente = factura.montoTotal - totalPagado;
        factura.montoDevuelto = 0;
        if (today > fechaVencimiento) {
          factura.estado = 'Atrasada';
        }
      }

      if (search) {
        const query = search.toLowerCase();
        if (!factura.inquilino_nombre.toLowerCase().includes(query) && !factura.vivienda.toLowerCase().includes(query)) {
          return null;
        }
      }

      if (fechaInicio || fechaFin) {
        const fechaEmisionDate = new Date(factura.fechaEmision);

        let startDate = null;
        if (fechaInicio) {
          const parsedStartDate = new Date(fechaInicio);
          if (!isNaN(parsedStartDate.getTime())) {
            startDate = parsedStartDate;
          } else {
            console.warn(`Fecha de inicio inválida: ${fechaInicio}`);
          }
        }

        let endDate = null;
        if (fechaFin) {
          const parsedEndDate = new Date(fechaFin);
          if (!isNaN(parsedEndDate.getTime())) {
            endDate = parsedEndDate;
          } else {
            console.warn(`Fecha de fin inválida: ${fechaFin}`);
          }
        }

        if (startDate && fechaEmisionDate < startDate) return null;
        if (endDate && fechaEmisionDate > endDate) return null;
      }

      return factura;
    }).filter(factura => factura !== null);

    facturas.sort((a, b) => {
      const dateA = new Date(a.fechaEmision).getTime();
      const dateB = new Date(b.fechaEmision).getTime();
      return sort === 'asc' ? dateA - dateB : dateB - dateA;
    });

    const gananciasPagadas = facturas
      .filter(f => f.estado === 'Pagada')
      .reduce((sum, f) => sum + f.montoTotal, 0);
    const gananciasPendientes = facturas
      .filter(f => f.estado === 'Pendiente' || f.estado === 'Atrasada')
      .reduce((sum, f) => sum + f.montoPendiente, 0);

    res.status(200).json({
      success: true,
      facturas,
      ganancias: {
        pagadas: gananciasPagadas,
        pendientes: gananciasPendientes,
        total: gananciasPagadas + gananciasPendientes
      },
      message: 'Facturas recuperadas exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al obtener facturas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al recuperar las facturas',
      error: error.message
    });
  }
});

// Mensajes

// Enviar un mensaje
router.post('/mensajes/inquilino', authenticateToken, (req, res) => {
  const { inquilino_id, admin_id, mensaje, fecha, tipo = 'Solicitud de Pago' } = req.body;
  const inquilinoId = req.user.inquilinoId;

  console.log('Datos recibidos:', { inquilino_id, admin_id, mensaje, fecha, tipo, inquilinoId });

  // Validación de datos
  if (!inquilino_id || !admin_id || !mensaje || !fecha) {
    console.log('❌ Datos inválidos:', { inquilino_id, admin_id, mensaje, fecha });
    return res.status(400).json({ error: 'Faltan datos requeridos: inquilino_id, admin_id, mensaje y fecha son obligatorios' });
  }

  const inquilinoIdParsed = parseInt(inquilino_id, 10);
  const adminIdParsed = parseInt(admin_id, 10);
  if (isNaN(inquilinoIdParsed) || isNaN(adminIdParsed)) {
    console.log('❌ inquilino_id o admin_id no son números válidos:', { inquilino_id, admin_id });
    return res.status(400).json({ error: 'inquilino_id y admin_id deben ser números válidos' });
  }

  // Verificar permisos: el inquilino autenticado solo puede enviar mensajes sobre sí mismo
  if (inquilinoIdParsed !== inquilinoId) {
    console.log(`❌ Inquilino ${inquilinoId} no tiene permiso para enviar mensaje como inquilino ${inquilinoIdParsed}`);
    return res.status(403).json({ error: 'No tienes permiso para enviar un mensaje en nombre de otro inquilino' });
  }

  // Verificar si el inquilino existe
  const checkInquilinoQuery = 'SELECT id FROM inquilinos WHERE id = ?';
  connection.query(checkInquilinoQuery, [inquilinoIdParsed], (error, inquilinoResults) => {
    if (error) {
      console.error('❌ Error al verificar inquilino:', error);
      return res.status(500).json({ error: 'Error al verificar inquilino', details: error.message || error.sqlMessage || 'Error desconocido' });
    }
    if (inquilinoResults.length === 0) {
      console.log(`❌ Inquilino ${inquilinoIdParsed} no encontrado`);
      return res.status(404).json({ error: 'Inquilino no encontrado' });
    }

    // Verificar si el admin existe
    const checkAdminQuery = 'SELECT id FROM usuarios WHERE id = ?';
    connection.query(checkAdminQuery, [adminIdParsed], (error, adminResults) => {
      if (error) {
        console.error('❌ Error al verificar admin:', error);
        return res.status(500).json({ error: 'Error al verificar admin', details: error.message || error.sqlMessage || 'Error desconocido' });
      }
      if (adminResults.length === 0) {
        console.log(`❌ Admin ${adminIdParsed} no encontrado`);
        return res.status(404).json({ error: 'Admin no encontrado' });
      }

      // Insertar el mensaje
      const sqlInsert = `
        INSERT INTO mensajes (inquilino_id, admin_id, mensaje, fecha, tipo, leido)
        VALUES (?, ?, ?, ?, ?, 0)
      `;
      connection.query(sqlInsert, [inquilinoIdParsed, adminIdParsed, mensaje, fecha, tipo], (error, result) => {
        if (error) {
          console.error('❌ Error al enviar mensaje:', error);
          return res.status(500).json({ error: 'Error al enviar el mensaje', details: error.message || error.sqlMessage || 'Error desconocido' });
        }
        console.log(`✅ Mensaje enviado por inquilino ${inquilinoIdParsed} al admin ${adminIdParsed}`);
        res.status(201).json({ message: 'Mensaje enviado correctamente' });
      });
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

// Gastos

// Obtener todos los gastos del administrador
router.get('/gastos', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const query = 'SELECT * FROM gastos WHERE admin_id = ? ORDER BY fecha_gasto DESC';
  connection.query(query, [userId], (error, results) => {
    if (error) {
      console.error('❌ Error al obtener gastos:', error);
      return res.status(500).json({ error: 'Error al obtener los gastos', details: error.message });
    }
    res.status(200).json(results);
  });
});

// Crear un nuevo gasto
router.post('/gastos', authenticateToken, (req, res) => {
  const { nombre, descripcion, monto, fecha_gasto, tipo } = req.body;
  const admin_id = req.user.userId;

  if (!nombre || !monto || !fecha_gasto || !tipo) {
    return res.status(400).json({ error: 'Faltan campos requeridos: nombre, monto, fecha_gasto y tipo son obligatorios' });
  }

  const query = 'INSERT INTO gastos (nombre, descripcion, monto, fecha_gasto, tipo, admin_id) VALUES (?, ?, ?, ?, ?, ?)';
  const values = [nombre, descripcion || null, monto, fecha_gasto, tipo, admin_id];

  connection.query(query, values, (error, result) => {
    if (error) {
      console.error('❌ Error al crear gasto:', error);
      return res.status(500).json({ error: 'Error al crear el gasto', details: error.message });
    }

    // Determinar el mes y año del gasto
    const fechaGasto = new Date(fecha_gasto);
    const mesGasto = fechaGasto.getMonth() + 1;
    const anioGasto = fechaGasto.getFullYear();

    // Determinar el mes y año actuales
    const today = new Date();
    const mesActual = today.getMonth() + 1;
    const anioActual = today.getFullYear();

    // Actualizar ganancias_mensuales si el gasto pertenece al mes actual
    if (mesGasto === mesActual && anioGasto === anioActual) {
      recalcularGananciasMensuales(admin_id, mesGasto, anioGasto, connection, (error) => {
        if (error) {
          console.error('Error al recalcular ganancias mensuales después de registrar gasto:', error);
        }
        res.status(201).json({ message: 'Gasto creado exitosamente', id: result.insertId });
      });
    } else {
      res.status(201).json({ message: 'Gasto creado exitosamente', id: result.insertId });
    }
  });
});

// Eliminar un gasto
router.delete('/gastos/:id', authenticateToken, (req, res) => {
  const gastoId = req.params.id;
  const admin_id = req.user.userId;

  const query = 'DELETE FROM gastos WHERE id = ? AND admin_id = ?';
  connection.query(query, [gastoId, admin_id], (error, result) => {
    if (error) {
      console.error('❌ Error al eliminar gasto:', error);
      return res.status(500).json({ error: 'Error al eliminar el gasto', details: error.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado o no tienes permiso' });
    }
    res.status(200).json({ message: 'Gasto eliminado exitosamente' });
  });
});

// Ganancias Historial

// Obtener ganancias mensuales históricas
router.get('/ganancias/historico', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const query = 'SELECT * FROM ganancias_mensuales WHERE admin_id = ? ORDER BY anio DESC, mes DESC';
  connection.query(query, [userId], (error, results) => {
    if (error) {
      console.error('❌ Error al obtener ganancias históricas:', error);
      return res.status(500).json({ error: 'Error al obtener ganancias históricas', details: error.message });
    }
    res.status(200).json(results);
  });
});

// Función auxiliar para recalcular y actualizar las ganancias mensuales
const recalcularGananciasMensuales = (adminId, mes, anio, connection, callback) => {
  // Asegurarse de que adminId, mes y anio sean enteros
  adminId = parseInt(adminId);
  mes = parseInt(mes);
  anio = parseInt(anio);

  console.log(`Recalculando ganancias para adminId=${adminId}, mes=${mes}, anio=${anio}`);

  // Obtener los inquilinos asociados al administrador
  const queryInquilinos = `
    SELECT i.id, i.vivienda_id
    FROM inquilinos i
    JOIN viviendas v ON i.vivienda_id = v.id
    WHERE v.id_adm = ?
  `;
  connection.query(queryInquilinos, [adminId], (error, inquilinos) => {
    if (error) {
      console.error('Error al obtener inquilinos:', error);
      callback(error);
      return;
    }

    if (inquilinos.length === 0) {
      console.log('No se encontraron inquilinos para el administrador:', adminId);
      const queryUpsertGanancias = `
        INSERT INTO ganancias_mensuales (admin_id, mes, anio, ingresos, gastos, ganancia_neta)
        VALUES (?, ?, ?, 0, 0, 0)
        ON DUPLICATE KEY UPDATE
          ingresos = 0,
          gastos = 0,
          ganancia_neta = 0
      `;
      connection.query(queryUpsertGanancias, [adminId, mes, anio], (error, result) => {
        if (error) {
          console.error('Error al actualizar ganancias_mensuales (sin inquilinos):', error);
        } else {
          console.log(`Resultado de la consulta (sin inquilinos): affectedRows=${result.affectedRows}, changedRows=${result.changedRows}`);
        }
        callback(error);
      });
      return;
    }

    const inquilinoIds = inquilinos.map(inquilino => inquilino.id);

    // Obtener el precio_alquiler de las viviendas asociadas a los inquilinos
    const queryViviendas = `
      SELECT i.id AS inquilino_id, v.precio_alquiler
      FROM viviendas v
      JOIN inquilinos i ON i.vivienda_id = v.id
      WHERE i.id IN (${inquilinoIds.map(() => '?').join(',')})
    `;
    connection.query(queryViviendas, inquilinoIds, (error, viviendaResults) => {
      if (error) {
        console.error('Error al obtener precios de alquiler:', error);
        callback(error);
        return;
      }

      const preciosAlquiler = {};
      viviendaResults.forEach(row => {
        preciosAlquiler[row.inquilino_id] = parseFloat(row.precio_alquiler) || 0;
      });

      // Calcular la suma de los pagos por inquilino en el mes
      const queryPagos = `
        SELECT p.inquilino_id, SUM(p.monto) as total_pagado
        FROM pagos p
        WHERE p.inquilino_id IN (${inquilinoIds.map(() => '?').join(',')})
          AND MONTH(p.fecha_pago) = ?
          AND YEAR(p.fecha_pago) = ?
          AND p.estado = 'Pagado'
        GROUP BY p.inquilino_id
      `;
      connection.query(queryPagos, [...inquilinoIds, mes, anio], (error, pagosResults) => {
        if (error) {
          console.error('Error al calcular pagos por inquilino:', error);
          callback(error);
          return;
        }

        // Calcular los ingresos
        let ingresos = 0;
        pagosResults.forEach(pago => {
          const inquilinoId = pago.inquilino_id;
          const totalPagado = parseFloat(pago.total_pagado);
          const precioAlquiler = preciosAlquiler[inquilinoId] || 0;

          if (totalPagado >= precioAlquiler) {
            ingresos += precioAlquiler;
          }
        });

        // Calcular los gastos
        const queryGastos = `
          SELECT SUM(monto) as total_gastos
          FROM gastos
          WHERE MONTH(fecha_gasto) = ? 
            AND YEAR(fecha_gasto) = ?
            AND admin_id = ?
        `;
        connection.query(queryGastos, [mes, anio, adminId], (error, results) => {
          if (error) {
            console.error('Error al calcular gastos:', error);
            callback(error);
            return;
          }

          const gastos = results[0].total_gastos || 0;
          const gananciaNeta = ingresos - gastos;

          console.log(`Valores calculados: ingresos=${ingresos}, gastos=${gastos}, ganancia_neta=${gananciaNeta}`);

          // Actualizar o insertar en la tabla ganancias_mensuales
          const queryUpsertGanancias = `
            INSERT INTO ganancias_mensuales (admin_id, mes, anio, ingresos, gastos, ganancia_neta)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              ingresos = VALUES(ingresos),
              gastos = VALUES(gastos),
              ganancia_neta = VALUES(ganancia_neta)
          `;
          connection.query(queryUpsertGanancias, [adminId, mes, anio, ingresos, gastos, gananciaNeta], (error, result) => {
            if (error) {
              console.error('Error al actualizar ganancias_mensuales:', error);
            } else {
              console.log(`Resultado de la consulta: affectedRows=${result.affectedRows}, changedRows=${result.changedRows}`);
            }
            callback(error);
          });
        });
      });
    });
  });
};

// Endpoint /ganancias/actual (actualizado para usar la función auxiliar)
router.get('/ganancias/actual', authenticateToken, (req, res) => {
  const today = new Date();
  const mes = today.getMonth() + 1; // Mes actual (1-12)
  const anio = today.getFullYear(); // Año actual
  const adminId = req.user.userId; // Obtenido del token JWT

  // Obtener los inquilinos asociados al administrador
  const queryInquilinos = `
    SELECT i.id, i.vivienda_id
    FROM inquilinos i
    JOIN viviendas v ON i.vivienda_id = v.id
    WHERE v.id_adm = ?
  `;
  connection.query(queryInquilinos, [adminId], (error, inquilinos) => {
    if (error) {
      console.error('Error al obtener inquilinos:', error);
      return res.status(500).json({ error: 'Error al obtener inquilinos' });
    }

    if (inquilinos.length === 0) {
      console.log('No se encontraron inquilinos para el administrador:', adminId);
      recalcularGananciasMensuales(adminId, mes, anio, connection, (error) => {
        if (error) {
          return res.status(500).json({ error: 'Error al actualizar ganancias mensuales' });
        }
        return res.status(200).json({
          mes,
          anio,
          ingresos: 0,
          gastos: 0,
          ganancia_neta: 0,
          todos_pagaron: true
        });
      });
      return;
    }

    const inquilinoIds = inquilinos.map(inquilino => inquilino.id);

    // Obtener el precio_alquiler de las viviendas asociadas a los inquilinos
    const queryViviendas = `
      SELECT i.id AS inquilino_id, v.precio_alquiler
      FROM viviendas v
      JOIN inquilinos i ON i.vivienda_id = v.id
      WHERE i.id IN (${inquilinoIds.map(() => '?').join(',')})
    `;
    connection.query(queryViviendas, inquilinoIds, (error, viviendaResults) => {
      if (error) {
        console.error('Error al obtener precios de alquiler:', error);
        return res.status(500).json({ error: 'Error al obtener precios de alquiler' });
      }

      const preciosAlquiler = {};
      viviendaResults.forEach(row => {
        preciosAlquiler[row.inquilino_id] = parseFloat(row.precio_alquiler) || 0;
      });

      // Calcular la suma de los pagos por inquilino en el mes actual
      const queryPagos = `
        SELECT p.inquilino_id, SUM(p.monto) as total_pagado
        FROM pagos p
        WHERE p.inquilino_id IN (${inquilinoIds.map(() => '?').join(',')})
          AND MONTH(p.fecha_pago) = ?
          AND YEAR(p.fecha_pago) = ?
          AND p.estado = 'Pagado'
        GROUP BY p.inquilino_id
      `;
      connection.query(queryPagos, [...inquilinoIds, mes, anio], (error, pagosResults) => {
        if (error) {
          console.error('Error al calcular pagos por inquilino:', error);
          return res.status(500).json({ error: 'Error al calcular pagos por inquilino' });
        }

        // Calcular los ingresos
        let ingresos = 0;
        const inquilinosPagaronSet = new Set();
        pagosResults.forEach(pago => {
          const inquilinoId = pago.inquilino_id;
          const totalPagado = parseFloat(pago.total_pagado);
          const precioAlquiler = preciosAlquiler[inquilinoId] || 0;

          console.log(`Inquilino ${inquilinoId}: Total pagado = ${totalPagado}, Precio alquiler = ${precioAlquiler}`);

          if (totalPagado >= precioAlquiler) {
            ingresos += precioAlquiler;
            inquilinosPagaronSet.add(inquilinoId);
          }
        });

        console.log('Ingresos calculados (basados en precio_alquiler de facturas pagadas):', ingresos);

        // Calcular gastos
        const queryGastos = `
          SELECT SUM(monto) as total_gastos
          FROM gastos
          WHERE MONTH(fecha_gasto) = ? 
            AND YEAR(fecha_gasto) = ?
            AND admin_id = ?
        `;
        connection.query(queryGastos, [mes, anio, adminId], (error, results) => {
          if (error) {
            console.error('Error al calcular gastos:', error);
            return res.status(500).json({ error: 'Error al calcular gastos' });
          }

          const gastos = results[0].total_gastos || 0;
          console.log('Gastos calculados:', gastos);

          const gananciaNeta = ingresos - gastos;

          // Verificar si todos los inquilinos han pagado
          const totalInquilinos = inquilinos.length;
          const inquilinosPagaron = inquilinosPagaronSet.size;
          const todosPagaron = totalInquilinos > 0 && inquilinosPagaron === totalInquilinos;
          console.log('Todos pagaron:', todosPagaron, 'Inquilinos totales:', totalInquilinos, 'Inquilinos que pagaron:', inquilinosPagaron);

          // Actualizar ganancias_mensuales usando la función auxiliar
          recalcularGananciasMensuales(adminId, mes, anio, connection, (error) => {
            if (error) {
              return res.status(500).json({ error: 'Error al actualizar ganancias mensuales' });
            }

            res.status(200).json({
              mes,
              anio,
              ingresos,
              gastos,
              ganancia_neta: gananciaNeta,
              todos_pagaron: todosPagaron
            });
          });
        });
      });
    });
  });
});

// Guardar ganancias del mes actual (se llama al final del mes o cuando todos han pagado)
router.post('/ganancias/guardar', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { mes, anio, ingresos, gastos, ganancia_neta } = req.body;

  if (!mes || !anio || ingresos === undefined || gastos === undefined || ganancia_neta === undefined) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const query = `
    INSERT INTO ganancias_mensuales (mes, anio, ingresos, gastos, ganancia_neta, admin_id)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE ingresos = ?, gastos = ?, ganancia_neta = ?
  `;
  const values = [mes, anio, ingresos, gastos, ganancia_neta, userId, ingresos, gastos, ganancia_neta];

  connection.query(query, values, (error, result) => {
    if (error) {
      console.error('❌ Error al guardar ganancias:', error);
      return res.status(500).json({ error: 'Error al guardar ganancias', details: error.message });
    }
    res.status(200).json({ message: 'Ganancias guardadas exitosamente' });
  });
});

// Admin Zone

router.get('/admin/usuarios', authenticateToken, (req, res) => {
  console.log("🧾 Usuario autenticado:", req.user); // para ver el payload

  if (!req.user || req.user.role_id !== 1) {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' });
  }

  const query = `
    SELECT id, nombre_completo, email, direccion, telefono, role_id
    FROM usuarios 
    WHERE role_id = 2
  `;

  console.log("📥 Ejecutando query para obtener usuarios...");

  connection.query(query, (error, results) => {
    if (error) {
      console.error('❌ Error al obtener usuarios:', error.code, error.sqlMessage);
      return res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
    res.json(results);
  });
});

// Ruta para obtener todas las viviendas
router.get('/admin/viviendas', authenticateToken, (req, res) => {
  if (!req.user || req.user.role_id !== 1) {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' });
  }

  const query = `
    SELECT v.*, u.nombre_completo as propietario_nombre
    FROM viviendas v
    LEFT JOIN usuarios u ON v.id_adm = u.id
  `;
  
  connection.query(query, (error, results) => {
    if (error) {
      console.error('❌ Error al obtener viviendas:', error);
      return res.status(500).json({ error: 'Error al obtener las viviendas' });
    }
    res.json(results);
  });
});

// Ruta para obtener todos los inquilinos
router.get('/admin/inquilinos', authenticateToken, (req, res) => {
  if (req.user.role_id !== 1) {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' });
  }

  const query = 'SELECT * FROM inquilinos';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('❌ Error al obtener inquilinos:', error);
      return res.status(500).json({ error: 'Error al obtener los inquilinos' });
    }
    res.json(results);
  });
});

// Ruta para obtener todos los pagos
router.get('/admin/pagos', authenticateToken, (req, res) => {
  if (req.user.role_id !== 1) {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' });
  }

  const query = 'SELECT * FROM pagos';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('❌ Error al obtener pagos:', error);
      return res.status(500).json({ error: 'Error al obtener los pagos' });
    }
    res.json(results);
  });
});

module.exports = router;