const express = require("express");
const { upload } = require("../../../libs/uploadImage");
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
      const user = await User.findOne({ userId: req.params.userId });
      if (!user) {
        return res.status(404).json({
          success: 0,
          message: "Customer not found.",
        });
      }

      const url = `${req.protocol}://${req.get("host")}`;
      const idFront = req.files?.idFrontImage?.[0]
        ? `${url}/upload/${req.files.idFrontImage[0].filename}`
        : user.IDinfo.idFront;
      const idBack = req.files?.idBackImage?.[0]
        ? `${url}/upload/${req.files.idBackImage[0].filename}`
        : user.IDinfo.idBack;
      const livePhoto = req.files?.livePhotoImage?.[0]
        ? `${url}/upload/${req.files.livePhotoImage[0].filename}`
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

      if (updatedUser)
        return res.status(200).json({
          success: 1,
          message: "Identity updated successfully",
          data: updatedUser,
        });

      if (!updatedUser)
        return res.status(400).json({
          success: 0,
          message: "could not process request, please try again",
        });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: 0,
        message: "Internal error: code(500)!",
      });
    }
  }
);

module.exports = router;
