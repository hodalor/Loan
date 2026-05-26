const Admins = require("../../models/admin");

const _setActiveStatus = async (userId) => {
  let admin = await Admins.findOne({ userId });

  if (!admin) return null;

  admin.isActive = !admin.isActive;

  await admin.save();

  return admin;
};

module.exports = _setActiveStatus;
