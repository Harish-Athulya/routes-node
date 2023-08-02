var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'root',
    password : '',
    database : 'theatgg6_sal_subscriber102',
});

connection.connect();

console.log('local db connected...');

module.exports = connection