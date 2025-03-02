import React, { useContext, useEffect, useState } from "react";
import Navbar from "../../component/Navbar/Navbar";
import Card from "../../component/Card/Card";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../../component/ContextProvider/context";
import Login from "../../component/Auth/Login";

const Page = () => {
  const { loginData, setLoginData } = useContext(LoginContext);
  const [postdata, setPostData] = useState([]);
  const [loading, setLoading] = useState(true);
  const history = useNavigate();
  
  const googleLog = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    
    if (token) {
      localStorage.setItem("userdatatoken", token); // Save the token in localStorage
      // Optionally, remove the token from the URL for a cleaner experience
      window.history.replaceState({}, document.title, "/");
    }
  }

  const dashboardValid = async () => {
    setLoading(true);
    let token = localStorage.getItem("userdatatoken");
    
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const data = await fetch("http://localhost:8099/validuser", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      const res = await data.json();
      if (!res || res.status === 401) {
        console.log("user not login");
        localStorage.removeItem("userdatatoken"); // Clear invalid token
      } else {
        setLoginData(res);
        // Only fetch posts after user data is loaded
        await dataFetch();
      }
    } catch (error) {
      console.error("Error validating user:", error);
    } finally {
      setLoading(false);
    }
  };

  const dataFetch = async () => {
    try {
      const res = await fetch("http://localhost:8099/allget", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data && data.userposts) {
        setPostData(data.userposts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }

  useEffect(() => {
    googleLog();
    dashboardValid();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar></Navbar>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2 mx-auto w-full">
        {loading ? (
          <div className="text-center col-span-3 mt-10">Loading posts...</div>
        ) : postdata && postdata.length > 0 ? (
          postdata.map((post) => (
            <div key={post._id} className="flex justify-center w-full">
              <Card post={post} />
            </div>
          ))
        ) : (
          <div className="text-center col-span-3 mt-10">No posts available</div>
        )}
      </div>
    </div>
  )
};

export default Page;
