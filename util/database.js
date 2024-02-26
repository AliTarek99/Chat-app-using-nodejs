const db = require('mysql2');

const pool = db.createPool({
    host: 'localhost',
    user: 'root',
    database: 'chatting_app',
    password:'0000'
});

module.exports = pool.promise();