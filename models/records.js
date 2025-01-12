/* Schema for records */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const recordSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    week: Number,
    date: Date,         // DD/MM/YYYY
    ph: Number,         // Current pH reading
    wm: Number,         // Water reading in m3
    salt: Number,       // á 25 kg salt added
    phplus: Number,     // kg's of pH+ added
    phturbo: Number,    // kg's of ph turbo added
    phfluid: Number,    // Litres of ph fluid before refill
    fluidadd: Number,   // Litres of water added
    note: String,
    sign: String,
    main: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Maintenance'} ]   // Array of maintenance objects
});

module.exports = mongoose.model("Records", recordSchema);