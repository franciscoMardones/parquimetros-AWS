// Cargar dependencias  
const express = require('express');  
const mysql = require('mysql2');  
const cors = require('cors');  
const jwt = require('jsonwebtoken'); // Requerir JWT  
require('dotenv').config(); // Cargar las variables de entorno  

// Crear una aplicación Express  
const app = express(); // Inicializar Express  
app.use(cors());  
app.use(express.json()); // Para procesar datos en formato JSON  

// Configurar la conexión a la base de datos MySQL  
const db = mysql.createConnection({  
    host: process.env.DB_HOST,  
    user: process.env.DB_USER,  
    password: process.env.DB_PASSWORD,  
    database: process.env.DB_NAME,  
    port: 3306  
});  

// Conectar a la base de datos  
db.connect((err) => {  
    if (err) {  
        console.error('Error al conectar a la base de datos:', err);  
        return;  
    }  
    console.log('Conectado a la base de datos en AWS RDS');  
});  

// Ruta para crear un usuario administrador sin encriptar la contraseña  
app.post('/crear-admin', (req, res) => {  
    const { nombre, email, contraseña } = req.body;  

    // Insertar el nuevo administrador en la tabla usuarios con la contraseña en texto plano  
    const queryUsuario = `INSERT INTO usuarios (nombre, email, contraseña, id_rol) VALUES (?, ?, ?, ?)`;  
    db.query(queryUsuario, [nombre, email, contraseña, 1], (err, result) => {  
        if (err) {  
            console.error('Error al crear el usuario administrador:', err);  
            return res.status(500).json({ message: 'Error al crear el usuario administrador' });  
        }  
        res.status(200).json({ message: 'Usuario administrador creado con éxito' });  
    });  
});  

// Ruta para iniciar sesión (login) sin encriptación de contraseñas  
app.post('/login', (req, res) => {  
    const { email, contraseña } = req.body;  

    // Verificar si el usuario existe  
    const queryBuscar = `SELECT * FROM usuarios WHERE email = ?`;  
    db.query(queryBuscar, [email], (err, result) => {  
        if (err) {  
            console.error('Error al buscar el usuario:', err);  
            return res.status(500).json({ message: 'Error interno al buscar el usuario' });  
        }  

        if (result.length === 0) {  
            return res.status(404).json({ message: 'Usuario no encontrado' });  
        }  

        const usuario = result[0];  

        // Comparar la contraseña en texto plano  
        if (contraseña !== usuario.contraseña) {  
            return res.status(401).json({ message: 'Contraseña incorrecta' });  
        }  

        // Si la contraseña es correcta, generar un token JWT  
        const token = jwt.sign(  
            { id_usuario: usuario.id_usuario, email: usuario.email, rol: usuario.id_rol },  
            process.env.JWT_SECRET, // Llave secreta  
            { expiresIn: '2h' } // El token expira en 2 horas  
        );  

        console.log('Usuario autenticado:', usuario.email);  
        res.status(200).json({ message: 'Inicio de sesión exitoso', token, rol: usuario.id_rol, id_usuario: usuario.id_usuario });  
    });  
});  

// Ruta para actualizar un usuario administrador  
app.put('/actualizar-admin', (req, res) => {  
    const { email, nombre, contraseña } = req.body;  

    // Verificar que el usuario exista  
    const queryBuscar = `SELECT * FROM usuarios WHERE email = ?`;  
    db.query(queryBuscar, [email], (err, result) => {  
        if (err) {  
            console.error('Error al buscar el usuario:', err);  
            return res.status(500).json({ message: 'Error interno al buscar el usuario' });  
        }  

        if (result.length === 0) {  
            return res.status(404).json({ message: 'Usuario no encontrado' });  
        }  

        // Si el usuario existe, actualizar los datos  
        const queryActualizar = `UPDATE usuarios SET nombre = ?, contraseña = ? WHERE email = ?`;  
        db.query(queryActualizar, [nombre, contraseña, email], (err, result) => {  
            if (err) {  
                console.error('Error al actualizar el usuario:', err);  
                return res.status(500).json({ message: 'Error al actualizar el usuario' });  
            }  

            res.status(200).json({ message: 'Usuario actualizado con éxito' });  
        });  
    });  
});  

// Ruta para eliminar un usuario administrador  
app.post('/eliminar-admin', (req, res) => {  
    const { email } = req.body;  

    const queryEliminar = `DELETE FROM usuarios WHERE email = ? AND id_rol = 1`; // Solo eliminar administradores  
    db.query(queryEliminar, [email], (err, result) => {  
        if (err) {  
            console.error('Error al eliminar el administrador:', err);  
            return res.status(500).json({ message: 'Error al eliminar el administrador' });  
        }  

        res.status(200).json({ message: 'Administrador eliminado con éxito' });  
    });  
});  

// Ruta para buscar un usuario por email  
app.post('/buscar-usuario', (req, res) => {  
    const { email } = req.body;  

    const queryBuscar = `SELECT * FROM usuarios WHERE email = ?`;  
    db.query(queryBuscar, [email], (err, result) => {  
        if (err) {  
            console.error('Error al buscar el usuario:', err);  
            return res.status(500).json({ message: 'Error interno al buscar el usuario' });  
        }  

        if (result.length === 0) {  
            return res.status(404).json({ message: 'Usuario no encontrado' });  
        }  

        res.status(200).json(result[0]); // Retornar la información del usuario encontrado  
    });  
});  

// Ruta para registrar el ingreso de un vehículo  
app.post('/ingreso-vehiculo', (req, res) => {  
    const { patente, hora_ingreso } = req.body;  
    // Aquí puedes insertar el ingreso del vehículo en la base de datos  
    res.status(200).json({ message: 'Vehículo ingresado con éxito' });  
});  

// Ruta para registrar la salida de un vehículo  
app.post('/salida-vehiculo', (req, res) => {  
    const { patente, hora_salida } = req.body;  
    // Aquí puedes actualizar el estado del vehículo en la base de datos  
    res.status(200).json({ message: 'Vehículo salido con éxito' });  
});  

// Ruta para obtener el historial de vehículos  
app.get('/historial-vehiculos', (req, res) => {  
    const query = 'SELECT patente, hora_ingreso, hora_salida FROM transacciones';  
    db.query(query, (err, results) => {  
        if (err) {  
            return res.status(500).json({ message: 'Error al obtener el historial', error: err });  
        }  
        res.status(200).json({ message: 'Historial de vehículos', data: results });  
    });  
});  

// Ruta para cerrar la caja  
app.post('/cerrar-caja', (req, res) => {  
    const { total_recaudado } = req.body;  
    // Aquí puedes registrar el cierre de caja en la base de datos  
    res.status(200).json({ message: 'Caja cerrada con éxito' });  
});  

// Ruta para guardar la ubicación del trabajador al iniciar sesión  
app.post('/guardar-ubicacion', (req, res) => {  
    const { id_usuario, latitud, longitud } = req.body;  

    const queryGuardarUbicacion = `  
        INSERT INTO ubicaciones (id_usuario, latitud, longitud, fecha)  
        VALUES (?, ?, ?, ?)  
    `;  
    
    const fecha = new Date(); // Obtener la fecha actual  

    db.query(queryGuardarUbicacion, [id_usuario, latitud, longitud, fecha], (err, result) => {  
        if (err) {  
            console.error('Error al guardar la ubicación:', err);  
            return res.status(500).json({ message: 'Error al guardar la ubicación' });  
        }  
        res.status(200).json({ message: 'Ubicación guardada con éxito' });  
    });  
});  

// NUEVA RUTA: Obtener ubicaciones de los trabajadores  
app.get('/ubicaciones-trabajadores', (req, res) => {  
    const query = 'SELECT * FROM ubicaciones'; // Cambia esto según la estructura de tu tabla  
    db.query(query, (err, results) => {  
        if (err) {  
            console.error('Error al obtener ubicaciones:', err);  
            return res.status(500).json({ message: 'Error al obtener ubicaciones' });  
        }  
        res.status(200).json(results);  
    });  
});  

// Puerto donde corre el servidor  
const PORT = process.env.PORT || 3001;  
app.listen(PORT, () => {  
    console.log(`Servidor corriendo en el puerto ${PORT}`);  
});