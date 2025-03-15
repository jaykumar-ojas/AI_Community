import { useContext } from "react";
import { LoginContext } from "../ContextProvider/context";

export const ValidUserForPage = () => {
    
  const { setLoginData } = useContext(LoginContext);

  const validateUser = async () => {
    console.log("i come for validate user in global");
    let token = localStorage.getItem("userdatatoken");
    console.log("i here come for token",token);

    if (!token) {
      return ;
    }

    try {
      const response = await fetch("http://localhost:8099/validuser", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const res = await response.json();

      if (!res || res.status === 401) {
        localStorage.removeItem("userdatatoken"); // Clear invalid token
        localStorage.removeItem("userData");
        setLoginData(null);
      } else {
        setLoginData(res); // No need for await here
        return true;
      }
    } catch (error) {
      localStorage.removeItem("userdatatoken"); // Clear invalid token
      localStorage.removeItem("userData");
      setLoginData(null);
    }
  };

  return validateUser;
};
