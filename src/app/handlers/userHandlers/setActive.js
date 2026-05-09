const Users = require("../../models/users");

const _setCustomerActiveStatus = async (userId) => {
  let user = await Users.findOne({ userId });

  user.isActive = !user.isActive;

  await user.save();
};

module.exports = _setCustomerActiveStatus;
