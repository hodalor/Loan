const Admins = require("../../models/admin");

const _removeUser = async (_id) => {
  let admin = await Admins.findOneAndDelete({ _id });

  if (admin) return true;

  if (!admin) return false;
};

module.exports = _removeUser;
