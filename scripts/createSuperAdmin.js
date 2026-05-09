const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Admin = require("../src/app/models/admin");
const { _encrypt } = require("../src/libs/encrypt");
const generateID = require("../src/libs/generateID");

const payload = {
  firstName: "PRINCE",
  lastName: "SUPER ADMIN",
  userName: "PRINCE",
  email: process.env.SUPER_ADMIN_EMAIL || "prince@admin.local",
  phone: "0243984046",
  password: process.env.SUPER_ADMIN_PASSWORD || "0243984046",
  gender: process.env.SUPER_ADMIN_GENDER || "Male",
  role: "super-admin",
  department: process.env.SUPER_ADMIN_DEPARTMENT || "management",
  permissions: [],
};

async function createOrUpdateSuperAdmin() {
  await connectDB();

  const encryptedPassword = await _encrypt(payload.password);
  const existingAdmin = await Admin.findOne({
    $or: [{ userName: payload.userName }, { phone: payload.phone }],
  });

  if (existingAdmin) {
    existingAdmin.firstName = payload.firstName;
    existingAdmin.lastName = payload.lastName;
    existingAdmin.userName = payload.userName;
    existingAdmin.email = payload.email;
    existingAdmin.phone = payload.phone;
    existingAdmin.password = encryptedPassword;
    existingAdmin.gender = payload.gender;
    existingAdmin.role = payload.role;
    existingAdmin.department = payload.department;
    existingAdmin.permissions = payload.permissions;
    existingAdmin.isActive = true;
    existingAdmin.isOnline = false;
    await existingAdmin.save();
    console.log(`Updated super admin: ${existingAdmin.userName}`);
    return;
  }

  const userId = String(await generateID(6)).trim();

  const admin = new Admin({
    ...payload,
    userId,
    password: encryptedPassword,
    isActive: true,
    isOnline: false,
  });

  await admin.save();
  console.log(`Created super admin: ${admin.userName}`);
}

createOrUpdateSuperAdmin()
  .then(async () => {
    await mongoose.connection.close();
  })
  .catch(async (error) => {
    console.error("Unable to create super admin", error);
    await mongoose.connection.close();
    process.exit(1);
  });
