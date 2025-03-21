import { useContext } from "react";
import { LoginContext } from "../ContextProvider/context";

export const ValidUserForPage = () => {
    
  const { setLoginData } = useContext(LoginContext);
  const removeData =()=>{
      console.log("i come to definety delete the data");
      localStorage.removeItem("userdatatoken"); // Clear invalid token
      localStorage.removeItem("userData");
      setLoginData(null);
  }

  const validateUser = async () => {
    console.log("i come here");
    let token = localStorage.getItem("userdatatoken");

    if (!token) {
      console.log("i didnt recive any token taht y i delete all data");
      removeData();
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
        console.log("i didnt recive any good status taht y i delete all data");
        removeData();
        setLoginData(null);
        return false;
      } else {
        console.log("i come here for saving data in loclastorage");
        localStorage.setItem("userData",JSON.stringify(res));
        setLoginData(res); // No need for await here
        return true;
      }
    } catch (error) {
      console.log("i didnt recive error taht y i delete all data");
      console.log("i am coming to error in validate page and remove data");
      removeData();
      return false;
    }
  };

  return validateUser;
};


