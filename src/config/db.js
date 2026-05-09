const log = require("simple-node-logger").createSimpleFileLogger("project.log");
const config = require("./index");
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.database, {});
    console.log(
      `Connected to the DB: ${conn.connection.name} on ${conn.connection.host}`
    );
    return conn;
  } catch (error) {
    console.error(`mongodb error${error}`)
    process.exit(1);
  }
};
module.exports = connectDB;
