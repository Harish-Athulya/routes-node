var express = require('express');
var bodyParser = require('body-parser');
const thgmain = require('./utils/thg_mysql');
const thgflutter = require('./utils/thg_flutter');
const PORT = process.env.PORT || 3000;

// var client_expense = require('./router/client_expense.js');

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// app.use('expense/client', client_expense);

app.get("/", (req, res)  => {
    res.send("ASL Test Router");
});

app.get("/expense/client/service", (req, res) => {

    var procedure_service = "SELECT l.branch_id, SUM(procedure_service.procedure_service_rate) SERVICE_COST FROM (SELECT * FROM `patient_activity_procedure_service` WHERE deleted_at IS NULL) procedure_service JOIN ( SELECT * FROM leads WHERE status = 'Ongoing') l ON procedure_service.patient_id = l.patient_id JOIN patients pp ON pp.id = procedure_service.patient_id WHERE procedure_service.schedule_date BETWEEN '2022-10-25' AND '2022-11-24' GROUP BY 1";

    thgmain.query(procedure_service, function (error, results, fields) {
        var data = {};
        if(error) {
            console.log(error);
            data["ack"] = "Error";
            res.send(data);
        }
        else {
            console.log(results);
            var amount = {};
            data["ack"] = "Success";
            amount["Perungudi"] = results[0].SERVICE_COST;
            amount["Arumbakkam"] = results[1].SERVICE_COST;
            amount["Neelankarai"] = results[2].SERVICE_COST;
            amount["Pallavaram"] = results[3].SERVICE_COST;
            data["amount"] = amount;
            res.send(data);
        }
    })

});


app.listen(PORT, (err) => {
    if(err) console.log(err);
    console.log("Server listening on", PORT);
});



