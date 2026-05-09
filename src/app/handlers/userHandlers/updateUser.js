const Users = require("../../models/users");

const _updateUser = async (data) => {
  const { IDinfo, pesonalInfo, workInfo, emergncyContacts, level, userId } = data;

  try {
    const updatedUser = await Users.findOneAndUpdate(
      { userId },
      {
        $set: {
          IDinfo,
          pesonalInfo,
          workInfo,
          emergncyContacts,
          level,
        },
      },
      {
        new: true,
      }
    );

    if (updatedUser) return true;

    if (!updatedUser) return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = _updateUser;
