import React, { useContext, useEffect, useState } from "react";
import Navbar from "../../component/Navbar/Navbar";
import Card from "../../component/Card/Card";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../../component/ContextProvider/context";
import ForumSystem from "../../component/AiForumPage/ForumSystem";
import Loader from "../../component/Loader/Loader";
import InfiniteScroll from "react-infinite-scroll-component";
import { handleGoogleLogin, validateToken } from "../../utils/authUtils";

const Page = () => {
  const [postdata, setPostData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isValidating, setIsValidating] = useState(false);
  const history = useNavigate();
  const { loginData, setLoginData } = useContext(LoginContext);

  const validateUser = async () => {
    if (isValidating) return;
    setIsValidating(true);
    
    try {
      // Handle Google login if token is in URL
      handleGoogleLogin();
      
      // Validate token and get user data
      const userData = await validateToken();
      if (userData) {
        setLoginData(userData);
      } else if (!loginData) {
        history("/");
      }
    } finally {
      setIsValidating(false);
    }
  };

  const dataFetch = async () => {
    try {
      const regularPostsRes = await fetch("http://localhost:8099/allget?page=1&limit=9", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const regularPostsData = await regularPostsRes.json();
      const allPosts = regularPostsData.userposts || [];

      if (allPosts.length > 0) {
        setHasMore(regularPostsData.hasMore);
        setPage(2);
        setPostData(allPosts);
      } else {
        console.error("No posts found");
        setPostData([]);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPostData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMorePosts = async () => {
    if (!hasMore) return;
    
    try {
      const regularPostsRes = await fetch(`http://localhost:8099/allget?page=${page}&limit=9`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const regularPostsData = await regularPostsRes.json();
      const newPosts = regularPostsData.userposts || [];

      setPostData(prevPosts => [...prevPosts, ...newPosts]);
      setHasMore(regularPostsData.hasMore);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error("Error fetching more posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateUser();
    dataFetch();
  }, []);

  return (
    <div className="min-h-screen bg-bg_comment">
      <div className="mx-auto px-4">
        <div className="flex gap-8">
          <div className="flex-1">
            {loading ? (
              <Loader />
            ) : postdata && postdata.length > 0 ? (
              <InfiniteScroll
                dataLength={postdata.length}
                next={fetchMorePosts}
                hasMore={hasMore}
                loader={
                  <div className="flex justify-center my-4">
                    <Loader />
                  </div>
                }
                endMessage={
                  <p className="text-center text-gray-500 my-4">
                    You've seen all posts!
                  </p>
                }
                scrollThreshold="90%"
                scrollableTarget="scrollableDiv"
              >
                <div id="scrollableDiv" className="h-[calc(100vh-3.5rem)] overflow-y-auto no-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-3">
                    {postdata.map((post) => (
                      <div key={post._id} className="flex justify-center">
                        <Card post={post} />
                      </div>
                    ))}
                  </div>
                </div>
              </InfiniteScroll>
            ) : (
              <div className="text-center text-gray-500">No posts available</div>
            )}
          </div>

          <div className="w-96 relative hidden md:block">
            <div className="sticky top-0 pt-2 h-[calc(100vh-3.5rem)] overflow-hidden">
              <div className="h-full rounded-lg shadow-lg">
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
