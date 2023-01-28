var express = require('express');
var bodyParser = require('body-parser');
const thgmain = require('./utils/thg_mysql');
const thgflutter = require('./utils/thg_flutter');
const date = require('date-and-time');
const nodemysql = require('node-mysql');
const PORT = process.env.PORT || 5000;

// var client_expense = require('./router/client_expense.js');

var app = express();

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.json());



// app.use(bodyParser.json({limit: '50mb', extended: true}));
// app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
// app.use(bodyParser.text({ limit: '200mb' }));



// app.use('expense/client', client_expense);

app.get("/", (req, res)  => {
    res.send("ASL Test Router");
});

app.post("/login/validate", function(req, res) {
    console.log('receiving data...');
    var eid = req.body.employeeid;
    var epwd = req.body.password;
    
    var selectQuery = `SELECT * FROM users WHERE emp_id = '${eid}' and password = '${epwd}'`;
    
    thgflutter.query(selectQuery, (err, results, fields) => {
        if(err) {
            console.log(err);
        } 
        else {
            var obj = {};      
            obj['data'] = {};
            
            if(results[0] == null) {
                obj['message'] = "Failure";
                obj['data']['employeeid'] = req.body.employeeid;
                obj['data']['dept'] = 'Invalid';
                obj['data']['name'] = 'Invalid';
            }
            else {
                obj['message'] = "Success";
                obj['data']['employeeid'] = req.body.employeeid;
                obj['data']['dept'] = results[0].department;
                obj['data']['name'] = results[0].name;
            }
            res.send(obj);       
        }
    })    
});

app.post("/login/id", (req, res) => {
    var eid = req.body.employeeid;

    console.log(eid);

    var selectQuery = `SELECT * FROM users WHERE emp_id = '${eid}'`;
    thgflutter.query(selectQuery, (err, results, fields) => {
        var object = {};
        if(err) {
            console.log(err);
        }
        else {
            if(results[0] == null) {
                object['status'] = "Invalid";
                object['name'] = "Invalid";
                object['dept'] = "Invalid";
            }
            else {
                object['status'] = "Success";
                object['name'] = results[0].name;
                object['dept'] = results[0].department;
                console.log(results[0]);
            }
        }
        res.send(object);
    });
});

var totalRooms;
var occupiedRooms;
var vacantRooms;

function setTotalRooms(value) {
    totalRooms = value[0].total;
    console.log(totalRooms);
    return totalRooms;
}

function setOccupiedRooms(value) {
    occupiedRooms = value[0].ocp;
    console.log(occupiedRooms);
    return occupiedRooms;
}

function getVacantRooms() {
    vacantRooms = totalRooms - occupiedRooms;
    console.log(vacantRooms);
    return vacantRooms;
}

app.get("/occupancy/count", (req, res) => {
    var totalQuery = `SELECT COUNT(*) AS total FROM master_beds mb WHERE mb.room_id IN(SELECT mr.id FROM master_rooms mr)`;
    var ocpQuery = `SELECT COUNT(*) AS ocp from patient_schedules ps where ps.patient_id in (select DISTINCT(patient_id) from leads) and ps.status!='Cancelled' and ps.schedule_date=curdate()`;

    var total;
    var occupied;

    thgmain.query(totalQuery, (err, results, fields) => {
        if(err) {
            console.log(err);   
            var data = {};
            data['ack'] = 'failure';
            res.send(data);
        }
        else {
            totalRooms = results[0].total;
            total = setTotalRooms(results);
        }
    });
    
    
    thgmain.query(ocpQuery, (err, results, fields) => {
        if(err) {
            console.log(err);   
            var data = {};
            data['ack'] = 'failure';
            res.send(data);
        }
        else {
            occupied = setOccupiedRooms(results);
            var data = {};
            data['total'] = total;
            data['occupied'] = occupied;
            data['vacant'] = getVacantRooms();

            res.send(data);
        }

    });

});

var branchTotal;
var branchOcp;
var branchVacant;

function setBranchCount(value) {
    branchTotal = value;
    return branchTotal;
}

function setOccupiedCount(value) {
    branchOcp = value;
    return branchOcp;
}

app.get("/occupancy/count/:id", (req, res) => {
    var branch = req.params.id;
    var branch_id;
    
    switch (branch) {
        case "Perungudi":
            branch_id = 1;
            break;
        case "Arumbakkam":
            branch_id = 2;
            break;
        case "Neelankarai":
            branch_id = 3;
            break;
        case "Pallavaram":
            branch_id = 4;
            break;
        case "Kasavanahalli":
            branch_id = 5;
            break;
        default:
            branch_id = 999;
            break;
    }

    if(branch_id == 999) {
        // throw "Invalid Branch Name";
        var data = {};
        data['ack'] = 'Failure';
        data['error'] = 'Invalid Branch Name';
        res.send(data);
    } 

    var branchCountQuery = `SELECT COUNT(*) AS branch_count FROM master_rooms WHERE branch_id = ${branch_id}`;
    var branchOccupiedQuery = `SELECT COUNT(*) AS ocp_count from patient_schedules ps where ps.patient_id in (select DISTINCT(patient_id) from leads WHERE branch_id = ${branch_id}) and ps.status!='Cancelled' and ps.schedule_date=curdate()`;

    
    thgmain.query(branchCountQuery, (err, results, fields) => {
        if(err) {
            console.log(err);
            var data = {};
            data['ack'] = 'Failure';
            data['error'] = 'SQL Error';
            res.send(data);
        } 
        else {
            branchTotal = setBranchCount(results[0].branch_count);
            console.log(branchTotal);            
        }        
    });
    
    thgmain.query(branchOccupiedQuery, (err, results, fields) => {
        if(err) {
            console.log(err);
            var data = {};
            data['ack'] = 'Failure';
            data['error'] = 'SQL Error';
        }
        else {
            branchOcp = setOccupiedCount(results[0].ocp_count);
            console.log(branchOcp);
    
            var data = {};
            data["branch"] = branch;
            data["total"] = branchTotal;
            data["occupied"] = branchOcp;
            data["vacant"] = branchTotal - branchOcp;
            res.send(data);
        } 
    });
})

app.post("/expense/client/:service", (req, res) => {
    var service = req.params.service;

    var fromDate = req.body.fromDate;
    var toDate = req.body.toDate;

    var extra_service = `SELECT l.branch_id, SUM(extra_service.extra_service_rate) SERVICE_COST FROM (SELECT * FROM patient_activity_staff_extra_service WHERE deleted_at IS NULL) extra_service JOIN ( SELECT * FROM leads WHERE status = 'Ongoing') l ON extra_service.patient_id = l.patient_id JOIN patients pp ON pp.id = extra_service.patient_id WHERE extra_service.schedule_date BETWEEN '${fromDate}' AND '${toDate}' GROUP BY 1`;
    var procedure_service = `SELECT l.branch_id, SUM(procedure_service.procedure_service_rate) SERVICE_COST FROM (SELECT * FROM patient_activity_procedure_service WHERE deleted_at IS NULL) procedure_service JOIN ( SELECT * FROM leads WHERE status = 'Ongoing') l ON procedure_service.patient_id = l.patient_id JOIN patients pp ON pp.id = procedure_service.patient_id WHERE procedure_service.schedule_date BETWEEN '${fromDate}' AND '${toDate}' GROUP BY 1`;
    var equipment_service = `SELECT l.branch_id, SUM(med_equip_services.medical_equipment_rate) SERVICE_COST FROM (SELECT * FROM patient_activity_medical_euipments WHERE deleted_at is null and schedule_date BETWEEN '${fromDate}' AND '${toDate}') med_equip_services JOIN (SELECT * FROM leads WHERE STATUS = 'Ongoing') l ON med_equip_services.patient_id = l.patient_id JOIN patients pp ON pp.id = med_equip_services.patient_id GROUP BY 1`;
    var food_service = `SELECT l.branch_id, sum(food_activity.fb_amount) SERVICE_COST FROM (SELECT * FROM patient_activity_fb WHERE deleted_at IS NULL and schedule_date BETWEEN '${fromDate}' AND '${toDate}') food_activity JOIN (SELECT * FROM leads WHERE STATUS = 'Ongoing') l ON food_activity.patient_id = l.patient_id GROUP BY 1`;
    var emergency_service = `SELECT l.branch_id, SUM(emergency_service.emergency_care_amount) SERVICE_COST FROM (SELECT * FROM patient_activity_medical_emergency_care WHERE deleted_at is null and schedule_date BETWEEN '${fromDate}' AND '${toDate}') emergency_service JOIN (SELECT * FROM leads WHERE STATUS = 'Ongoing') l ON emergency_service.patient_id = l.patient_id GROUP BY 1`;
    var advance_service = `SELECT l.branch_id, SUM(advance_activity.activity_rate) SERVICE_COST FROM (SELECT * FROM patient_activity_advance WHERE deleted_at IS NULL AND schedule_date BETWEEN '${fromDate}' AND '${toDate}') advance_activity JOIN (SELECT * FROM leads WHERE status='Ongoing') l ON advance_activity.patient_id = l.patient_id JOIN patients pp ON pp.id = advance_activity.patient_id GROUP BY 1`;

    var requested_service;

    switch (service) {
        case 'extra':
            requested_service = extra_service;
            break;
        case 'procedure':
            requested_service = procedure_service;
            break;
        case 'equipment':
            requested_service = equipment_service;
            break;
        case 'food':
            requested_service = food_service;
            break;
        case 'emergency':
            requested_service = emergency_service;
            break;
        case 'advance':
            requested_service = advance_service;
            break;
    
        default:
            res.send("Invalid resource");
            break;
    }


    thgmain.query(requested_service, (err, results, fields) => {
        console.log(results)
        var data = {};
        if(err) {
            console.log(err);
            data['message'] = "Error";
            data['error'] = "SQL Error";
            res.send(data);
        }
        else {
            var amount = {};
            
            data["service"] = service+"_service";
            data["message"] = "Success";
            amount = initPrice(amount);            
            amount = setPrice(amount, results);            
            data["amount"] = amount;
            res.send(data);
        }
    });


    // res.send(data);
});



function initPrice(amount) {

    amount["perungudi"] = "No records";
    amount["arumbakkam"] = "No records";
    amount["neelankarai"] = "No records";
    amount["pallavaram"] = "No records";
    amount["kasavanahalli"] = "No records";

    return amount;
}

function setPrice(amount, results) {
    
    for(let i=0; i<results.length; i++) {
        branch = results[i].branch_id;

        // console.log(results[i].branch_id);

        switch(branch) {
            case 1:
                amount["perungudi"] = results[i].SERVICE_COST
                break;
            case 2:
                amount["arumbakkam"] = results[i].SERVICE_COST
                break;
            case 3:
                amount["neelankarai"] = results[i].SERVICE_COST
                break;
            case 4:
                amount["pallavaram"] = results[i].SERVICE_COST
                break;
            case 5:
                amount["kasavanahalli"] = results[i].SERVICE_COST
                break;
            default:
                break;
        }
    }
    return amount;
}

app.get("/expense/request", (req, res) => {
    // var testQuery = `SELECT et.req_id, users.full_name "Requestor_Name", et.amount, et.purpose, et.req_date, et.status FROM (SELECT * FROM expense_track) et JOIN (SELECT * FROM users) users on et.user_id = users.id ORDER BY RAND() LIMIT 5;`;
    var expenseQuery = `SELECT et.req_id, user.full_name "Requestor_Name", et.dept, et.amount, et.purpose, et.req_date, et.status FROM (SELECT * FROM expense_track) et JOIN (SELECT u.id, u.full_name FROM (SELECT * FROM expense_users) eu JOIN (SELECT * FROM users) u ON eu.user_id = u.id) user on et.user_id = user.id`;

    thgmain.query(expenseQuery, (err, results, fields) => {
        if(err) {
            console.log(err);   
            var data = {};
            data['ack'] = 'failure';
            res.send(data);
        }
        else {
            var data = {};
            data['ack'] = 'success';
            data['info'] = results;
            console.log(data);
            res.send(data);
        }
    });
});

app.get("/expense/request", (req, res) => {
    // var testQuery = `SELECT et.req_id, users.full_name "Requestor_Name", et.amount, et.purpose, et.req_date, et.status FROM (SELECT * FROM expense_track) et JOIN (SELECT * FROM users) users on et.user_id = users.id ORDER BY RAND() LIMIT 5;`;
    // var testQuery = `SELECT et.req_id, users.full_name "Requestor_Name", et.amount, et.purpose, et.req_date, et.status FROM (SELECT * FROM expense_track) et JOIN (SELECT * FROM users) users on et.user_id = users.id`;
    // var expenseQuery = `SELECT et.req_id, user.full_name "Requestor_Name", et.dept, et.amount, et.purpose, et.created_at req_date, et.approved_at, et.ack_at, et.transfer_at, et.received_at, et.status FROM (SELECT * FROM expense_track) et JOIN (SELECT u.id, u.full_name FROM (SELECT * FROM expense_users) eu JOIN (SELECT * FROM users) u ON eu.user_id = u.id) user on et.user_id = user.id ORDER BY req_date desc`
    var listQuesy = `SELECT et.req_id, user.full_name "Requestor_Name", et.dept, et.amount, et.purpose, et.created_at req_date, et.approved_at, et.ack_at, et.transfer_at, et.received_at, et.status FROM (SELECT * FROM expense_track) et JOIN (SELECT u.id, u.full_name FROM (SELECT * FROM expense_users) eu JOIN (SELECT * FROM users) u ON eu.user_id = u.id) user on et.user_id = user.id ORDER BY req_date desc`


    thgmain.query(listQuesy, (err, results, fields) => {
         if(err) {
            console.log(err);   
            var data = {};
            data['ack'] = 'failure';
            res.send(data);
        }
        else {
            var data = {};
            data['ack'] = 'success';
            data['info'] = results;
            console.log(data);
            res.send(results);
        } 
    });
});


app.get("/expense/request/count/:status", (req, res) => {
    var status = req.params.status;
    
    var valid;
    
    switch (status) {
        case 'Pending':
            valid = 1;
            break;
            case 'Approved':
                valid = 1;
                break;
                case 'Acknowledged':
                    valid = 1;
                    break;
                    case 'Transferred':
                        valid = 1;
                        break;
                        case 'Received':
                            valid = 1;
                        break;
                        default:
                            valid = 0;
                            break;
                        }
            var data = {};
            
            if(valid == 0) {
                data['ack'] = 'failure';
                data['status'] = 'Invalid status entered';
                console.log(data);
                res.send(data);
            }
    
    else {
        var statusCount = `SELECT status, COUNT(*) TOTAL FROM expense_track WHERE status = '${status}' GROUP BY 1`;
    
        thgmain.query(statusCount, (err, results, fields) => {
            if(err) {
                console.log(err);   
                // var data = {};
                data['ack'] = 'failure';
                data['status'] = 'SQL error';
                console.log(data);
                res.send(data);
            }
            else {
                // var data = {};
                data['ack'] = 'success';
                if(results[0] == null) {
                    data['status'] = 0;
                }
                else {
                    data['status'] = results[0].TOTAL;
                }
                console.log(data);
                res.send(data);
            }
        });
    }
});

app.post("/expense/request/approve", function(req, res) {
    console.log('receiving id...');
    var req_id = req.body.req_id;
    var status = req.body.status;
    var eid = req.body.eid;

    var column;

    switch(status) {
        case 'Approved':
            column = 'approved_at';
            break;
            case 'Acknowledged':
                column = 'ack_at';
                break;
                case 'Transferred':
                    column = 'transfer_at';
            break;
        case 'Received':
            column = 'received_at';
            break;
        }
        
        
        console.log(req_id);
        
    // const now = date.format(date.addMinutes(date.addHours(new Date(), 5),30), 'YYYY-MM-DD HH:mm:ss');   
    const now = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');   


    // var selectQuery = `SELECT * FROM users WHERE emp_id = '${eid}' and password = '${epwd}'`;
    var update_query = `UPDATE expense_track SET status='${status}', ${column}='${now}', ack_by='${eid}'  WHERE req_id = '${req_id}'`;
    
    var data = {};      
    

    thgmain.query(update_query, (err, results, fields) => {
        if(err) {
            console.log(err);
            data['ack'] = "Failure";
            data['message'] = "SQL error";
        } 
        else {
            console.log(results);
            data['ack'] = "Success";
            data['message'] = "Status updated"
        }
        res.send(data);       
    })    
});

app.post("/expense/request/clarity", (req, res) => {
    var req_id = req.body.req_id;
    var eid = req.body.eid;

    const now = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');   
    
    var clarityQuery = `INSERT INTO expense_clarity (req_id, user_id, clarity, created_at) VALUES('${req_id}', '${eid}', 'Explain in detail', '${now}')`
    
    thgmain.query(clarityQuery, (err, results, fields) => {
        if(err) {
            console.log(err);   
            var data = {};
            data['ack'] = 'failure';
            res.send(data);
        }
        else {
           var data = {};
           data['ack'] = 'success';
           data['info'] = results;
           console.log(clarityQuery);
           res.send(data);
        } 
    });
    
    
})

app.get('/expense/request/list', (req,res) => {
    
    var expenseQuery = `SELECT et.req_id, user.full_name "Requestor_Name", et.dept, et.amount, et.purpose, et.created_at req_date, et.approved_at, et.ack_at, et.transfer_at, et.received_at, et.status FROM (SELECT * FROM expense_track) et JOIN (SELECT u.id, u.full_name FROM (SELECT * FROM expense_users) eu JOIN (SELECT * FROM users) u ON eu.user_id = u.id) user on et.user_id = user.id ORDER BY req_date desc`
    
    thgmain.query(expenseQuery, (err, results, fields) => {
        if(err) {
            console.log(err);   
            var data = {};
            data['ack'] = 'failure';
            res.send(data);
        }
        else {
            var data = {};
            data['ack'] = 'success';
            data['info'] = results;
            console.log(data);
            res.send(data);
        } 
    }) 
});

app.post('/food/update', (req,res) => {

    var branch = req.body.branch;
    var food_date = req.body.food_date;
    var food_time = req.body.food_time;
    var food_type = req.body.food_type;
    var image_name = req.body.image_name;
    var created_by = req.body.created_by;
    var image_blob = req.body.image_blob;
    var menu_items = req.body.menu_items;
    
    // const now = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');   

    var insertQuery = `INSERT INTO food_tracker (branch, food_date, food_time, food_type, image_name, created_by, menu_items, image_blob) VALUES ('${branch}', STR_TO_DATE('${food_date}', '%d/%m/%Y'), STR_TO_DATE('${food_time}', '%H:%i'), '${food_type}', '${image_name}', '${created_by}', '${menu_items}', '${image_blob}')`;
    
    var data = {};
    // console.log(req.body);

    thgmain.query(insertQuery, (err, results, fields) => {
        if(err) {
            console.log(err);
            data['ack'] = 'Failure';
            res.send(data);
        }
        else {
            console.log(results);
            data['ack'] = 'Success';
            // data['info'] = results;
            res.send(data);
        }
    });
    
});

app.post('/food/getupdate', (req,res) => {
    var branch = req.body.branch;
    var food_date = req.body.food_date;
    var food_type = req.body.food_type;

    var selectQuery = `SELECT menu_items, food_time, image_blob, created_at FROM food_tracker WHERE branch = '${branch}' AND food_date = STR_TO_DATE('${food_date}', '%d/%m/%Y') AND food_type='${food_type}' ORDER BY 2 DESC`;
    
    var data = {};

    thgmain.query(selectQuery, (err, results, fields) => {
        if(err) {
            console.log(err);
            data['ack'] = 'Failure';
            res.send(data);
        }
        else {
            // console.log(results);
            data['ack'] = 'Success';
            // data['info'] = results[0];
            if(results[0] == null) {
                data['info'] = 'No records available';
            } else {
                console.log(results[0].image_blob);
                // data['info'] = results;
                data['menu_items'] = results[0].menu_items;
                data['created_at'] = results[0].created_at;

                // var buffer = results[0].image_blob;
                // var bufferBase64 = buffer.toString('base64');
                
                // var buffer = new Buffer( blob );
                // var bufferBase64 = buffer.toString('base64');

                var buffer_data = results[0].image_blob;
                // var buf = Buffer.from(buffer_data);                
                
                // data['image_blob'] = buf;

                // console.log(buffer_data);
                
                var buffer = new Buffer.from(buffer_data);
                // var bufferBase64 = buffer.toString('base64');

                // const b = Buffer.from(buffer);
                // console.log(b.toString());

                // data['image_blob'] = buffer_data[1];
                data['image_blob'] = buffer.toString();
                data['food_time'] = results[0].food_time;


            }
            res.send(data);
        }
    });    
})

app.post('/login/reset', (req, res) => {
    var eid = req.body.eid;
    var oldpwd = req.body.oldpwd;
    var newpwd = req.body.newpwd;

    var idQuery = `SELECT COUNT(emp_id) FROM app_users WHERE emp_id='${eid}'`;
    console.log('Athulya');
    
    var data = {};
    
    thgmain.query(idQuery, (err, results, fields) => {
        if(err) {
            console.log(err);
            data['ack'] = 'failure';
            data['reason'] = 'DB error';
            res.send(data);
        }
        else {
            var count = (results[0]);
            if(count == 0) {
                console.log(count);
                data['ack'] = 'failure';
                data['reason'] = 'Invalid employee ID';
                res.send(data);
            }
            else {
                var pwdQuery = `SELECT password FROM app_users WHERE emp_id='${eid}'`;
                // data['ack'] = 'success';
                // data['reason'] = 'Correct employee ID';
                thgmain.query(pwdQuery, (err, results, fields) => {
                    var dbPwd = results[0].password;
                    
                    if(dbPwd != oldpwd) {
                        // console.log(dbPwd);
                        data['ack'] = 'failure';
                        data['reason'] = 'Incorrect password provided';
                        res.send(data);
                    }
                    else {
                        var updateQuery = `UPDATE app_users SET password = '${newpwd}' WHERE emp_id='${eid}'`;
                        thgmain.query(updateQuery, (err, results, fields) => {
                            data['ack'] = 'success';
                            data['reason'] = 'Password updated';
                            res.send(data);
                            // break;
                        })
                        
                    }
                })
            }

        }
    })    
})



app.listen(PORT, (err) => {
    if(err) console.log(err);
    console.log("Server listening on", PORT);
});