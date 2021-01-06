// const mysql = require('mysql');

// let pool = mysql.createPool({
//     host: process.env.MYSQL_HOST,
//     user: process.env.MYSQL_USER,
//     port: process.env.MYSQL_PORT,
//     password: process.env.MYSQL_PASSWORD,
//     database: process.env.MYSQL_DATABASE,
//     connectionLimit: 30,
//     dateStrings: 'date'
// });

// function getConnection(callback) {
//     pool.getConnection(function(error, conn) {
//         callback(error, conn);
//     });
// }

// module.exports = getConnection;

const mysql = require('mysql2');
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    port: process.env.MYSQL_PORT,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 30,
    dateStrings: 'date'
});
const promisePool = pool.promise();
module.exports = promisePool;