var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : '216.10.240.89',
    user     : 'athul9z1_app',
    password : '?pY=2N^ndvAw',
    database : 'athul9z1_cms',
    port : 2083,
});

connection.connect();

console.log('thg_purchase db connected...');

/* connection.query('SELECT * FROM paymentdetails', function(err, rows, fields) {
    if(err) throw err;
    console.log(rows[0]);
})
 */

module.exports = connection