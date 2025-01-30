const express = require('express');
const cors = require('cors');
const connection = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
const inquilinosRoutes = require('./routes/inquilinos');

// Rutas

app.use('/api', inquilinosRoutes);

app.get('/', (req, res) => {
    res.send('API funcionando 🚀');
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});