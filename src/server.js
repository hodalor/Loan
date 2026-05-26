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
const { logger, logSystemEvent } = require("./libs/logger");
const {
  buildAuditActor,
  summarizeAdmin,
  summarizeCustomer,
  logAuditEvent,
} = require("./libs/audit");

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
app.use("/loans", loan.bridgeWebhook);
app.use("/loans", loan.manualDisbursement);
app.use("/loans", loan.adminExtension);
app.use("/admin", admin.createAdmin);
app.use("/admin", admin.getAdmin);
app.use("/admin", admin.getAllAdmins);
app.use("/admin", admin.updateAdmin);
app.use("/admin", admin.login);
app.use("/admin", admin.systemConfig);
app.use("/admin", admin.staffGroups);
app.use("/admin", admin.systemLogs);
app.use("/admin", admin.fundRequests);
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

process.on("unhandledRejection", (error) => {
  console.log(error);
  logSystemEvent({
    level: "error",
    category: "server",
    source: "process.unhandledRejection",
    action: "runtime",
    status: "failed",
    message: error?.message || "Unhandled promise rejection",
    details: {
      stack: error?.stack || "",
    },
  });
});

process.on("uncaughtException", (error) => {
  console.log(error);
  logSystemEvent({
    level: "fatal",
    category: "server",
    source: "process.uncaughtException",
    action: "runtime",
    status: "failed",
    message: error?.message || "Uncaught exception",
    details: {
      stack: error?.stack || "",
    },
  });
});

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
  const respondToSocketAction = (callBack, payload = {}) => {
    if (typeof callBack === "function") {
      callBack(payload);
    }
  };

  const handleSocketAction = (callBack, action, successMessage, failureMessage) =>
    Promise.resolve()
      .then(action)
      .then((result) => {
        respondToSocketAction(callBack, {
          success: Boolean(result),
          message: result ? successMessage : failureMessage,
        });
      })
      .catch((error) => {
        logger({
          level: "error",
          message: error?.message || "Socket action failed.",
        });
        respondToSocketAction(callBack, {
          success: false,
          message: failureMessage || "Request failed.",
          error: error?.message || "Unknown socket error",
        });
      });

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

  socket.on("changeAdminActiveStatus", async (payload, callBack) => {
    try {
      const userId = typeof payload === "string" ? payload : payload?.userId;
      const actor = buildAuditActor(payload?.auditActor || {});
      const admin = await _setActiveStatus(userId);

      if (!admin) {
        await logAuditEvent({
          source: "socket.changeAdminActiveStatus",
          action: "toggle-active",
          status: "failed",
          message: "Staff active status update failed because the account was not found.",
          actor,
          metadata: {
            targetUserId: userId || "",
            channel: "socket",
          },
        });
        return callBack({
          success: false,
          message: "Could not update the user status",
        });
      }

      await logAuditEvent({
        source: "socket.changeAdminActiveStatus",
        action: admin.isActive ? "activate" : "deactivate",
        status: "success",
        message: `Staff account ${admin.isActive ? "activated" : "deactivated"} successfully.`,
        actor,
        metadata: {
          target: summarizeAdmin(admin),
          channel: "socket",
        },
      });

      callBack({
        success: true,
        message: "Updated successfully",
      });
    } catch (error) {
      logger({
        level: "error",
        message: error?.message || "Staff active status socket action failed.",
      });
      await logAuditEvent({
        level: "error",
        source: "socket.changeAdminActiveStatus",
        action: "toggle-active",
        status: "failed",
        message: error?.message || "Staff active status update failed.",
        actor: buildAuditActor(payload?.auditActor || {}),
        details: {
          stack: error?.stack || "",
        },
        metadata: {
          targetUserId: typeof payload === "string" ? payload : payload?.userId || "",
          channel: "socket",
        },
      });
      callBack({
        success: false,
        message: "Could not update the user status",
      });
    }
  });

  socket.on("changeCustomerActiveStatus", async (payload, callBack) => {
    try {
      const userId = typeof payload === "string" ? payload : payload?.userId;
      const actor = buildAuditActor(payload?.auditActor || {});
      const customer = await _setCustomerActiveStatus(userId);

      if (!customer) {
        await logAuditEvent({
          source: "socket.changeCustomerActiveStatus",
          action: "toggle-active",
          status: "failed",
          message: "Customer active status update failed because the account was not found.",
          actor,
          metadata: {
            targetUserId: userId || "",
            channel: "socket",
          },
        });
        return callBack({
          success: false,
          message: "Could not update the customer status",
        });
      }

      await logAuditEvent({
        source: "socket.changeCustomerActiveStatus",
        action: customer.isActive ? "unblock" : "block",
        status: "success",
        message: `Customer account ${customer.isActive ? "unblocked" : "blocked"} successfully.`,
        actor,
        metadata: {
          target: summarizeCustomer(customer),
          channel: "socket",
        },
      });

      callBack({
        success: true,
        message: "Updated successfully",
      });
    } catch (error) {
      logger({
        level: "error",
        message: error?.message || "Customer active status socket action failed.",
      });
      await logAuditEvent({
        level: "error",
        source: "socket.changeCustomerActiveStatus",
        action: "toggle-active",
        status: "failed",
        message: error?.message || "Customer active status update failed.",
        actor: buildAuditActor(payload?.auditActor || {}),
        details: {
          stack: error?.stack || "",
        },
        metadata: {
          targetUserId: typeof payload === "string" ? payload : payload?.userId || "",
          channel: "socket",
        },
      });
      callBack({
        success: false,
        message: "Could not update the customer status",
      });
    }
  });

  socket.on("updateCustomer", async (data, callBack) => {
    try {
      const actor = buildAuditActor(data?.auditActor || {});
      const res = await _updateUser(data);

      if (!res) {
        await logAuditEvent({
          source: "socket.updateCustomer",
          action: "update",
          status: "failed",
          message: "Customer profile update failed because the account was not found or unchanged.",
          actor,
          metadata: {
            targetUserId: data?.userId || "",
            channel: "socket",
          },
        });
        return callBack({
          success: false,
          message: "could not update records",
        });
      }

      await logAuditEvent({
        source: "socket.updateCustomer",
        action: "update",
        status: "success",
        message: "Customer profile updated successfully.",
        actor,
        metadata: {
          target: summarizeCustomer(res),
          channel: "socket",
        },
      });

      callBack({
        success: true,
        message: "records updated successfully",
      });
    } catch (error) {
      logger({
        level: "error",
        message: error?.message || "Customer update socket action failed.",
      });
      await logAuditEvent({
        level: "error",
        source: "socket.updateCustomer",
        action: "update",
        status: "failed",
        message: error?.message || "Customer profile update failed.",
        actor: buildAuditActor(data?.auditActor || {}),
        details: {
          stack: error?.stack || "",
        },
        metadata: {
          targetUserId: data?.userId || "",
          channel: "socket",
        },
      });
      callBack({
        success: false,
        message: "could not update records",
      });
    }
  });

  socket.on("assignTask", (data, callBack) =>
    handleSocketAction(
      callBack,
      () => _assignRevTask(data),
      "Task assigned successfully",
      "could not assign task"
    )
  );

  socket.on("assignPreTask", (data, callBack) =>
    handleSocketAction(
      callBack,
      () => _assignPreTask(data),
      "Task assigned successfully",
      "could not assign task"
    )
  );

  socket.on("assignColTask", (data, callBack) =>
    handleSocketAction(
      callBack,
      () => _assignColTask(data),
      "Task assigned successfully",
      "could not assign task"
    )
  );

  socket.on("re_assignTask", (data, callBack) =>
    handleSocketAction(
      callBack,
      () => _reAssignRevTask(data),
      "Task assigned successfully",
      "could not assign task"
    )
  );

  socket.on("reAssignColTask", (data, callBack) =>
    handleSocketAction(
      callBack,
      () => _reAssignColTask(data),
      "Task assigned successfully",
      "could not assign task"
    )
  );

  socket.on("re_assignPreTask", (data, callBack) =>
    handleSocketAction(
      callBack,
      () => _reAssignPreTask(data),
      "Task assigned successfully",
      "could not assign task"
    )
  );

  socket.on("remove_user", async (payload, callBack) => {
    try {
      const targetId = typeof payload === "string" ? payload : payload?._id;
      const actor = buildAuditActor(payload?.auditActor || {});
      const res = await _removeUser(targetId);

      if (res) {
        await logAuditEvent({
          source: "socket.remove_user",
          action: "delete",
          status: "success",
          message: "Staff account deleted successfully.",
          actor,
          metadata: {
            target: summarizeAdmin(res),
            channel: "socket",
          },
        });
      } else {
        await logAuditEvent({
          source: "socket.remove_user",
          action: "delete",
          status: "failed",
          message: "Staff account deletion failed because the account was not found.",
          actor,
          metadata: {
            targetId: targetId || "",
            channel: "socket",
          },
        });
      }

      callBack({
        success: res ? 1 : 0,
        message: res ? "user removed successfully" : "could not remover user",
      });
    } catch (error) {
      logger({
        level: "error",
        message: error?.message || "Staff delete socket action failed.",
      });
      await logAuditEvent({
        level: "error",
        source: "socket.remove_user",
        action: "delete",
        status: "failed",
        message: error?.message || "Staff account deletion failed.",
        actor: buildAuditActor(payload?.auditActor || {}),
        details: {
          stack: error?.stack || "",
        },
        metadata: {
          targetId: typeof payload === "string" ? payload : payload?._id || "",
          channel: "socket",
        },
      });
      callBack({
        success: 0,
        message: "could not remover user",
      });
    }
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
    const hasPending = Array.isArray(res.results)
      ? res.results.some((item) => item.pending)
      : false;

    callBack({
      success: res.success,
      message: res.success
        ? hasPending
          ? "Selected loans were submitted successfully and some are awaiting gateway callbacks"
          : "Selected loans were disbursed successfully"
        : "Some disbursements failed and need review",
      data: res.results,
    });
  });
});

const PORT = config.server.port;

const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
    logSystemEvent({
      level: "info",
      category: "server",
      source: "server.start",
      action: "startup",
      status: "success",
      message: `Server running on port ${PORT}`,
      metadata: {
        port: PORT,
      },
    });
  });
};

startServer();
