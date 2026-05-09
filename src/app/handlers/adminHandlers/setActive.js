const Admins = require("../../models/admin");

const _setActiveStatus = async (userId) => {
  let admin = await Admins.findOne({ userId });

  admin.isActive = !admin.isActive;

  await admin.save();
};

module.exports = _setActiveStatus;
