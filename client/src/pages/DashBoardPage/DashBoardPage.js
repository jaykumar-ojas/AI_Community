import React, { useContext, useEffect, useState } from "react";
import Navbar from "../../component/Navbar/Navbar";
import Card from "../../component/Card/Card";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../../component/ContextProvider/context";

const Page = () => {
  const { loginData, setLoginData } = useContext(LoginContext);
  console.log(loginData,"this is my logindata");
  const [postdata,setPostData]=useState([]);
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
      console.log("aftr i finished now it starting data fetch");
      console.log("user verified");
    }
  };
  useEffect(() => {
    dataFetch();
  }, [loginData]);

  const dataFetch = async()=>{
    console.log("after fetching logindata",loginData);
    const userId=loginData ?loginData.validuserone._id:"";
    console.log("this is user id",userId);
    console.log("i am goint to request");
    const res = await fetch("http://localhost:8099/allget",{
      method:'GET',
      headers:{
        'Content-Type':'application/json'
      }
    });
    console.log("i back from requrest");
    const data= await res.json();
    console.log("this data come from" ,data);
    if(data){
      setPostData(data.userposts);
    }
  }

  useEffect(() => {
    googleLog();
    dashboardValid();
  },[]);

  return (
    <div className="min-h-screen">
      <Navbar></Navbar>

      <div className="grid grid-cols-3  gap-2 mt-2 mx-auto w-full">
        {postdata ? (
          postdata.map((post) => (
            <div key={post._id} className="flex justify-center w-full">
                <Card post={post} />
            </div>
          ))
        ) : (
          // Add a fallback UI when postdata is empty
          <div className="text-center col-span-3 mt-10">Loading posts...</div>
        )}
      </div>
    </div>
  )
};

export default Page;
