var express = require('express');
var bodyParser = require('body-parser');
const router = express.Router();
var app = express();


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.get("expense/client", (req, res) => {
    res.send("Client router");
});

app.get("/", (req, res) => {
    res.send("Root Client router");
});


module.exports = app;
