import React, { useContext, useEffect, useState } from "react";
import Navbar from "../../component/Navbar/Navbar";
import Card from "../../component/Card/Card";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../../component/ContextProvider/context";
import ForumSystem from "../../component/Postcontent/ForumSystem";
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
    <>
      <Navbar />
      {!loginData ? (
        <div className="flex justify-center items-center h-screen">
          <Login />
        </div>
      ) : (
        <div className="min-h-screen bg-gray-100">
          <div className="container mx-auto px-4 py-8">
            <div className="flex gap-8">
              {/* Main content area with grid layout */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : postdata && postdata.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {postdata.map((post) => (
                      <div key={post._id} className="flex justify-center">
                        <Card post={post} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">No posts available</div>
                )}
              </div>

              {/* Forum system on the right - sticky with scrolling */}
              <div className="w-96 relative hidden md:block">
                <div className="sticky top-20 h-[calc(100vh-6rem)] overflow-hidden">
                  <div className="h-full overflow-y-auto rounded-lg shadow-lg">
                    <ForumSystem />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Page;
