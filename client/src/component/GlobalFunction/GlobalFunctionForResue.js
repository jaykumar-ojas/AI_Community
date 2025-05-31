import { useContext } from "react";
import { LoginContext } from "../ContextProvider/context";
import Login from "../Auth/Login";

// Add debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const ShowBox = () => {
  return (
    <div>
        <Login></Login>
    </div>
  );
};

export const ValidUserForPage = () => {
  const { setLoginData } = useContext(LoginContext);
  const removeData = () => {
    console.log("i m running when you put login by google")
    localStorage.removeItem("userdatatoken");
    localStorage.removeItem("userData");
    setLoginData(null);
  }

  const validateUser = async () => {
    let token = localStorage.getItem("userdatatoken");
    console.log(token,"this is i am on genral funcion");

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
        // Only remove data if we get a 401 or 403 status
        if (response.status === 401 || response.status === 403) {
          removeData();
          return false;
        }
        // For other errors, just return false but don't remove data
        return false;
      }

      const res = await response.json();

      if (!res || res.status === 401) {
        console.log("i didnt recive any good status taht y i delete all data");
        removeData();
        return false;
      } else {
        localStorage.setItem("userData", JSON.stringify(res));
        setLoginData(res);
        return true;
      }
    } catch (error) {
      console.log("Error in validate page:", error);
      // Don't remove data on network errors
      return false;
    }
  };

  // Debounce the validation function to prevent rapid calls
  return debounce(validateUser, 1000);
};


