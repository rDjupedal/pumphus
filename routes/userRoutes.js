/* USER ROUTES */

const DEBUG = false;
const SALT_ROUNDS = 10;
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

/*
Middleware to check whether user is logged in, but returns with a response code 200, not indicating error.
 */
function isAuthNiceReply(req, res, next) {
    if (req.session.userid) next();
    else res.status(200).send({
        "message" : "Not logged in",
        "user" : false,
        "admin" : false
        });
}

/**
 * Check login status of user / admin
 */
app.get("/api/loginstatus", isAuthNiceReply, function(req, res) {
    UsersSchema.findOne({"_id" : req.session.userid})
        .then((user) => {
            if (!user) return Promise.reject("User not found");

            res.status(200).send ({
                "message" : (user.admin? "Admin" : "User") + " is logged in",
                "user": true,
                "admin" : user.admin });
        })
        .catch((err) => {
            res.status(401).send({ "error" : err });
            console.log("Error getting logged in status\n" + err);
        })
})

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
            res.status(200).send({
                "message": "Logged in as " + dbUser.username,
                "user" : true,
                "admin" : (dbUser.admin? true : false),
                "sign": dbUser.sign
            });
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
            return bcrypt.genSalt(SALT_ROUNDS );
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

    // Get the current user from database
    UsersSchema.findOne({"_id": req.session.userid})
        .then((user) => {
            // Checking logged in user
            if (!user) return Promise.reject({ code: 401, msg: "Logged in user not found, who are you really?" });
            if (!user.admin) return Promise.reject({ code: 403, msg: "You are not admin, can't create new users" });
            return UsersSchema.findOne({"username": req.body.username});
        })
        .then((existing) => {
            if (existing) return Promise.reject({ code: 409, msg: "User already exists" });
            return bcrypt.genSalt(SALT_ROUNDS);
        })
        .then((salt) => {
            if (!salt) return Promise.reject({ code: 500, msg: `Failed generating salt` });
            return bcrypt.hash(req.body.password, salt);
        })
        .then((hashedPwd) => {
            if (!hashedPwd) return Promise.reject({ code: 500, msg: "Failed generating hash for new password" });
            newUser.password = hashedPwd;
            return newUser.save();
        })
        .then(() => {
            res.status(201).send({"message": "User successfully created"});
            console.log("New user saved to database");
        })
        .catch((err) => {
            res.status(err.code).send({ "error": "Error saving new user to database:   " + err.msg });
            console.log("Error saving new user:\t" + err.code + "\t" + err.msg);
        })

})


module.exports = app;