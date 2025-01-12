
/* Imports */
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const session = require('express-session');
const cors = require("cors");


require("dotenv").config();


const DBURL = process.env.DB_URL;
// Connect to database
mongoose
    .connect(DBURL, { useNewUrlParser: true })
    .then(() => console.log("Connected to database"))
    .catch((err) => console.log("Error connecting to database \n" + err));

// Import db schema
const RecordsSchema = require("./models/records.js");

// Create instance of express
const app = express();

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded( { extended: false }));

// CORS
app.use(cors({
    'origin': ["http://localhost:8080", "https://pumphusservice.onrender.com"],
    'credentials': true,
    'allowedHeaders': ['Content-Type'],
    'preflightContinue': true
}));

// SESSION MIDDLEWARE
app.use(session( {
    key : "userSessionId",
    secret : process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires : 604800000,    // week
        secure: false,
        maxAge: 604800000,
        sameSite: "lax"
    }
}));

/*
// Cutom middleware
const sessionCheck = function(req, res, next) {
    console.log("Middleware checking session");
    // console.log(req);
    next();
}
app.use(logger);
*/

// Needed for Render hosting service
process.env.NODE_VERSION = "14.20.1";

// Static path
app.use(express.static(path.join(__dirname, "public")));

const recordRoutes = require("./routes/recordRoutes.js");
app.use("", recordRoutes);

const userRoutes = require("./routes/userRoutes.js");
app.use("", userRoutes);

const maintenanceRoutes = require("./routes/maintenanceRoutes.js");
app.use("", maintenanceRoutes);

//Server port
const port = 3000;

// Start server
app.listen(port, function() {
    console.log("Server started on port " + port);
});