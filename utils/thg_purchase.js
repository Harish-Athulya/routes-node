var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : '162.241.123.158',
    user     : 'theatgg6_flutter',
    password : '=sO%KCwGZQYn',
    database : 'theatgg6_cms',
    timezone : "+00:00",
    multipleStatements: true
});

connection.connect();

console.log('thg_purchase db connected...');

/* connection.query('SELECT * FROM paymentdetails', function(err, rows, fields) {
    if(err) throw err;
    console.log(rows[0]);
})
 */

module.exports = connection