const myLogger = require("simple-node-logger").createSimpleFileLogger("project.log");

logger = (payload) => {
    myLogger.log(payload.type, payload.message)
//   console.log(payload);
};

module.exports = { logger };
