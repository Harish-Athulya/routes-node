var express = require('express');
var bodyParser = require('body-parser');
const thgmain = require('./utils/thg_mysql');
const thgflutter = require('./utils/thg_flutter');
const date = require('date-and-time');
const nodemysql = require('node-mysql');
const PORT = process.env.PORT || 5000; 
const thgpurchase = require('./utils/thg_purchase');
var cron = require('node-cron');


// var client_expense = require('./router/client_expense.js');

var app = express();

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.json());

app.get("/", (req, res)  => {
    console.log("ATHarish");
    res.send("ASL Test Router");
});

app.post("/login/validate", function(req, res) {
    console.log('receiving data...');
    var eid = req.body.employeeid;
    var epwd = req.body.password;
    
    var selectQuery = `SELECT * FROM app_users WHERE emp_id = '${eid}' and password = '${epwd}'`;
    
    thgmain.query(selectQuery, (err, results, fields) => {
        if(err) {
            console.log(err);
            obj['message'] = "Failure";
            obj['data']['employeeid'] = req.body.employeeid;
            obj['data']['dept'] = 'Invalid';
            obj['data']['name'] = 'Invalid';
            obj['data']['location'] = 'Invalid';
        } 

        else {
            var obj = {};      
            obj['data'] = {};
            console.log(results);
            
            if(results[0] == null) {
                obj['message'] = "Failure";
                obj['data']['employeeid'] = req.body.employeeid;
                obj['data']['dept'] = 'Invalid';
                obj['data']['name'] = 'Invalid';
                obj['data']['location'] = 'Invalid';
            }
            else {
                obj['message'] = "Success";
                obj['data']['employeeid'] = req.body.employeeid;
                obj['data']['dept'] = results[0].department;
                obj['data']['name'] = results[0].name;
                obj['data']['location'] = results[0].location;
            }
            res.send(obj);       
        }
    })    
});

app.post("/newlogin/validate", function(req, res) {
    console.log('receiving data...');
    var eid = req.body.employeeid;
    var epwd = req.body.password;
    
    var selectQuery = `SELECT * FROM app_users WHERE emp_id = '${eid}' and password = '${epwd}'`;
    
    thgmain.query(selectQuery, (err, results, fields) => {
        if(err) {
            console.log(err);
            obj['message'] = "Failure";
            obj['data']['employeeid'] = req.body.employeeid;
            obj['data']['dept'] = 'Invalid';
            obj['data']['name'] = 'Invalid';
        } 

        else {
            var obj = {};      
            obj['data'] = {};
            console.log(results);
            
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

    var selectQuery = `SELECT * FROM app_users WHERE emp_id = '${eid}'`;
    thgmain.query(selectQuery, (err, results, fields) => {
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

var totalBeds;
var occupiedBeds;
var vacantBeds;

function setTotalRooms(value) {
    totalRooms = value;
    console.log(totalRooms);
    // return totalRooms;
}

function setVacantRooms(value) {
    vacantRooms = value;
    console.log(vacantRooms);
    // return vacantRooms;
}

function setTotalBeds(value) {
    totalBeds = value;
    console.log(totalBeds);
    // return totalBeds;
}

function setOccupiedBeds(value) {
    occupiedBeds = value;
    console.log(occupiedBeds);
    // return occupiedBeds;
}

app.get("/occupancy/count", (req, res) => {

    var totalQuery = `SELECT COUNT(distinct room_number) AS total FROM master_beds mb join master_rooms mr on mb.room_id=mr.id WHERE mb.status='Active'`;
    var vacantQuery = `SELECT COUNT(*) AS vacantRooms from master_beds join master_rooms on master_beds.room_id=master_rooms.id and master_beds.status='Active' and master_beds.id not in (select bed_id from patient_schedules where schedule_date=curdate() and patient_id in(select id from patients) and status!='Cancelled')`;


    var totalBedsQuery = `SELECT count(mb.bed_number) AS totalbeds FROM master_beds mb join master_rooms mr on mb.room_id=mr.id where mb.status='Active'`;
    var ocpBedsQuery = `SELECT COUNT(*) AS ocpbeds from patient_schedules join master_beds on patient_schedules.bed_id=master_beds.id join master_rooms on master_rooms.id=master_beds.room_id join patients on patients.id=patient_schedules.patient_id where schedule_date=curdate() and patient_schedules.status!='Cancelled'`;

    var data = {};

    
    thgmain.query(totalQuery, (err, results, fields) => {
        if(err) {
            data["ack"] = "Failure";
            data["reason"] = "DB Error";
            res.send(data);
        }
        else {
            // branch_count = results[0].total;
            // console.log(branch_count);
            setTotalRooms(results[0].total);
            console.log(totalRooms);
        }
    });
    
    thgmain.query(vacantQuery, (err, results, fields) => {
        if(err) {
            data["ack"] = "Failure";
            data["reason"] = "DB Error";
            res.send(data);
        }
        else {
            setVacantRooms(results[0].vacantRooms);
            console.log(vacantRooms);

            occupiedRooms = totalRooms - vacantRooms;

}
    });

     thgmain.query(totalBedsQuery, (err, results, fields) => {
        if(err) {
            data["ack"] = "Failure";
            data["reason"] = "Bed DB Error";
            res.send(data);
        }
        else {
            setTotalBeds(results[0].totalbeds);
            console.log(totalBeds);
        }
    });

     thgmain.query(ocpBedsQuery, (err, results, fields) => {
        if(err) {
            data["ack"] = "Failure";
            data["reason"] = "DB Error";
            res.send(data);
        }
        else {
            setOccupiedBeds(results[0].ocpbeds);
            console.log(occupiedBeds);

            vacantBeds = totalBeds - occupiedBeds; 

            data["totalRooms"] = totalRooms;
            data["occupiedRooms"] = occupiedRooms;
            data["vacantRooms"] = vacantRooms;
            data["totalBeds"] = totalBeds;
            data["occupiedBeds"] = occupiedBeds;
            data["vacantBeds"] = vacantBeds;

            res.send(data);
        }
    });

 });
var branchTotal;
var branchOcp;
var branchVacant;
var bedTotal;
var bedOcp;

function setBranchCount(value) {
    branchTotal = value;
    return branchTotal;
}

function setVacantCount(value) {
    branchVacant = value;
    return branchVacant;
}
function setBedTotalCount(value) {
    bedTotal = value;
    return bedTotal;
}

function setBedOccupiedCount(value) {
    bedOcp = value;
    return bedOcp;
}

app.get("/occupancy/count/:id", (req, res) => {
    var branch = req.params.id;
    var branch_id;
    var data = {};
    data["branch"] = branch;

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
        case "Kochi":
            branch_id = 7;
            break;
        case "Coimbatore":
            branch_id = 8;
            break;
        case "Maduravoyal":
            branch_id = 9;
            break;
        default:
            branch_id = 999;
            break;
    }

    if(branch_id == 999) {
        data["ack"] = "Failure";
        data["reason"] = "Invalid Branch";
        res.send(data);
    }

    var branchCountQuery = `SELECT COUNT(distinct room_number) AS branch_count FROM master_beds mb join master_rooms mr on mb.room_id=mr.id where mr.branch_id in (${branch_id}) and mb.status='Active'`;
    var branchVacantQuery = `SELECT COUNT(*) AS branch_vacant from master_beds join master_rooms on master_beds.room_id=master_rooms.id where master_rooms.branch_id=${branch_id} and master_beds.status='Active' and master_beds.id not in (select bed_id from patient_schedules where schedule_date=curdate() and patient_id in(select id from patients where branch_id=${branch_id}) and status!='Cancelled')`;

    var bedTotalQuery = `SELECT count(mb.bed_number) as Total_Beds FROM master_beds mb join master_rooms mr on mb.room_id=mr.id where mr.branch_id = ${branch_id} and mb.status='Active'`;
    var bedOcpQuery = `SELECT COUNT(*) AS Ocp_Beds from patient_schedules join master_beds on patient_schedules.bed_id=master_beds.id join master_rooms on master_rooms.id=master_beds.room_id join patients on patients.id=patient_schedules.patient_id where schedule_date=curdate() and patient_schedules.status!='Cancelled' and patients.branch_id = ${branch_id}`;

    var branch_count;
    var branch_vacant;
    var branch_ocp;

    var bed_total;
    var bed_ocp;
    var bed_vacant;

    thgmain.query(branchCountQuery, (err, results, fields) => {
        if(err) {
            data["ack"] = "Failure";
            data["reason"] = "DB Error";
            res.send(data);
        }
        else {
            branch_count = results[0].branch_count;
            console.log(branch_count);
        }
    });
    
    thgmain.query(branchVacantQuery, (err, results, fields) => {
        if(err) {
            data["ack"] = "Failure";
            data["reason"] = "DB Error";
            res.send(data);
        }
        else {
            branch_vacant = results[0].branch_vacant;
            console.log(branch_vacant);

            branch_ocp = branch_count - branch_vacant;
            data["total"] = branch_count;
            data["vacant"] = branch_vacant;
            data["occupied"] = branch_ocp;
            // res.send(data);
        }
    });

    thgmain.query(bedTotalQuery, (err, results, fields) => {
        if(err) {
            data["ack"] = "Failure";
            data["reason"] = "Bed DB Error";
            res.send(data);
        }
        else {
            bed_total = results[0].Total_Beds;
            console.log(bed_total);
            // data["beds"] = bed_total;
            // res.send(data);
        }
    });

     thgmain.query(bedOcpQuery, (err, results, fields) => {
        if(err) {
            data["ack"] = "Failure";
            data["reason"] = "DB Error";
            res.send(data);
        }
        else {
            bed_ocp = results[0].Ocp_Beds;
            console.log(bed_ocp);

            // branch_ocp = branch_count - branch_vacant;
            data["tbeds"] = bed_total;
            data["obeds"] = bed_ocp;
            bed_vacant = bed_total - bed_ocp;
            data["vbeds"] = bed_vacant;
            res.send(data);
        }
    });
});

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
        case 'Rejected':
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
    var isExpense = req.body.isExpense;

    var column;

    switch(status) {
        case 'Approved':
            column = 'approved_at';
            break;
        case 'Rejected':
            column = 'updated_at';
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
    console.log(status);
    console.log(eid);
        
    const now = date.format(date.addMinutes(date.addHours(new Date(), 5),30), 'YYYY-MM-DD', true);   

    if(isExpense) {
        var data = {};      
        var update_query = `UPDATE expense_track SET status='${status}', ${column}='${now}', ack_by='${eid}'  WHERE req_id = '${req_id}'`;
        
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
        });    
    }
    
    else {
        var data = {};
        var update_query = `UPDATE purchaserequest SET status='${status}', updated_at='${now}', ack_by='${eid}'  WHERE unique_id = '${req_id}'`;
        
        thgpurchase.query(update_query, (err, results, fields) => {
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
        });       
    }
});

app.post("/expense/request/clarity", (req, res) => {
    var req_id = req.body.req_id;
    var eid = req.body.eid;

    const now = date.format(date.addMinutes(date.addHours(new Date(), 5),30), 'YYYY-MM-DD', true);   
    
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
    
    var expenseQuery = `SELECT et.req_id, user.full_name "Requestor_Name", et.dept, et.amount, et.purpose, et.created_at req_date, et.approved_at, et.ack_at, et.transfer_at, et.received_at, et.updated_at updated_at, et.status FROM (SELECT * FROM expense_track) et JOIN (SELECT u.id, u.full_name FROM (SELECT * FROM expense_users) eu JOIN (SELECT * FROM users) u ON eu.user_id = u.id) user on et.user_id = user.id ORDER BY req_date desc`;
    
    thgmain.query(expenseQuery, (err, results, fields) => {
        if(err) {
            // console.log(err);   
            var data = {};
            data['ack'] = 'failure';
            res.send(data);
        }
        else {
            var data = {};
            data['ack'] = 'success';
            data['info'] = results;
            // console.log(data);
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
    
    // const now = date.format(date.addMinutes(date.addHours(new Date(), 5),30), 'YYYY-MM-DD', true);   

    const now = date.format(date.addMinutes(date.addHours(new Date(), 5),30), 'YYYY-MM-DD', true);   

    var data = {};

     
    var insertQuery = `INSERT INTO food_tracker (branch, food_date, food_time, food_type, image_name, created_by, menu_items, image_blob, created_at) VALUES ('${branch}', STR_TO_DATE('${food_date}', '%d/%m/%Y'), STR_TO_DATE('${food_time}', '%H:%i'), '${food_type}', '${image_name}', '${created_by}', '${menu_items}', '${image_blob}', '${now}')`;
    
    // console.log(req.body);

    thgmain.query(insertQuery, (err, results, fields) => {
        if(err) {
            console.log(err);
            data['ack'] = 'Failure';
            res.send(data);
        }
        else {
            console.log(results);
            // data['ack'] = 'Success';
            // data['info'] = results;
            // res.send(data);
        }
    });
 

    // data['ack'] = 'test';
    // res.send(data);

    console.log(branch.toLowerCase());
    console.log(food_date);
    console.log(food_type);

    var set_food = food_type.toLowerCase();


    var updateQuery = `UPDATE food_defaulters SET ${set_food} = '1' WHERE branch = '${branch}' and food_date = STR_TO_DATE('${food_date}', '%d/%m/%Y')`;
  
    thgmain.query(updateQuery, (err, results, fields) => {
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
                var buffer_data = results[0].image_blob;
                var buffer = new Buffer.from(buffer_data);
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

app.post('/ops/admission', (req,res) => {

    var branch = req.body.branch;
    var admission_date = req.body.admission_date;
    var admission_time = req.body.admission_time;
    var client_name = req.body.client_name;
    var room_number = req.body.room_number;
    var created_by = req.body.created_by;
    var image_blob = req.body.image_blob;
    
    // const now = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');   

    var insertQuery = `INSERT INTO admission_asl (branch, admission_date, admission_time, client_name, room_number, created_by, admission_image) VALUES ('${branch}', STR_TO_DATE('${admission_date}', '%d/%m/%Y'), STR_TO_DATE('${admission_time}', '%H:%i'), '${client_name}', '${room_number}', '${created_by}', '${image_blob}')`;
    
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

app.get("/ops/client/:branch", (req, res) => {

    var branch = req.params.branch;

    var selectQuery = `SELECT client_name FROM admission_asl WHERE branch = '${branch}'`;

    var data = {};
    var client = [];

    thgmain.query(selectQuery, (err, results, fields) => {
        if(err) {
            data['ack'] = 'failure';
            data['info'] = 'DB error';
            console.log(err);
            res.send(data);
        }
        else {
            data['ack'] = 'success';
            for(let i=0; i<results.length; i++) {
                client.push(results[i].client_name);
            }
            data['info'] = client;
            res.send(data);
        }
    })
});

app.get('/ops/validate/rooms', (req, res) => {
    var roomQuery = `SELECT room_number FROM admission_asl`;
    var data = {};

    thgmain.query(roomQuery, (err, results, fields) => {
        if(err) {   
            data['ack'] = "Failure";
            data['reason'] = "Query failure";
        }
        else {
            data['ack'] = "Success";
            data['records'] = results;
        }

        res.send(data);
    })
    
    
})

app.post('/expense/request/list', (req, res) => {

    var status = req.body.status;
    var isExpense = req.body.isExpense;

    var data = {};
    var valid;
    console.log(isExpense);

    console.log(`sending ${status}`);

    switch(status) {
        case 'Pending':
        case 'Approved':
        case 'Acknowledged':
        case 'Transferred':
        case 'Received':
        case 'Rejected':
            valid = 1;
            break;
        default:
            valid = 0;
            break;
    }

    if(valid == 0) {
        data['ack'] = 'Failure';
        data['reason'] = 'Invalid Status';
        res.send(data);
    }

    if(isExpense) 
    {
        var selectQuery = `SELECT et.req_id, user.full_name "Requestor_Name", et.dept, et.amount, et.purpose, et.created_at req_date, et.approved_at, et.ack_at, et.transfer_at, et.received_at, et.updated_at updated_at, et.status FROM (SELECT * FROM expense_track) et JOIN (SELECT u.id, u.full_name FROM (SELECT * FROM expense_users) eu JOIN (SELECT * FROM users) u ON eu.user_id = u.id) user on et.user_id = user.id WHERE et.status = '${status}' ORDER BY req_date desc`;
        thgmain.query(selectQuery, (err, results, fields) => {
            if(err) {
                data['ack'] = 'Failure';
                data['reason'] = 'DB Failure'
                res.send(data);
            }
            else {
                data['ack'] = 'Success';
                data['count'] = results.length;
                data['info'] = results;
                res.send(data);
            }
        });  
    }
    else {
        var selectQuery = `CREATE TEMPORARY TABLE IF NOT EXISTS tPurReq AS SELECT DISTINCT pro.req_id, pro.name "Requestor_Name", pro.department "dept", pro.price "amount", CONCAT(pro.equipment, " - Quantity- ", pro.qty) 'purpose', pro.req_date, pro.updated_at 'approved_at', pro.upAt 'ack_at', pd.created_at 'transfer_at', pd.updated_at 'received_at', pro.updated_at, IF(STRCMP(pd.status, "Item_Received") = 0, "Received", IF(STRCMP(pd.status, "payment_tranfered_waiting_for item_delivered")= 0, "Transferred", IF(STRCMP(pro.postate, "accounts_approved") = 0, "Acknowledged", IF(STRCMP(pro.prstate, "Approved") = 0, "Approved", IF(STRCMP(pro.prstate, "Rejected") = 0, "Rejected", "Pending"))))) "status" FROM (SELECT pr.id, pr.unique_id 'req_id', pr.price, pr.qty, pr.department, pr.equipment, pr.name, pr.status 'prstate' , po.status 'postate', pr.created_at 'req_date', pr.updated_at, po.updated_at "upAt" FROM purchaserequest pr LEFT JOIN purchaseorder po on pr.unique_id = po.unique_id) pro LEFT JOIN paymentdetails pd ON pro.req_id = pd.unique_id ORDER BY pro.id DESC; SELECT * FROM tPurReq WHERE status = '${status}';`;
        
        thgpurchase.query(selectQuery, (err, results, fields) => {
            if(err) {
                data['ack'] = 'Failure';
                data['reason'] = 'DB Failure'
                res.send(data);
            }
            else {
                data['ack'] = 'Success';
                data['count'] = results[1].length;
                data['info'] = results[1];
                res.send(data);
            }
        });  
    }
});

app.get('/purchase/request/count/:status', (req, res) => {
    
    var status = req.params.status;
    var valid;
    var statusQuery;
    var data = {}

    switch (status) {
        case 'Pending':
            valid = 1;
            statusQuery = "SELECT COUNT(pro.req_id) status_count FROM (SELECT pr.unique_id 'req_id', pr.status 'prstate' , po.status 'postate' FROM purchaserequest pr LEFT JOIN purchaseorder po on pr.unique_id = po.unique_id WHERE pr.status = 'request_pending') pro LEFT JOIN paymentdetails pd ON pro.req_id = pd.unique_id;"            
            break;    
        case 'Approved':
            valid = 1;
            statusQuery = "SELECT COUNT(pro.req_id) status_count FROM (SELECT pr.unique_id 'req_id', pr.status 'prstate' , po.status 'postate' FROM purchaserequest pr LEFT JOIN purchaseorder po on pr.unique_id = po.unique_id WHERE pr.status = 'Approved' AND po.status IS NULL) pro LEFT JOIN paymentdetails pd ON pro.req_id = pd.unique_id;"            
            break;    
        case 'Rejected':
            valid = 1;
            statusQuery = "SELECT COUNT(pro.req_id) status_count FROM (SELECT pr.unique_id 'req_id', pr.status 'prstate' , po.status 'postate' FROM purchaserequest pr LEFT JOIN purchaseorder po on pr.unique_id = po.unique_id WHERE pr.status = 'Rejected') pro LEFT JOIN paymentdetails pd ON pro.req_id = pd.unique_id;"
            break;    
        case 'Acknowledged':
            valid = 1;
            statusQuery = "SELECT COUNT(pro.req_id) status_count FROM (SELECT pr.unique_id 'req_id', pr.status 'prstate' , po.status 'postate' FROM purchaserequest pr LEFT JOIN purchaseorder po on pr.unique_id = po.unique_id WHERE pr.status = 'Approved' and po.status = 'accounts_approved') pro LEFT JOIN paymentdetails pd ON pro.req_id = pd.unique_id WHERE pd.status IS NULL;"
            break;    
        case 'Transferred':
            valid = 1;
            statusQuery = "SELECT COUNT(pro.req_id) status_count FROM (SELECT pr.unique_id 'req_id', pr.status 'prstate' , po.status 'postate' FROM purchaserequest pr LEFT JOIN purchaseorder po on pr.unique_id = po.unique_id WHERE pr.status = 'Approved' and po.status = 'accounts_approved') pro LEFT JOIN paymentdetails pd ON pro.req_id = pd.unique_id WHERE pd.status = 'payment_tranfered_waiting_for item_delivered';"
            break;    
        case 'Received':
            valid = 1;
            statusQuery = "SELECT COUNT(pro.req_id) status_count FROM (SELECT pr.unique_id 'req_id', pr.status 'prstate' , po.status 'postate' FROM purchaserequest pr LEFT JOIN purchaseorder po on pr.unique_id = po.unique_id WHERE pr.status = 'Approved' and po.status = 'accounts_approved') pro LEFT JOIN paymentdetails pd ON pro.req_id = pd.unique_id WHERE pd.status = 'Item_Received';"
            break;    
        default:
            valid = 0;
            break;
    }

    if(valid == 0) {
        data['ack'] = 'Failure';
        data['reason'] = 'Invalid status value';
        res.send(data);
    }
    
    else {
        thgpurchase.query(statusQuery, (err, results, fields) => {
            if(err) {
                data['ack'] = 'Failure';
                data['reason'] = 'SQL error';
                res.send(data);
            }
            else {
                data['ack'] = 'Success';
                data['status'] = results[0].status_count;
                res.send(data);
            }
        });
    }
    
});

app.post('/expense/request/multilist', (req, res) => {
    var arr = (req.query.array.split(',')); // array is a query parameter

    var isExpense = req.body.isExpense;

    var query_params = '';

    for(let i=0; i<arr.length; i++) {
        if(i == 0) {
            query_params += "'" + arr[i] + "'";
        }
        else {
            query_params += " or status = '" + arr[i] + "'";
        }
    }
    console.log(arr);
    var data = {};

    if(isExpense) {
        var selectQuery = `SELECT et.req_id, user.full_name "Requestor_Name", et.dept, et.amount, et.purpose, et.created_at req_date, et.approved_at, et.ack_at, et.transfer_at, et.received_at, et.updated_at updated_at, et.status FROM (SELECT * FROM expense_track) et JOIN (SELECT u.id, u.full_name FROM (SELECT * FROM expense_users) eu JOIN (SELECT * FROM users) u ON eu.user_id = u.id) user on et.user_id = user.id WHERE et.status = ${query_params} ORDER BY req_date desc`;
        // console.log(selectQuery);
        
        thgmain.query(selectQuery, (err, results, fields) => {
            if(err) {
                data['ack'] = 'Failure';
                data['reason'] = 'DB error'
                res.send(data);
            }        
            else {
                data['ack'] = 'Success';
                data['count'] = results.length;
                data['info'] = results;
                res.send(data);
            }
        });
    }
    else {
        var selectQuery = `CREATE TEMPORARY TABLE IF NOT EXISTS tPurReq AS SELECT DISTINCT pro.req_id, pro.name "Requestor_Name", pro.department "dept", pro.price "amount", CONCAT(pro.equipment, " - Quantity- ", pro.qty) 'purpose', pro.req_date, pro.updated_at 'approved_at', pro.upAt 'ack_at', pd.created_at 'transfer_at', pd.updated_at 'received_at', pro.updated_at, IF(STRCMP(pd.status, "Item_Received") = 0, "Received", IF(STRCMP(pd.status, "payment_tranfered_waiting_for item_delivered")= 0, "Transferred", IF(STRCMP(pro.postate, "accounts_approved") = 0, "Acknowledged", IF(STRCMP(pro.prstate, "Approved") = 0, "Approved", IF(STRCMP(pro.prstate, "Rejected") = 0, "Rejected", "Pending"))))) "status" FROM (SELECT pr.id, pr.unique_id 'req_id', pr.price, pr.qty, pr.department, pr.equipment, pr.name, pr.status 'prstate' , po.status 'postate', pr.created_at 'req_date', pr.updated_at, po.updated_at "upAt" FROM purchaserequest pr LEFT JOIN purchaseorder po on pr.unique_id = po.unique_id) pro LEFT JOIN paymentdetails pd ON pro.req_id = pd.unique_id ORDER BY pro.id DESC; SELECT * FROM tPurReq WHERE status = ${query_params};`;
        // console.log(selectQuery);
        thgpurchase.query(selectQuery, (err, results, fields) => {
            if(err) {
                data['ack'] = 'Failure';
                data['reason'] = 'DB error'
                console.log(err);
                res.send(data);
            }        
            else {
                data['ack'] = 'Success';
                data['count'] = results[1].length;
                data['info'] = results[1];
                res.send(data);
            }
        });
    }
});

app.post('/expense/request/datelist', (req, res) => {
    var fromDate = req.body.fromDate;
    var toDate = req.body.toDate;
    var isExpense = req.body.isExpense;

    console.log(fromDate);
    console.log(toDate);    
    var data = {};
    
    if(isExpense) {
        var selectQuery = `SELECT et.req_id, user.full_name "Requestor_Name", et.dept, et.amount, et.purpose, et.created_at req_date, et.approved_at, et.ack_at, et.transfer_at, et.received_at, et.updated_at updated_at, et.status FROM (SELECT * FROM expense_track) et JOIN (SELECT u.id, u.full_name FROM (SELECT * FROM expense_users) eu JOIN (SELECT * FROM users) u ON eu.user_id = u.id) user on et.user_id = user.id WHERE et.req_date BETWEEN '${fromDate}' AND '${toDate}' ORDER BY req_date asc`;
        
        thgmain.query(selectQuery, (err, results, fields) => {
            if(err) {
                data['ack'] = "Failure";
                data['reason'] = "Connection Failed...";
                console.log(err);
                res.send(data);
            }        
            else {
                data['ack'] = "Success";
                data['count'] = results.length;
                data['info'] = results;
                res.send(data);
            }
        }); 
    }
    else {
        var selectQuery = `SELECT DISTINCT pro.req_id, pro.name "Requestor_Name", pro.department "dept", pro.price "amount", CONCAT(pro.equipment, " - Quantity- ", pro.qty) 'purpose', pro.req_date, pro.updated_at 'approved_at', pro.upAt 'ack_at', pd.created_at 'transfer_at', pd.updated_at 'received_at', pro.updated_at, IF(STRCMP(pd.status, "Item_Received") = 0, "Received", IF(STRCMP(pd.status, "payment_tranfered_waiting_for item_delivered")= 0, "Transferred", IF(STRCMP(pro.postate, "accounts_approved") = 0, "Acknowledged", IF(STRCMP(pro.prstate, "Approved") = 0, "Approved", IF(STRCMP(pro.prstate, "Rejected") = 0, "Rejected", "Pending"))))) "status" FROM (SELECT pr.id, pr.unique_id 'req_id', pr.price, pr.qty, pr.department, pr.equipment, pr.name, pr.status 'prstate' , po.status 'postate', pr.created_at 'req_date', pr.updated_at, po.updated_at 'upAt' FROM purchaserequest pr LEFT JOIN purchaseorder po on pr.unique_id = po.unique_id) pro LEFT JOIN paymentdetails pd ON pro.req_id = pd.unique_id WHERE pro.req_date BETWEEN '${fromDate}' AND '${toDate}' ORDER BY pro.id DESC;`;
            
        thgpurchase.query(selectQuery, (err, results, fields) => {
            if(err) {
                data['ack'] = "Failure";
                data['reason'] = "Connection Failed...";
                console.log(err);
                res.send(data);
            }        
            else {
                data['ack'] = "Success";
                data['count'] = results.length;
                data['info'] = results;
                res.send(data);
            }
        }); 
    }
    
});

app.get('/expense/request/totalcount/:flag', (req, res) => {
    var flag = req.params.flag;
    console.log(flag);
    
    var data = {};

    if(flag == "Expense") {
        var expenseQuery = `SELECT et.req_id, user.full_name "Requestor_Name", et.dept, et.amount, et.purpose, et.created_at req_date, et.approved_at, et.ack_at, et.transfer_at, et.received_at, et.updated_at updated_at, et.status FROM (SELECT * FROM expense_track) et JOIN (SELECT u.id, u.full_name FROM (SELECT * FROM expense_users) eu JOIN (SELECT * FROM users) u ON eu.user_id = u.id) user on et.user_id = user.id ORDER BY req_date desc`;
        thgmain.query(expenseQuery, (err, results, fields) => {
            if(err) {
                console.log(err);   
                data['ack'] = 'failure';
                res.send(data);
            }
            else {
                data['ack'] = 'success';
                data['status'] = 'Expense';
                data['count'] = results.length;
                console.log(data);
                res.send(data);
            } 
        }) 
    }
    else {
        var purchaseQuery = `SELECT DISTINCT pro.req_id, pro.name "Requestor_Name", pro.department "dept", pro.price "amount", CONCAT(pro.equipment, " - Quantity- ", pro.qty) 'purpose', pro.req_date, pro.updated_at 'approved_at', pro.upAt 'ack_at', pd.created_at 'transfer_at', pd.updated_at 'received_at', pro.updated_at, IF(STRCMP(pd.status, "Item_Received") = 0, "Received", IF(STRCMP(pd.status, "payment_tranfered_waiting_for item_delivered")= 0, "Transferred", IF(STRCMP(pro.postate, "accounts_approved") = 0, "Acknowledged", IF(STRCMP(pro.prstate, "Approved") = 0, "Approved", IF(STRCMP(pro.prstate, "Rejected") = 0, "Rejected", "Pending"))))) "status" FROM (SELECT pr.id, pr.unique_id 'req_id', pr.price, pr.qty, pr.department, pr.equipment, pr.name, pr.status 'prstate' , po.status 'postate', pr.created_at 'req_date', pr.updated_at, po.updated_at "upAt" FROM purchaserequest pr LEFT JOIN purchaseorder po on pr.unique_id = po.unique_id) pro LEFT JOIN paymentdetails pd ON pro.req_id = pd.unique_id ORDER BY pro.id DESC;`;
        thgpurchase.query(purchaseQuery, (err, results, fields) => {
            if(err) {
                console.log(err);   
                data['ack'] = 'failure';
                res.send(data);
            }
            else {
                data['ack'] = 'success';
                data['status'] = 'Purchase';
                data['count'] = results.length;
                console.log(data);
                res.send(data);
            } 
        }) 
    }

    
})

app.get('/purchase/request/list', (req, res) => {
    // var spQuery = `CALL getPurchaseList()`;
    var spQuery = `SELECT DISTINCT pro.req_id, pro.name "Requestor_Name", pro.department "dept", pro.price "amount", CONCAT(pro.equipment, " - Quantity- ", pro.qty) 'purpose', pro.req_date, pro.updated_at 'approved_at', pro.upAt 'ack_at', pd.created_at 'transfer_at', pd.updated_at 'received_at', pro.updated_at, IF(STRCMP(pd.status, "Item_Received") = 0, "Received", IF(STRCMP(pd.status, "payment_tranfered_waiting_for item_delivered")= 0, "Transferred", IF(STRCMP(pro.postate, "accounts_approved") = 0, "Acknowledged", IF(STRCMP(pro.prstate, "Approved") = 0, "Approved", IF(STRCMP(pro.prstate, "Rejected") = 0, "Rejected", "Pending"))))) "status" FROM (SELECT pr.id, pr.unique_id 'req_id', pr.price, pr.qty, pr.department, pr.equipment, pr.name, pr.status 'prstate' , po.status 'postate', pr.created_at 'req_date', pr.updated_at, po.updated_at "upAt" FROM purchaserequest pr LEFT JOIN purchaseorder po on pr.unique_id = po.unique_id) pro LEFT JOIN paymentdetails pd ON pro.req_id = pd.unique_id ORDER BY pro.id DESC;`;
    var data = {};

    thgpurchase.query(spQuery, (err, results, fields) => {
        if(err) {
            data['ack'] = 'Failure';
            // console.log(data);
            res.send(data);
        }
        else { 
            data['ack'] = 'Success';
            data['count'] = results.length
            data['info'] = results;
            console.log("Fetching purchase requests");
            res.send(data);
        }
    });
})

app.post('/food/defaulters/datefilter', (req,res) => {
    var filter_date = req.body.food_date;
    console.log('Fetching food defaulters list');

    // var filterQuery = `SELECT branch,breakfast,lunch,snacks,dinner FROM food_defaulters WHERE food_date = '${filter_date}' and branch!= 'Coimbatore' ORDER BY 1;`;
    var filterQuery = `SELECT branch,breakfast,lunch,snacks,dinner FROM food_defaulters WHERE food_date = '${filter_date}' and branch!= 'Maduravoyal' and branch!= 'Hyderabad' ORDER BY 1;`;
    var data = {};

    thgmain.query(filterQuery, (err, results, fields) => {
        if(err) {
            data['ack'] = 'failure';
            res.send(data);
        }
        else {
            data['ack'] = 'success';
            data['date'] = filter_date;
            data['info'] = results;
            res.send(data);
        }     
    });
});

var emp_name = "Admin";

app.get("/test/ackby", (req, res) => {
    var emp_name = approvedBy();

    res.send(emp_name);
});

function approvedBy(eid) {
    block1:
        if(eid == null) {
            break block1;
        }
        console.log("Not null");
        var nameQuery = `SELECT name FROM app_users WHERE emp_id = '${eid}'`;
        console.log(nameQuery);

        thgmain.query(nameQuery, (err, results, fields) => {
            console.log(results[0].name);        
            emp_name = results[0].name;
        }); 
}

    cron.schedule('0 0 * * *', () => {
        var selectBranches = `SELECT branch_name FROM master_branches`;
        const now = date.format(date.addMinutes(date.addHours(new Date(), 5),30), 'YYYY-MM-DD', true);   
        console.log(now);
        
        var branches = [];

        thgmain.query(selectBranches, (err, results, fields) => {
            if(err) {
                console.log(err);
            }
            else {
                results.forEach(element => {
                    branches.push(element.branch_name);
                    var branchName = element.branch_name;

                    var insertQuery = `INSERT INTO food_defaulters (branch, food_date, breakfast, lunch, snacks, dinner) VALUES ('${branchName}', '${now}', '0', '0', '0', '0')`;
                    console.log(insertQuery);

                    thgmain.query(insertQuery, (err2, res2, fields2) => {
                        if(err2) {
                            console.log(err2);
                        }
                        else {
                            console.log(res2);
                        }
                    });
                });
                console.log(branches);
            }
        })
        console.log(`cron ran at ${now}`);
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    }
    )
 
app.listen(PORT, (err) => {
    if(err) console.log(err);
    console.log("Server listening on", PORT);
});