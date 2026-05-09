const _structureData = async (data) => {
  const { inputs, customer } = data;

  const IDinfo = {
    idFront: customer.IDinfo.idFront,
    idBack: customer.IDinfo.idBack,
    firstName: customer.IDinfo.firstName,
    lastName: customer.IDinfo.lastName,
    middleName: customer.IDinfo.middleName,
    gender: customer.IDinfo.gender,
    gCardNumber:
      inputs.ghCard === "" ? customer.IDinfo.gCardNumber : inputs.ghCard,
  };

  const pesonalInfo = {
    dob: customer.pesonalInfo.dob,
    schoolStatus:
      inputs.inSchool === ""
        ? customer.pesonalInfo.schoolStatus
        : inputs.inSchool === "YES"
        ? true
        : false,
    educationalLevel:
      inputs.eduLev === ""
        ? customer.pesonalInfo.educationalLevel
        : inputs.eduLev,
    residenceType:
      inputs.resiType === ""
        ? customer.pesonalInfo.residenceType
        : inputs.resiType,
    maritalStatus:
      inputs.mStatus === ""
        ? customer.pesonalInfo.maritalStatus
        : inputs.mStatus,
    dAddress:
      inputs.dAddress === "" ? customer.pesonalInfo.dAddress : inputs.dAddress,
    areaName: inputs.aor === "" ? customer.pesonalInfo.areaName : inputs.aor,
    landMark:
      inputs.aLndMark === "" ? customer.pesonalInfo.landMark : inputs.aLndMark,
    residenceTime:
      inputs.resiYrs === ""
        ? customer.pesonalInfo.residenceTime
        : inputs.resiYrs,
    incomeSource: customer.pesonalInfo.incomeSource,
    relativesINOC: customer.pesonalInfo.relativesINOC,
    bUPphone:
      inputs.bupPh === "" ? customer.pesonalInfo.bUPphone : inputs.bupPh,
  };

  const workInfo = {
    workUnit: inputs.wrkUni === "" ? customer.workInfo.workUnit : inputs.wrkUni,
    industry: inputs.ind === "" ? customer.workInfo.industry : inputs.ind,
    workAddress:
      inputs.wkDAddress === ""
        ? customer.workInfo.workAddress
        : inputs.wkDAddress,
    companyAddress:
      inputs.wrkLocality === ""
        ? customer.workInfo.companyAddress
        : inputs.wrkLocality,
    LNDmarkCompany:
      inputs.wkLandMark === ""
        ? customer.workInfo.LNDmarkCompany
        : inputs.wkLandMark,
    workHours: inputs.wkHrs === "" ? customer.workInfo.workHours : inputs.wkHrs,
    currentIncome:
      inputs.inc === "" ? customer.workInfo.currentIncome : inputs.inc,
    workContent:
      inputs.wCont === "" ? customer.workInfo.workContent : inputs.wCont,
  };

  const emergncyContacts = {
    contact1: {
      name:
        inputs.nameCon1 === ""
          ? customer.emergncyContacts.contact1.name
          : inputs.nameCon1,
      phone:
        inputs.phoneCon1 === ""
          ? customer.emergncyContacts.contact1.phone
          : inputs.phoneCon1,
      educationalLevel:
        inputs.eduLevelCon1 === ""
          ? customer.emergncyContacts.contact1.educationalLevel
          : inputs.eduLevelCon1,
      relationship:
        inputs.releCon1 === ""
          ? customer.emergncyContacts.contact1.relationship
          : inputs.releCon1,
    },
    contact2: {
      name:
        inputs.nameCon2 === ""
          ? customer.emergncyContacts.contact2.name
          : inputs.nameCon2,
      phone:
        inputs.phoneCon2 === ""
          ? customer.emergncyContacts.contact2.phone
          : inputs.phoneCon2,
      educationalLevel:
        inputs.eduLevelCon2 === ""
          ? customer.emergncyContacts.contact2.educationalLevel
          : inputs.eduLevelCon2,
      relationship:
        inputs.releCon2 === ""
          ? customer.emergncyContacts.contact2.relationship
          : inputs.releCon2,
    },
    contact3: {
      name:
        inputs.nameCon3 === ""
          ? customer.emergncyContacts.contact3.name
          : inputs.nameCon3,
      phone:
        inputs.phoneCon3 === ""
          ? customer.emergncyContacts.contact3.phone
          : inputs.phoneCon3,
      educationalLevel:
        inputs.eduLevelCon3 === ""
          ? customer.emergncyContacts.contact3.educationalLevel
          : inputs.eduLevelCon3,
      relationship:
        inputs.releCon3 === ""
          ? customer.emergncyContacts.contact3.relationship
          : inputs.releCon3,
    },
  };

  const structuredData = {
    IDinfo,
    pesonalInfo,
    workInfo,
    emergncyContacts,
    level: inputs.customerLevel === "" ? customer.level : inputs.customerLevel,
    userId: customer.userId,
  };

  return structuredData;
};

export default _structureData;
