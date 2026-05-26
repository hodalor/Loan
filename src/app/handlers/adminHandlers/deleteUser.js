const Admins = require("../../models/admin");

const _removeUser = async (_id) => {
  let admin = await Admins.findOneAndDelete({ _id });

  if (admin) return admin;

  if (!admin) return null;
};

module.exports = _removeUser;
