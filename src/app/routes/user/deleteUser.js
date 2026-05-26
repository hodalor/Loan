const express = require("express");
const User = require("../../models/users");
const {
  getAuditActorFromRequest,
  summarizeCustomer,
  logAuditEvent,
} = require("../../../libs/audit");

const router = express.Router();

router.patch("/deleteUser/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const actor = getAuditActorFromRequest(req);

    const deletedUser = await User.findByIdAndDelete({ _id: id });

    if (deletedUser) {
      await logAuditEvent({
        req,
        actor,
        source: "user.deleteUser",
        action: "delete",
        status: "success",
        message: "Customer account deleted successfully.",
        metadata: {
          target: summarizeCustomer(deletedUser),
        },
      });
      return res.status(200).json({
        success: 1,
        message: "User removed succeefully",
      });
    }

    if (!deletedUser)
      return res.status(400).json({
        success: 0,
        message: "could not remove user, please try again",
      });
  } catch (error) {
    console.log(error);
    await logAuditEvent({
      req,
      actor: getAuditActorFromRequest(req),
      level: "error",
      source: "user.deleteUser",
      action: "delete",
      status: "failed",
      message: error.message || "Customer deletion failed.",
      details: {
        stack: error.stack || "",
      },
      metadata: {
        targetId: req.params?.id || "",
      },
    });
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

module.exports = router;
