import React, { useContext, useEffect, useState } from "react";
import Navbar from "../../component/Navbar/Navbar";
import Card from "../../component/Card/Card";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../../component/ContextProvider/context";
import ForumSystem from "../../component/AiForumPage/ForumSystem";
import { ValidUserForPage } from "../../component/GlobalFunction/GlobalFunctionForResue";
import Loader from "../../component/Loader/Loader";
import InfiniteScroll from "react-infinite-scroll-component";

const Page = () => {
  const [postdata, setPostData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore,setHasMore] = useState(true);
  const [page,setPage] = useState(1);
  const validate = ValidUserForPage();
  const history = useNavigate();
  
  const googleLog = () => {

    // when we use google login we are redirecting to this page
    // that's why we get token from url and set the usertoken to our localstorage
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    
    if (token) {
      console.log("i m coming to save data");
      localStorage.setItem("userdatatoken", token); // Save the token in localStorage
      // Optionally, remove the token from the URL for a cleaner experience
      window.history.replaceState({}, document.title, "/");
    }
  }    

  const validateUser = async () => {
    validate();
  };


  const dataFetch = async () => {
    try {
      const res = await fetch("http://localhost:8099/allget?page=1&limit=9", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data && Array.isArray(data.userposts)) {
        setHasMore(data.hasMore);
        setPage(2);
        setPostData(data.userposts);
        setLoading(false);
      } else {
        console.error("Invalid data format received:", data);
        setPostData([]);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPostData([]);
      setLoading(false);
    }
  }

  const fetchMorePosts = async () => {
    setTimeout(async() => {
      if (!hasMore) return;
      try {
        const res = await fetch(`http://localhost:8099/allget?page=${page}&limit=9`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        if (data && Array.isArray(data.userposts)) {
          setPostData(prevPosts => [...prevPosts, ...data.userposts]);
          setHasMore(data.hasMore);
          setPage(prev => prev + 1);
        } else {
          console.error("Invalid data format received:", data);
        }
      } catch (error) {
        console.error("Error fetching more posts:", error);
      } finally {
        setLoading(false);
      }
    }, 2500);
  };

  useEffect(() => {
    const checkTokenAndValidate = async () => {
      googleLog();  // This sets the token if present
  
      // Wait until the token is set before calling validateUser
      const checkToken = () => localStorage.getItem("userdatatoken");
  
      let attempts = 0;
      const maxAttempts = 10; // Limit attempts to avoid infinite loop
  
      while (!checkToken() && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
        attempts++;
      }
  
      if (checkToken()) {
        validateUser(); // Only call if token is available
      }
    };
  
    checkTokenAndValidate();
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
                 <Loader></Loader>
                ) : postdata && postdata.length > 0 ? (
                  <InfiniteScroll
                      dataLength={postdata.length}
                      next={fetchMorePosts}
                      hasMore={hasMore}
                      loader={
                        <div className="flex justify-center my-4">
                        <Loader /> {/* Centered Loader */}
                      </div>
                      }
                      endMessage={
                        <p className="end-message">
                          You've seen all posts!
                        </p>
                      }
                    >
                  <div className=" grid grid-cols-1 md:grid-cols-3">
                    {postdata.map((post) => (
                      <div key={post._id} className="flex justify-center">
                        <Card post={post} />
                      </div>
                    ))}
                    
                  </div>
                  </InfiniteScroll>
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
