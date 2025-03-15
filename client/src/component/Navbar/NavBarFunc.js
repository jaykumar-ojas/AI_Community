import { useContext } from "react";
import { LoginContext } from "../ContextProvider/context";
import { ValidUserForPage } from "../GlobalFunction/GlobalFunctionForResue";

export const LogOutUser = () => {
    
  const { setLoginData } = useContext(LoginContext);
  const validate = ValidUserForPage();
  const logoutUser =async()=>{
    validate();
    const token = localStorage.getItem("userdatatoken");
    if(!token){
      alert("user not login");
      return;
    }
    const data = await fetch("http://localhost:8099/logout",{
      method:"GET",
      headers:{
        "Content-Type":"application/json",
        "Authorization":token,
        Accept:"application/json"
      },
      credentials:"include"
    });
    const res = await data.json();
    if(!res || res.status===401){
      alert("logout not gonna happen");
    }
    else{
      localStorage.removeItem("userdatatoken");
      localStorage.removeItem('userData');
      setLoginData(null);
      alert("user successfully logout");
    }
  }
  return logoutUser;
};
