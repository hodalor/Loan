const Users = require("../../models/users");

const _setCustomerActiveStatus = async (userId) => {
  let user = await Users.findOne({ userId });

  if (!user) return null;

  user.isActive = !user.isActive;

  await user.save();

  return user;
};

module.exports = _setCustomerActiveStatus;
