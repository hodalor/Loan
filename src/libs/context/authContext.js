import { createContext, useState, useEffect, useCallback } from "react";
import { _handleLogin } from "../../handlers";
import socket from "../socket";

export const AuthContext = createContext();

const CAPTCHA_DURATION = 60;

const generateCaptcha = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

export default function AuthContextProvider(props) {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [remember, setRemember] = useState(false);
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaExpiresIn, setCaptchaExpiresIn] = useState(CAPTCHA_DURATION);

  const _checkUser = useCallback(async () => {
    let respon = localStorage.getItem("user");
    let remb = localStorage.getItem("remember");

    let parsedData = await JSON.parse(respon);
    let rembData = await JSON.parse(remb);

    if (rembData !== null && rembData !== undefined) {
      setInputs((current) => ({
        ...current,
        userName: rembData.userName,
        password: rembData.password,
      }));

      setRemember(rembData.remember);
    }

    if (parsedData !== null && parsedData !== undefined) {
      setUser(parsedData);
      return setIsLogged(true);
    }

    setUser(null);
  }, []);

  useEffect(() => {
    _checkUser();
  }, [_checkUser]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCaptchaExpiresIn((current) => {
        if (current <= 1) {
          setCaptchaCode(generateCaptcha());
          setCaptchaInput("");
          return CAPTCHA_DURATION;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const [loader, setLoader] = useState(false);

  const [inputs, setInputs] = useState({
    userName: "",
    password: "",
  });

  const [alerts, setAlerts] = useState({
    open: false,
    msg: "",
    type: "",
  });

  const resetCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput("");
    setCaptchaExpiresIn(CAPTCHA_DURATION);
  };

  const _logIn = async () => {
    if (inputs.userName === "" || inputs.password === "") {
      resetCaptcha();
      return setAlerts({
        ...alerts,
        msg: "all fields are required",
        type: "warning",
        open: true,
      });
    }

    if (inputs.password.length < 6) {
      resetCaptcha();
      return setAlerts({
        ...alerts,
        msg: "password is too short",
        type: "warning",
        open: true,
      });
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      resetCaptcha();
      return setAlerts({
        ...alerts,
        msg: "captcha is wrong, please try again",
        type: "warning",
        open: true,
      });
    }

    setLoader(true);

    const response = await _handleLogin({
      userName: inputs.userName,
      password: inputs.password,
    });

    if (response.success === 0) {
      setLoader(false);
      resetCaptcha();

      setAlerts({
        ...alerts,
        type: "error",
        msg: response.message || "Login failed. Please try again.",
        open: true,
      });

      return;
    }

    response.data.isOnline = true;

    localStorage.setItem("user", JSON.stringify(response.data));
    setUser(response.data);

    if (!socket.connected) socket.connect();

    socket.emit("admin_on", {
      userId: response.data.userId,
      status: true,
      date: new Date(),
    });

    setLoader(false);
    resetCaptcha();

    setIsLogged(true);
  };

  const _handleOnchange = (data) => {
    if (data.field === "userName")
      return setInputs({
        ...inputs,
        userName: data.value,
      });

    if (data.field === "pass") {
      return setInputs({
        ...inputs,
        password: data.value,
      });
    }

    if (data.field === "captcha") {
      return setCaptchaInput(data.value.toUpperCase());
    }
  };

  const _handleRemember = (check) => {
    if (check) {
      if (inputs.userName === "" || inputs.password === "")
        return setAlerts({
          ...alerts,
          type: "error",
          msg: "please provide a user name and password",
          open: true,
        });

      setRemember(true);

      localStorage.setItem(
        "remember",
        JSON.stringify({
          userName: inputs.userName,
          password: inputs.password,
          remember: true,
        })
      );

      return;
    }

    if (!check) {
      setRemember(false);

      localStorage.removeItem("remember");

      return;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLogged,
        setIsLogged,
        user,
        setUser,
        _logIn,
        inputs,
        _handleOnchange,
        loader,
        alerts,
        setAlerts,
        remember,
        _handleRemember,
        _checkUser,
        captchaCode,
        captchaInput,
        captchaExpiresIn,
        resetCaptcha,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}
