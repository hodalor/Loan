const express = require("express");
const { upload } = require("../../../libs/uploadImage");
const _generateString = require("../../../libs/generateID");
const {
  getAuditActorFromRequest,
  summarizeCustomer,
  logAuditEvent,
} = require("../../../libs/audit");
const User = require("../../models/users");
const CustomerAccess = require("../../models/customerAccess");

const router = express.Router();

router.post("/createUser", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      middleName,
      phone,
      dob,
      gender,
      ghCard,
      inSchool,
      eduLevel,
      resiType,
      digAddressResi,
      areaResi,
      lnmkResi,
      resiTime,
      incomeSource,
      nRelCare,
      email,
      bPhone,
      mStatus,
      wkUnit,
      industType,
      wkAddress,
      compAddress,
      wkLnmk,
      wkHrs,
      mthInc,
      wkContent,
      emContact1,
      emContact2,
      emContact3,
      isVerified,
      isRegistered,
      contacts,
      idFront,
      idBack,
    } = req.body;
    const actor = getAuditActorFromRequest(req);

    const checkMail = await User.findOne({ email });

    if (checkMail !== undefined && checkMail) {
      await logAuditEvent({
        req,
        actor,
        source: "user.createUser",
        action: "create",
        status: "failed",
        message: "Customer creation failed because the email already exists.",
        metadata: {
          email: String(email || "").trim(),
          phone: String(phone || "").trim(),
        },
      });
      return res.status(400).json({
        success: 0,
        message: "This email already exist please log in!",
      });
    }

    const IDinfo = {
      idFront,
      idBack,
      firstName,
      lastName,
      middleName,
      gender,
      gCardNumber: ghCard,
    };

    const pesonalInfo = {
      dob,
      schoolStatus: inSchool === "Yes" ? true : false,
      educationalLevel: eduLevel,
      residenceType: resiType,
      dAddress: digAddressResi,
      areaName: areaResi,
      landMark: lnmkResi,
      residenceTime: resiTime,
      incomeSource,
      maritalStatus: mStatus,
      relativesINOC: nRelCare,
      bUPphone: bPhone,
    };

    const workInfo = {
      workUnit: wkUnit,
      industry: industType,
      workAddress: wkAddress,
      companyAddress: compAddress,
      LNDmarkCompany: wkLnmk,
      workHours: wkHrs,
      currentIncome: mthInc,
      workContent: wkContent,
    };

    const loan = {
      isApplied: false,
      loanStatus: "Not applied", // Granted, Review, Rejected, Not applied
      paymentStatus: "Not payed", // Not payed, Payed, Overdue,
      acumulatedOverDue: 0,
      loans: [],
    };

    const emergncyContacts = {
      contact1: {
        name: emContact1.name,
        phone: emContact1.phone,
        educationalLevel: emContact1.eduLevel,
        relationship: emContact1.rele,
      },
      contact2: {
        name: emContact2.name,
        phone: emContact2.phone,
        educationalLevel: emContact2.eduLevel,
        relationship: emContact2.rele,
      },
      contact3: {
        name: emContact3.name,
        phone: emContact3.phone,
        educationalLevel: emContact3.eduLevel,
        relationship: emContact3.rele,
      },
    };

    const generatedID = await _generateString(6);

    const user = new User({
      isActive: true,
      email,
      phone,
      userId: generatedID,
      isVerified,
      isRegistered,
      level: 1,
      contacts,
      IDinfo,
      pesonalInfo,
      workInfo,
      emergncyContacts,
      loan,
    });

    const savedUser = await user.save();

    if (savedUser) {
      await CustomerAccess.findOneAndUpdate(
        { phone },
        {
          $set: {
            phone,
            userId: savedUser.userId,
            customerId: savedUser._id,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      await logAuditEvent({
        req,
        actor,
        source: "user.createUser",
        action: "create",
        status: "success",
        message: "Customer account created successfully.",
        metadata: {
          target: summarizeCustomer(savedUser),
        },
      });

      return res.status(201).json({
        success: 1,
        data: savedUser,
      });
    }

    if (!savedUser)
      return res.status(400).json({
        success: 0,
        message: "Could not create user please try again",
      });
  } catch (error) {
    console.log(error);
    await logAuditEvent({
      req,
      actor: getAuditActorFromRequest(req),
      level: "error",
      source: "user.createUser",
      action: "create",
      status: "failed",
      message: error.message || "Customer creation failed.",
      details: {
        stack: error.stack || "",
      },
      metadata: {
        email: String(req.body?.email || "").trim(),
        phone: String(req.body?.phone || "").trim(),
      },
    });
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

module.exports = router;
