import React, { useContext, useEffect, useState } from "react";
import Navbar from "../../component/Navbar/Navbar";
import Card from "../../component/Card/Card";
import { useNavigate, Link } from "react-router-dom";
import { LoginContext } from "../../component/ContextProvider/context";
import ForumSystem from "../../component/AiForumPage/ForumSystem";
import { ValidUserForPage } from "../../component/GlobalFunction/GlobalFunctionForResue";
import Loader from "../../component/Loader/Loader";
import InfiniteScroll from "react-infinite-scroll-component";

const Page = () => {
  const [postdata, setPostData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isValidating, setIsValidating] = useState(false);
  const validate = ValidUserForPage();
  const history = useNavigate();
  const { loginData } = useContext(LoginContext);
  
  const googleLog = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    
    if (token) {
      localStorage.setItem("userdatatoken", token);
      window.history.replaceState({}, document.title, "/");
    }
  }    

  const validateUser = async () => {
    if (isValidating) return;
    setIsValidating(true);
    
    try {
      const isValid = await validate();
      if (!isValid && !loginData) {
        history("/");
      }
    } finally {
      setIsValidating(false);
    }
  };

  const dataFetch = async () => {
    try {
      // Fetch regular posts only
      const regularPostsRes = await fetch("http://localhost:8099/allget?page=1&limit=9", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const regularPostsData = await regularPostsRes.json();

      // Remove forum media posts fetch
      
      // Use only regular posts
      const allPosts = regularPostsData.userposts || [];

      if (allPosts.length > 0) {
        setHasMore(regularPostsData.hasMore);
        setPage(2);
        setPostData(allPosts);
        setLoading(false);
      } else {
        console.error("No posts found");
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
    console.log("i m calling again")
    setTimeout(async() => {
      if (!hasMore) return;
      try {
        // Fetch more regular posts only
        const regularPostsRes = await fetch(`http://localhost:8099/allget?page=${page}&limit=9`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const regularPostsData = await regularPostsRes.json();

        // Remove forum media posts fetch
        
        // Use only new regular posts
        const newPosts = regularPostsData.userposts || [];

        setPostData(prevPosts => [...prevPosts, ...newPosts]);
        setHasMore(regularPostsData.hasMore);
        setPage(prev => prev + 1);
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
        <div className="min-h-screen bg-gray-100">
          <div className="mx-auto px-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-3">
                    {postdata.map((post) => (
                      <div key={post._id} className="flex justify-center">
                        <Card post={post} />
                      </div>
                    ))}
                  </div>
                  </InfiniteScroll>
                ) : (
                  <div className="text-center text-gray-500">No posts available</div>
                )}
              </div>

              {/* Forum system on the right - sticky with scrolling */}
              <div className="w-96 relative hidden md:block">
                <div className="sticky top-2 max-h-[calc(100vh-3.5rem)] overflow-hidden">
                  <div className="h-full overflow-y-auto rounded-lg shadow-lg">
                    <ForumSystem />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
};

export default Page;
