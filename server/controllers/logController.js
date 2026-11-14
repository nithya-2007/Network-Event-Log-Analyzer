
const Log = require("../models/log");

// Get all logs
exports.getLogs = async (req, res) => {
    try {
        const logs = await Log.find().sort({ timestamp: -1 });
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add new log with validation and DFA detection
exports.addLog = async (req, res) => {
    try {
        const {
            sourceIP,
            destinationIP,
            port,
            protocol,
            status
        } = req.body;

        // IP address validation
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;

        const isValidIP = (ip) => {
            return ipPattern.test(ip) &&
                ip.split(".").every(part => Number(part) <= 255);
        };

        if (!isValidIP(sourceIP) || !isValidIP(destinationIP)) {
            return res.status(400).json({
                message: "Invalid IP address"
            });
        }

        // Port validation
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
            return res.status(400).json({
                message: "Invalid port number"
            });
        }

        // Protocol validation
        if (!["TCP", "UDP"].includes(protocol)) {
            return res.status(400).json({
                message: "Invalid protocol"
            });
        }

        // Status validation
        if (!["SUCCESS", "FAILED"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        // DFA: Check the last two logs of the same source IP
        const previousLogs = await Log.find({ sourceIP })
            .sort({ timestamp: -1, _id: -1 })
            .limit(2);

        const alert =
            status === "FAILED" &&
            previousLogs.length === 2 &&
            previousLogs.every(log => log.status === "FAILED");

        // Save new log
        const newLog = new Log({
            sourceIP,
            destinationIP,
            port,
            protocol,
            status,
            alert
        });

        const savedLog = await newLog.save();

        res.status(201).json({
            message: alert
                ? "Alert: Repeated failed attempts detected!"
                : "Log added successfully",
            log: savedLog
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

// Delete log
exports.deleteLog = async (req, res) => {
    try {
        const deletedLog = await Log.findByIdAndDelete(req.params.id);

        if (!deletedLog) {
            return res.status(404).json({
                message: "Log not found"
            });
        }

        res.status(200).json({
            message: "Log deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Update existing network log
exports.updateLog = async (req, res) => {
    try {
        const updatedLog = await Log.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedLog) {
            return res.status(404).json({
                message: "Log not found"
            });
        }

        res.status(200).json({
            message: "Log updated successfully",
            log: updatedLog
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};
