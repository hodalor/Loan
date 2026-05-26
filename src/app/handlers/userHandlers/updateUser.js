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

    if (updatedUser) return updatedUser;

    if (!updatedUser) return null;
  } catch (error) {
    console.log(error);
    return null;
  }
};

module.exports = _updateUser;
