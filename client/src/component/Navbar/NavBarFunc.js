import { useContext } from "react";
import { LoginContext } from "../ContextProvider/context";
import { ValidUserForPage } from "../GlobalFunction/GlobalFunctionForResue";

export const LogOutUser = () => {
    
  const { setLoginData } = useContext(LoginContext);
  const validate = ValidUserForPage();
  
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const logoutUser =async()=>{
    await validate();
    const token = localStorage.getItem("userdatatoken");
    if(!token){
      localStorage.removeItem("userdatatoken");
      localStorage.removeItem('userData');
      setLoginData(null);
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
      localStorage.removeItem('userData');  
      localStorage.removeItem("userdatatoken");
      while (localStorage.getItem("userdatatoken") !== null ||  localStorage.getItem("userData") !== null ) {
        console.log("Waiting for localStorage to clear...");
        await sleep(500); // Wait 500ms and check again
      }

      setTimeout(() => {
        setLoginData(null);
      }, 3000); 

    //   alert("user successfully logout");
    }
  }
  return logoutUser;
};