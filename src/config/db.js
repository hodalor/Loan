const log = require("simple-node-logger").createSimpleFileLogger("project.log");
const config = require("./index");
const mongoose = require("mongoose");
const { logSystemEvent } = require("../libs/logger");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.database, {});
    console.log(
      `Connected to the DB: ${conn.connection.name} on ${conn.connection.host}`
    );
    await logSystemEvent({
      level: "info",
      category: "server",
      source: "database.connect",
      action: "startup",
      status: "success",
      message: `Connected to the DB: ${conn.connection.name} on ${conn.connection.host}`,
      metadata: {
        databaseName: conn.connection.name,
        host: conn.connection.host,
      },
    });
    return conn;
  } catch (error) {
    console.error(`mongodb error${error}`)
    await logSystemEvent({
      level: "fatal",
      category: "server",
      source: "database.connect",
      action: "startup",
      status: "failed",
      message: error.message || "MongoDB connection failed.",
      details: {
        stack: error.stack || "",
      },
    });
    process.exit(1);
  }
};
module.exports = connectDB;
