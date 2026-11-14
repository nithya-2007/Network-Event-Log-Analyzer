
const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
    sourceIP: {
        type: String,
        required: true
    },
    destinationIP: {
        type: String,
        required: true
    },
    port: {
        type: Number,
        required: true
    },
    protocol: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["SUCCESS", "FAILED"],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    alert: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model("Log", logSchema);
