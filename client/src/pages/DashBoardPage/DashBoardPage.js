import React, { useContext, useEffect, useState } from "react";
import Navbar from "../../component/Navbar/Navbar";
import Card from "../../component/Card/Card";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../../component/ContextProvider/context";

const Page = () => {
  const { loginData, setLoginData } = useContext(LoginContext);
  const [postdata,setPostData]=useState([]);
  const history = useNavigate();
  const googleLog= ()=>{
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      
      if (token) {
        localStorage.setItem("userdatatoken", token); // Save the token in localStorage
        // Optionally, remove the token from the URL for a cleaner experience
        window.history.replaceState({}, document.title, "/");
      }
  }

  

  const dashboardValid = async () => {
    let token = localStorage.getItem("userdatatoken");
    const data = await fetch("http://localhost:8099/validuser", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    const res = await data.json();
    if (!res || res.status == 401) {
      history("/login");
    } else {
      setLoginData(res);
    }
  };
  useEffect(() => {
    dataFetch();
    console.log(loginData);
  }, [loginData]);

  const dataFetch = async()=>{
    const userId=loginData ?loginData.validuserone._id:"";
    const res = await fetch("http://localhost:8099/allget",{
      method:'GET',
      headers:{
        'Content-Type':'application/json'
      }
    });
    const data= await res.json();
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
