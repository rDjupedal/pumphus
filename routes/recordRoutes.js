/* RECORDS ROUTES */

const DEBUG = false;
const UsersSchema = require("../models/users");
const RecordsSchema = require("../models/records.js");
const express = require("express");
const app = express.Router();

/*
Middleware to check if user is logged in
 */
function isAuth(req, res, next) {
    if (req.session.userid || DEBUG) next();
    else {
        res.status(401).send({ "error" : "User not logged in" });
        console.log("User not logged in");
    }
}

function clearPasswords(data) {

    for (let entry of data) {
        if (entry.user) entry.user.password="***";
    }

    return data;
}


// GET ALL RECORDS
app.get("/api/getall", isAuth, function(req, res) {
    console.log(req.session.userid + " requesting all records..");

    RecordsSchema.find().populate("main").populate("user")
        .then((data) => { res.status(200).json(clearPasswords(data)) })
        .catch((err) => {
            res.status(400).send( { "error" : "Error retrieving data from database" } )
            console.log(err);
        });
});

// EDIT RECORD
app.put("/api/edit", isAuth, function(req, res) {
    console.log("Editing record " + req.body._id);
    RecordsSchema.findById(req.body._id)
        .then((record) => {
            console.log("found record");
            // Check what has changed
            let hasChanged = false;
            for (let key in req.body) {
                console.log(key + " : " + record[key] + "   " + req.body[key]);

                if (record[key] != req.body[key]) {
                    console.log("updating field " + key);
                    record[key] = req.body[key];
                    hasChanged = true;
                }
            }

            if (hasChanged) {
                record.save()
                    .then((result) => {
                        res.status(200).send({"message" : "Record updated"});
                        console.log("Successfully updated")
                    })
                    .catch((err) => {
                        res.status(400).send({"error" : "Record was nog updated due to database error"});
                        console.log("Error modifying record" + err);
                    });
            } else {
                res.status(409).send({ "error" : "No change in the sent record" });
                console.log("No change found");
            }

        })
        .catch((err) => {
            console.log(err)
            res.status(404).send({"error" : "No such record"});
        });
});

// NEW RECORD
app.post("/api/add", isAuth, function(req, res) {
    console.log("creating new db entry..");

    // Find the logged in user
    UsersSchema.findOne( {"_id" : req.session.userid})
        .then((user) => {

            // DB Schema instance
            let record = new RecordsSchema(req.body);

            // These data are added by the server
            // record.date = Date.now();    // Overrides the date from the client
            record.user = user;
            record.sign = user.sign;

            // Add a reference to each maintenance that was done
            for (let mainT in req.body.maintenance) {
                record.main.push(req.body.maintenance[mainT].id_);
            }

            // Save the record
            record.save()
                .then(() => {
                    res.statusCode = 201;
                    res.send( { "message" : "Successfully saved record to database"} );
                    // res.redirect("/");
                })
                .catch((err) => {
                    req.session.destroy();
                    res.status(400).send( {"message" : "Error saving to database"} )
                    console.log("Error saving to database \n" + err);
                });
        })
        .catch((err) => {
            res.status(403).send({"error" : "User not logged in"})
            console.log("User not logged in.. Server lost session?\n" + err);
        })
});

// DELETE RECORD
app.delete("/api/delete/:id", isAuth, function(req, res) {
    console.log("deleting..");
    let delId = req.params.id;

    RecordsSchema
        .findById(delId)
        .deleteOne()
        .then(() => res.status(200).send( { "message" : "Record deleted" }))
        .catch((err) => res.status(500).send({"error" : "Could not delete record "}));
});

function getDate() {
    const d = new Date();
    console.log(d);
    return (d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear());
}

module.exports = app;