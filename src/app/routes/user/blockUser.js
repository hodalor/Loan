const express = require("express");
const User = require("../../models/users");
const {
  getAuditActorFromRequest,
  summarizeCustomer,
  logAuditEvent,
} = require("../../../libs/audit");

const router = express.Router();

router.patch("/blockUser/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const actor = getAuditActorFromRequest(req);
    const targetUser = await User.findById(id);

    if (!targetUser) {
      await logAuditEvent({
        req,
        actor,
        source: "user.blockUser",
        action: "block",
        status: "failed",
        message: "Customer block failed because the user was not found.",
        metadata: {
          targetId: id,
        },
      });
      return res.status(404).json({
        success: 0,
        message: "could not identify user, please try again",
      });
    }

    const blockedUser = await User.updateOne(
      { _id: id },
      {
        $set: {
          isActive: false,
        },
      }
    );

    if (blockedUser.modifiedCount >= 1) {
      await logAuditEvent({
        req,
        actor,
        source: "user.blockUser",
        action: "block",
        status: "success",
        message: "Customer account blocked successfully.",
        metadata: {
          target: summarizeCustomer({
            ...targetUser.toObject(),
            isActive: false,
          }),
        },
      });
      return res.status(200).json({
        success: 1,
        message: "user blocked succeefully",
      });
    }

    if (blockedUser.modifiedCount < 1) {
      await logAuditEvent({
        req,
        actor,
        source: "user.blockUser",
        action: "block",
        status: "failed",
        message: "Customer block request completed without changing the account state.",
        metadata: {
          target: summarizeCustomer(targetUser),
        },
      });
      return res.status(400).json({
        success: 0,
        message: "could not block user, please try again",
      });
    }
  } catch (error) {
    console.log(error);
    await logAuditEvent({
      req,
      actor: getAuditActorFromRequest(req),
      level: "error",
      source: "user.blockUser",
      action: "block",
      status: "failed",
      message: error.message || "Customer block failed.",
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
