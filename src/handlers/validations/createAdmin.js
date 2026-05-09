const _createAdmin = async (data) => {
  let resp = {};

  const {
    firstName,
    lastName,
    userName,
    password,
    email,
    phone,
    role,
    department,
    gender,
  } = data;

  const validateEmail = (value) => {
    return String(value)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  if (
    firstName === "" ||
    lastName === "" ||
    userName === "" ||
    password === "" ||
    email === "" ||
    phone === "" ||
    role === "" ||
    department === "" ||
    gender === ""
  )
    return (resp = { success: false, message: "Please provide all fields" });

  if (phone.length !== 10)
    return (resp = {
      success: false,
      message: "Please provide a valid phone number",
    });

  if (isNaN(phone))
    return (resp = {
      success: false,
      message: "Please provide a valid phone number",
    });

  if (password.length < 6)
    return (resp = {
      success: false,
      message: "Please password must be more than 6 characters",
    });

  if (!validateEmail(email))
    return (resp = {
      success: false,
      message: "Please provide a valid email",
    });

  resp = {
    success: true,
    message: "",
  };

  return resp;
};

export default _createAdmin;
