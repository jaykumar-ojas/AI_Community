import React, { useContext, useEffect, useState } from "react";
import Navbar from "../../component/Navbar/Navbar";
import Card from "../../component/Card/Card";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../../component/ContextProvider/context";
import ForumSystem from "../../component/Postcontent/ForumSystem";
import Login from "../../component/Auth/Login";
import { validUserForPage } from "../../component/GlobalFunction/GlobalFunctionForResue";

const Page = () => {
  const { loginData, setLoginData } = useContext(LoginContext);
  const [postdata, setPostData] = useState([]);
  const [loading, setLoading] = useState(true);
  const history = useNavigate();
  
  const googleLog = () => {
    // when we use google login we are redirecting to this page
    // that's why we get token from url and set the usertoken to our localstorage
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    
    if (token) {
      localStorage.setItem("userdatatoken", token); // Save the token in localStorage
      // Optionally, remove the token from the URL for a cleaner experience
      window.history.replaceState({}, document.title, "/");
    }
  }

  const validateUser = async () => {
    let token = localStorage.getItem("userdatatoken");

    
    console.log("i am here");
    if(!loginData){

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
      console.log("i am printing result");
      if (!res || res.status === 401) {
        localStorage.removeItem("userdatatoken"); // Clear invalid token
      } else {
        console.log(res);
        setLoginData(res.validuserone); // No need for await here
        localStorage.setItem("userdatatoken",token);
        localStorage.setItem("userData", JSON.stringify(res.validuserone)); 
      }
    } catch (error) {
      console.error("Error validating user:", error);
      localStorage.removeItem("userdatatoken");
      return false;
    }
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
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }

  console.log(postdata);

  useEffect(() => {
    googleLog();
    validateUser();
    dataFetch();
  }, []);

  return (
    <>
      <Navbar />
        <div className="min-h-screen bg-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex gap-8">
              {/* Main content area with grid layout */}
              <div className="flex-1">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : postdata && postdata.length > 0 ? (
                  <div className=" grid grid-cols-1 md:grid-cols-3">
                    {postdata.map((post) => (
                      <div key={post._id} className="flex justify-center">
                        <Card post={post} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className=" text-center text-gray-500">No posts available</div>
                )}
              </div>

              {/* Forum system on the right - sticky with scrolling */}
              <div className=" w-96  relative hidden md:block">
                <div className=" sticky top-20 h-[calc(100vh-6rem)] overflow-hidden">
                  <div className=" h-full overflow-y-auto rounded-lg shadow-lg">
                    <ForumSystem />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </>
  );
};

export default Page;
