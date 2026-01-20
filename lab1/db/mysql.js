const mysql = require('mysql2');

const pool = mysql.createPool({
    host: '127.0.0.1', // Nên dùng IP này thay vì localhost
    user: 'root',
    password: 'sapassword', // Mật khẩu bạn đã đặt trong Docker
    database: 'shopdb',
    port: 3308, // <--- Nên thêm dòng này cho rõ ràng
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
