const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'homecheck'
});

connection.connect(error => {
    if (error) {
        console.error('Error conectando a MySQL:', error);
        return;
    }
    console.log('Conectado a MySQL');
});

module.exports = connection;