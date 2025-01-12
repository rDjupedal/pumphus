/* USER ROUTES */

const DEBUG = false;
const UsersSchema = require("../models/users");
const express = require("express");
const app = express.Router();
const bcrypt = require("bcryptjs");

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

/**
 * Log out
 */
app.get("/api/logout", isAuth, function(req, res) {
    console.log("Destroying user session");
    req.session.destroy();
    res.status(200).send({"message" : "Logged out"});
});

/**
 * Login
 */
app.post("/api/login", async function(req, res) {
    let username = req.body.username;
    let password = req.body.password;
    let dbUser;

    UsersSchema.findOne({username: username})
        .then((user) => {
            if (!user) return Promise.reject("User not found");
            dbUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then((correctPassword) => {
            console.log("result: " + correctPassword);
            if (correctPassword) return Promise.resolve();
            return Promise.reject("wrong login");
        })
        .then(() => { return regenSession(); })
        .then(() => {
            res.status(200).send({"message": "Logged in as " + dbUser.username});
            console.log("Logged in as " + dbUser.username);
        })
    .catch((err) => {
        console.log(err)
        res.status(401).send({"error": "Error logging in"});
    });

    function regenSession() {
        return new Promise(function (resolve, reject) {
            req.session.regenerate(function (err) {
                req.session.userid = dbUser._id;
                req.session.save((err) => {
                    if (err) reject();
                    resolve();
                })
            })
        })
    }

});


/**
 * Change password
 */
app.put("/api/changepass", isAuth, function(req, res) {

    let dbUser;
    // Get the current user from database
    UsersSchema.findOne( {"_id" : req.session.userid} )
        .then((user) => {
            if (!user) return Promise.reject("User not found");
            dbUser = user;
            // Check the current password
            return bcrypt.compare(req.body.oldpassword, user.password);
        })
        .then((isCorrect) => {
            if (!isCorrect) return Promise.reject("Incorrect password");
            if (req.body.newpassword.length < 4) return Promise.reject("New password too short or too simple");
            return bcrypt.genSalt(10 );
        })
        .then((salt) => {
            if (!salt) return Promise.reject(`Failed generating salt`);
            return bcrypt.hash(req.body.newpassword, salt)
        })
        .then((hashedPwd) => {
            if (!hashedPwd) return Promise.reject("Failed getting hash for new password");
            dbUser.password = hashedPwd;
            dbUser.save();
        })
        .then(() => {
            console.log("Password changed")
            res.status(200).send({"message" : "Password changed"});
        })
        .catch((err) => {
            console.log("Error\t" + err);
            if (err === "Incorrect password") res.status(401).send({"error" : "Wrong password"});
            else res.status(500).send({"error" : "Failed changing password"});
        });
});

/**
 * New User
 */
app.post("/api/newuser", isAuth, function(req, res) {
    console.log("Creating new user");

    let newUser = new UsersSchema();
    for (let key in req.body) {
        if (key === "password") continue;
        newUser[key] = req.body[key];
        console.log(key + ":  " + newUser[key]);
    }

    bcrypt.genSalt(10)
        .then((salt) => {
            if (!salt) return Promise.reject(`Failed generating salt`);
            return bcrypt.hash(req.body.password, salt)
        })
        .then((hashedPwd) => {
            if (!hashedPwd) return Promise.reject("Failed getting hash for new password");
            newUser.password = hashedPwd;
            newUser.save();
        })
        .then(() => {
            res.status(200).send({"message" : "User successfully saved"});
            console.log("new user saved to database");
            //todo redirect?
        })
        .catch((err) => {
            res.status(400).send({"error" : "Error saving new user to database"});
            console.log("Error saving new user:\t" + err);
        })
});

module.exports = app;