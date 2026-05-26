const express = require("express");
const User = require("../../models/users");
const {
  getAuditActorFromRequest,
  summarizeCustomer,
  logAuditEvent,
} = require("../../../libs/audit");

const router = express.Router();

router.patch("/unblockUser/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const actor = getAuditActorFromRequest(req);
    const targetUser = await User.findById(id);

    if (!targetUser) {
      await logAuditEvent({
        req,
        actor,
        source: "user.unblockUser",
        action: "unblock",
        status: "failed",
        message: "Customer unblock failed because the user was not found.",
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
          isActive: true,
        },
      }
    );

    if (blockedUser.modifiedCount >= 1) {
      await logAuditEvent({
        req,
        actor,
        source: "user.unblockUser",
        action: "unblock",
        status: "success",
        message: "Customer account unblocked successfully.",
        metadata: {
          target: summarizeCustomer({
            ...targetUser.toObject(),
            isActive: true,
          }),
        },
      });
      return res.status(200).json({
        success: 1,
        message: "user unblocked succeefully",
      });
    }

    if (blockedUser.modifiedCount < 1) {
      await logAuditEvent({
        req,
        actor,
        source: "user.unblockUser",
        action: "unblock",
        status: "failed",
        message: "Customer unblock request completed without changing the account state.",
        metadata: {
          target: summarizeCustomer(targetUser),
        },
      });
      return res.status(400).json({
        success: 0,
        message: "could not unblock user, please try again",
      });
    }
  } catch (error) {
    console.log(error);
    await logAuditEvent({
      req,
      actor: getAuditActorFromRequest(req),
      level: "error",
      source: "user.unblockUser",
      action: "unblock",
      status: "failed",
      message: error.message || "Customer unblock failed.",
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
