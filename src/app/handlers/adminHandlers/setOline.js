const Admins = require("../../models/admin");

const _setOnLineStatus = async (data) => {
  const { userId, status, date } = data;

  let admin = await Admins.findOne({ userId });

  admin.logData.push({ date, status });
  admin.isOnline = status;

  await admin.save();
};

module.exports = _setOnLineStatus;
