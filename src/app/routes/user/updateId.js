const express = require("express");
const { upload } = require("../../../libs/uploadImage");
const { resolveUploadedFileUrl, resolveUserMediaUrls } = require("../../../libs/mediaStorage");
const {
  getAuditActorFromRequest,
  summarizeCustomer,
  logAuditEvent,
} = require("../../../libs/audit");
const User = require("../../models/users");

const router = express.Router();
const uploadIdentityAssets = (req, res, next) =>
  upload.fields([
    { name: "idFrontImage", maxCount: 1 },
    { name: "idBackImage", maxCount: 1 },
    { name: "livePhotoImage", maxCount: 1 },
  ])(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: 0,
        message: error.message || "Invalid image upload.",
      });
    }

    return next();
  });

router.patch(
  "/updateId/:userId",
  uploadIdentityAssets,
  async (req, res) => {
    try {
      const actor = getAuditActorFromRequest(req);
      const user = await User.findOne({ userId: req.params.userId });
      if (!user) {
        await logAuditEvent({
          req,
          actor,
          source: "user.updateId",
          action: "update-identity",
          status: "failed",
          message: "Customer identity update failed because the customer was not found.",
          metadata: {
            targetUserId: String(req.params.userId || "").trim(),
          },
        });
        return res.status(404).json({
          success: 0,
          message: "Customer not found.",
        });
      }

      const idFront = req.files?.idFrontImage?.[0]
        ? await resolveUploadedFileUrl(req, req.files.idFrontImage[0], "identity/front")
        : user.IDinfo.idFront;
      const idBack = req.files?.idBackImage?.[0]
        ? await resolveUploadedFileUrl(req, req.files.idBackImage[0], "identity/back")
        : user.IDinfo.idBack;
      const livePhoto = req.files?.livePhotoImage?.[0]
        ? await resolveUploadedFileUrl(req, req.files.livePhotoImage[0], "identity/selfie")
        : user.userImage;
      const gCardNumber = String(
        req.body?.gCardNumber || user.IDinfo.gCardNumber || ""
      ).trim();

      const IDinfo = {
        idFront,
        idBack,
        firstName: user.IDinfo.firstName,
        lastName: user.IDinfo.lastName,
        middleName: user.IDinfo.middleName,
        gender: user.IDinfo.gender,
        gCardNumber,
      };

      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            IDinfo,
            userImage: livePhoto,
          },
        },
        {
          new: true,
        }
      );

      if (updatedUser) {
        await logAuditEvent({
          req,
          actor,
          source: "user.updateId",
          action: "update-identity",
          status: "success",
          message: "Customer identity assets were updated successfully.",
          details: {
            changedFields: [
              ...(req.files?.idFrontImage?.[0] ? ["idFront"] : []),
              ...(req.files?.idBackImage?.[0] ? ["idBack"] : []),
              ...(req.files?.livePhotoImage?.[0] ? ["userImage"] : []),
              ...(gCardNumber !== String(user.IDinfo.gCardNumber || "").trim()
                ? ["gCardNumber"]
                : []),
            ],
          },
          metadata: {
            target: summarizeCustomer(updatedUser),
          },
        });
        return res.status(200).json({
          success: 1,
          message: "Identity updated successfully",
          data: await resolveUserMediaUrls(req, updatedUser),
        });
      }

      if (!updatedUser)
        return res.status(400).json({
          success: 0,
          message: "could not process request, please try again",
        });
    } catch (error) {
      console.log(error);
      await logAuditEvent({
        req,
        actor: getAuditActorFromRequest(req),
        level: "error",
        source: "user.updateId",
        action: "update-identity",
        status: "failed",
        message: error.message || "Customer identity update failed.",
        details: {
          stack: error.stack || "",
        },
        metadata: {
          targetUserId: String(req.params?.userId || "").trim(),
        },
      });
      return res.status(500).json({
        success: 0,
        message: "Internal error: code(500)!",
      });
    }
  }
);

module.exports = router;
