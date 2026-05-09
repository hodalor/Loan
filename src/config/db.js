const log = require("simple-node-logger").createSimpleFileLogger("project.log");
const config = require("./index");
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.database, {});
    console.log(`MongoDB connected :${conn.connection.host}`)
  } catch (error) {
    console.error(`mongodb error${error}`)
    process.exit(1);
  }
};
module.exports = connectDB;
