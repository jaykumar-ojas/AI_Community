import React, { useContext, useEffect } from "react";
import Navbar from "../../component/Navbar/Navbar";
import Card from "../../component/Card/Card";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../../component/ContextProvider/context";

const Page = () => {
  const { loginData, setLoginData } = useContext(LoginContext);
  console.log(loginData);
  const history = useNavigate();
  const googleLog= ()=>{
    console.log("first i am");
      console.log("i am here");
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      
      if (token) {
        localStorage.setItem("userdatatoken", token); // Save the token in localStorage
        console.log("Token saved to localStorage:", token);
    
        // Optionally, remove the token from the URL for a cleaner experience
        window.history.replaceState({}, document.title, "/");
      }
  }

  

  const dashboardValid = async () => {
    console.log("second i am");
    let token = localStorage.getItem("userdatatoken");
    console.log(token);
    const data = await fetch("http://localhost:8099/validuser", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    const res = await data.json();
    console.log(res);
    if (!res || res.status == 401) {
      console.log("user not verified");
      history("/login");
    } else {
      setLoginData(res);
      console.log("user verified");
    }
  };

  useEffect(() => {
    googleLog();
    dashboardValid();
  },[]);
  return (
    <>
      <Navbar></Navbar>
      <div className="grid grid-cols-4 min-h-screen mx-auto w-full">
        {Array.from({ length: 16 }, (_, i) => (
          <div key={i} className="flex justify-center">
            <Card />
          </div>
        ))}
      </div>
    </>
  );
};

export default Page;
