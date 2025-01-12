/* MAINTENANCE ROUTES */

const DEBUG = false;
const UsersSchema = require("../models/users");
const RecordsSchema = require("../models/records.js");
const MaintenanceSchema = require("../models/maintenance.js");
const express = require("express");
const app = express.Router();


/*
Middleware to check if user is logged in
 */
function isAuth(req, res, next) {
    if (req.session.userid || DEBUG) {
        next();
    }
    else {
        res.status(401).send({ "error" : "User not logged in" });
        //res.status(301).redirect("/login.html");
        console.log("User not logged in");
    }
}

app.post("/api/maintenance/new", isAuth, function(req, res) {
    console.log("new maintenance");

    newM = new MaintenanceSchema();
    newM.period = req.body.period;
    newM.title = req.body.title;
    newM.instruction = req.body.instruction;

    newM.save()
        .then((result) => {
            res.status(200).send({"message" : "Successfully saved new maintenance plan"});
            console.log("Saved new maintenance plan " + req.body.title);
        })
        .catch((err) => {
            res.status(500).send({"error" : "Could not create new maintenance plan"});
            console.log("Failed to save new maintenance plan to database\n" + err);
        })
});

app.put("/api/maintenance/edit", isAuth, function(req, res) {
    console.log("edit maintenance");
    MaintenanceSchema.findById(req.body._id)
        .then((m) => {
            let hasChanged = false;
            for (let key in req.body) {
                if (m[key] != req.body[key]) {
                    m[key] = req.body[key];
                    hasChanged = true;
                }
            }

            if (hasChanged) {
                m.save()
                    .then((result) => {
                        res.status(200).send({"message" : "Maintenance updated"});
                        console.log("Maintenance successfully updated")
                    })
                    .catch((err) => {
                        res.status(400).send({"error" : "Maintenance was not updated due to database error"});
                        console.log("Error modifying maintenance" + err);
                    });
            } else {
                res.status(409).send({ "error" : "No change in the sent maintenance" });
                console.log("No change found");
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(404).send({"error" : "No such maintenance"});
        });
});

app.get("/api/getmain", isAuth, function(req, res) {
    console.log("get maintenance");
    MaintenanceSchema.find()
        .then((data) => res.status(200).json(data))
        .catch((err) => {
            res.status(500).send({"error" : "Could not get maintenance items from database" });
            console.log("Error getting maintenance from database\n" + err);
        });
});

// DELETE MAINTENANCE
app.delete("/api/maintenance/:id", isAuth, function(req, res) {
    console.log("deleting maintenance..");
    let delId = req.params.id;

    MaintenanceSchema
        .findById(delId)
        .deleteOne()
        .then(() => res.status(200).send( { "message" : "Maintenance deleted" }))
        .catch((err) => res.status(500).send({"error" : "Could not delete maintenance "}));
});




module.exports = app;