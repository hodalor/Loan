const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express();
const httpServer = createServer(app);

const bodyParser = require("body-parser");
const cors = require("cors");
const config = require("./config/index");
const connectDB = require("./config/db");
const log = require("simple-node-logger").createSimpleFileLogger("project.log");

const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  // optionSuccessStatus: 200,
};

const captureRawBody = (req, _res, buffer) => {
  if (buffer?.length) {
    req.rawBody = buffer.toString("utf8");
  }
};

//middleware
app.use(express.json({ limit: "50mb", verify: captureRawBody }));
app.use(bodyParser.json({ verify: captureRawBody }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());

const io = new Server(httpServer, {
  cors: {
    allowedHeaders: [
      "X-ACCESS_TOKEN",
      "Access-Control-Allow-Origin",
      "Authorization",
      "Origin",
      "x-requested-with",
      "Content-Type",
      "Content-Range",
      "Content-Disposition",
      "Content-Description",
    ],
    credentials: false,
    methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
    origin: "*",
    //  [
    //   // "http://macog.local:5001",
    //   "http://localhost:3000",
    //   // "https://app.foo.com",
    //   "http://192.168.43.233:3000",
    // ],
    preflightContinue: false,
  },
});

// my middleware
const user = require("./app/routes/user");
const loan = require("./app/routes/loan");
const admin = require("./app/routes/admin");
const _setOnLineStatus = require("./app/handlers/adminHandlers/setOline");
const _setActiveStatus = require("./app/handlers/adminHandlers/setActive");
const {
  _assignRevTask,
  _reAssignRevTask,
} = require("./app/handlers/adminHandlers/assignTask");
const {
  _assignPreTask,
  _reAssignPreTask,
} = require("./app/handlers/adminHandlers/assignPre");
const {
  _assignColTask,
  _reAssignColTask,
} = require("./app/handlers/adminHandlers/assignColTask");
const _setCustomerActiveStatus = require("./app/handlers/userHandlers/setActive");
const _updateUser = require("./app/handlers/userHandlers/updateUser");
const _removeUser = require("./app/handlers/adminHandlers/deleteUser");
const _disburseLoans = require("./app/handlers/loanHandlers/disburseLoans");
const { logger } = require("./libs/logger");

// end points
app.use("/users", user.createUser);
app.use("/users", user.customerAuth);
app.use("/users", user.verifyUser);
app.use("/users", user.getUser);
app.use("/users", user.paymentMethod);
app.use("/users", user.updateIdCard);
app.use("/loans", loan.requestLoan);
app.use("/loans", loan.loanStatus);
app.use("/loans", loan.grantLoan);
app.use("/loans", loan.rejectLoan);
app.use("/loans", loan.repaymen);
app.use("/loans", loan.assignCase);
app.use("/loans", loan.assignColCase);
app.use("/loans", loan.assignPreCol);
app.use("/loans", loan.auditCallRecords);
app.use("/loans", loan.clearCase);
app.use("/loans", loan.clearCaseBalance);
app.use("/loans", loan.colCallRecords);
app.use("/loans", loan.confirmClearBalance);
app.use("/loans", loan.confirmClearPublic);
app.use("/loans", loan.extRecord);
app.use("/loans", loan.preColCallRecords);
app.use("/loans", loan.unassignAuditCases);
app.use("/loans", loan.unassignColCases);
app.use("/loans", loan.unassignPreColCases);
app.use("/loans", loan.getLoans);
app.use("/loans", loan.getLoansByAdminID);
app.use("/loans", loan.retryDisbursement);
app.use("/loans", loan.manualDisbursement);
app.use("/loans", loan.adminExtension);
app.use("/admin", admin.createAdmin);
app.use("/admin", admin.getAdmin);
app.use("/admin", admin.getAllAdmins);
app.use("/admin", admin.updateAdmin);
app.use("/admin", admin.login);
app.use("/admin", admin.systemConfig);
app.use('/upload', express.static('upload'));

var bdy = {}

app.post("/callback", (req, res) => {
  const body = req.body
  // console.log(body);
  bdy = body
  res.sendStatus(200)
  // res.json({
  //   message:
  //     "Hello Welcome to perficient loans api! written by ilyaseen19(Abdallah)",
  // });
});

app.get("/", (req, res) => {
  res.send(bdy)
})

const testNasano = async (url) => {
  console.log("started");
  fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      "kuwaita": "malipo",
      "amount": "1",
      "mno": "AIRTELZM",
      "refID": "1246kh",
      "msisdn": "260774736648"
    })
  })
  .then(response => response.json())
  .then(res => {
    console.log(res);
  })
  .catch(err => {
    console.log(err);
  })
}

// testNasano("https://a669-45-79-147-59.ngrok-free.app/callback")
// testNasano("https://fs1.nsano.com:4001/api/fusion/tp/82dd87dd129548329b2d8532b97e2baf")

io.on("connection", (socket) => {
  //registering all connected customers with userId
  socket.on("init", (userId) => {
    // console.log(userId);
  });

  socket.on("admin_on", async (data) => {
    await _setOnLineStatus(data);

    socket.broadcast.emit("admin_on_receiver", data.userId);
  });

  socket.on("admin_off", async (data) => {
    await _setOnLineStatus(data);

    socket.broadcast.emit("admin_off_receiver", data.userId);
  });

  socket.on("changeAdminActiveStatus", async (userId, callBack) => {
    // set admin active status
    await _setActiveStatus(userId);

    // call back fired when action is complete
    callBack({
      message: "Updated successfully",
    });
  });

  socket.on("changeCustomerActiveStatus", async (userId, callBack) => {
    // set admin active status
    await _setCustomerActiveStatus(userId);

    // call back fired when action is complete
    callBack({
      message: "Updated successfully",
    });
  });

  socket.on("updateCustomer", async (data, callBack) => {
    // update user data
    const res = await _updateUser(data);

    // call back fired when action is complete
    callBack({
      success: res ? true : false,
      message: res
        ? "records updated successfully"
        : "could not update records",
    });
  });

  socket.on("assignTask", async (data, callBack) => {
    // set admin active status
    let res = await _assignRevTask(data);

    // call back fired when action is complete
    callBack({
      success: res ? true : false,
      message: res ? "Task assigned successfully" : "could not assign task",
    });
  });

  socket.on("assignPreTask", async (data, callBack) => {
    // set admin active status
    let res = await _assignPreTask(data);

    // call back fired when action is complete
    callBack({
      success: res ? true : false,
      message: res ? "Task assigned successfully" : "could not assign task",
    });
  });

  socket.on("assignColTask", async (data, callBack) => {
    // set admin active status
    let res = await _assignColTask(data);

    // call back fired when action is complete
    callBack({
      success: res ? true : false,
      message: res ? "Task assigned successfully" : "could not assign task",
    });
  });

  socket.on("re_assignTask", async (data, callBack) => {
    // set admin active status
    let res = await _reAssignRevTask(data);

    // call back fired when action is complete
    callBack({
      success: res ? true : false,
      message: res ? "Task assigned successfully" : "could not assign task",
    });
  });

  socket.on("reAssignColTask", async (data, callBack) => {
    // set admin active status
    let res = await _reAssignColTask(data);

    // call back fired when action is complete
    callBack({
      success: res ? true : false,
      message: res ? "Task assigned successfully" : "could not assign task",
    });
  });

  socket.on("re_assignPreTask", async (data, callBack) => {
    // set admin active status
    let res = await _reAssignPreTask(data);

    // call back fired when action is complete
    callBack({
      success: res ? true : false,
      message: res ? "Task assigned successfully" : "could not assign task",
    });
  });

  socket.on("remove_user", async (_id, callBack) => {
    // set admin active status
    let res = await _removeUser(_id);

    // call back fired when action is complete
    callBack({
      success: res ? 1 : 0,
      message: res ? "user removed successfully" : "could not remover user",
    });
  });

  socket.on("loanRequest", (userData, callBack) => {
    //<---- emit data to admin
    socket.broadcast.emit("loan_request", userData);
    // console.log(userData);

    callBack({
      success: 1,
      message: "Sent successfully",
    });
  });

  socket.on("loanStatusChanged", (data, callBack) => {
    //<---- emit data to customer
    socket.broadcast.emit(data.userId, data);

    callBack({
      success: 1,
      message: "Sent successfully",
    });
  });

  socket.on("disburse_loans", async (data, callBack) => {
    let res = await _disburseLoans(data);

    callBack({
      success: res.success,
      message: res.success
        ? "Selected loans were disbursed successfully"
        : "Some disbursements failed and need review",
      data: res.results,
    });
  });
});


// mongoose database connection
connectDB();

const PORT = config.server.port;
httpServer.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
});
