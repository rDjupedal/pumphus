/* Schema for maintenance */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const maintenanceSchema = new Schema({
    period: Number,     //DAYS
    title: String,
    instruction: String
});

module.exports = mongoose.model("Maintenance", maintenanceSchema);