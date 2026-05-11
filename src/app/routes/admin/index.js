const createAdmin = require("./createAdmin");
const getAdmin = require("./getAdmin");
const getAllAdmins = require("./getAllAdmins");
const updateAdmin = require("./updateAdmin");
const login = require("./login");
const systemConfig = require("./systemConfig");
const staffGroups = require("./staffGroups");

module.exports = {
  login,
  createAdmin,
  getAdmin,
  getAllAdmins,
  updateAdmin,
  systemConfig,
  staffGroups,
};
