const createUser = require("./createUser");
const blockUser = require("./blockUser");
const deleteUser = require("./deleteUser");
const getUser = require("./getUser");
const paymentMethod = require("./paymentMethod");
const unblockUser = require("./unblockUser");
const verifyUser = require("./verifyUser");
const updateIdCard = require("./updateId");
const customerAuth = require("./customerAuth");

module.exports = {
  createUser,
  blockUser,
  deleteUser,
  getUser,
  paymentMethod,
  unblockUser,
  verifyUser,
  updateIdCard,
  customerAuth,
};
