import { useContext } from "react";
import { LoginContext } from "../ContextProvider/context";

export const ValidUserForPage = () => {
    
  const { setLoginData } = useContext(LoginContext);

  const validateUser = async () => {
    let token = localStorage.getItem("userdatatoken");

    if (!token) {
      return false;
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
        return false;
      } else {
        setLoginData(res); // No need for await here
        return true;
      }
    } catch (error) {
      console.error("Error validating user:", error);
      localStorage.removeItem("userdatatoken");
      return false;
    }
  };

  return validateUser;
};
