import React, { useContext, useEffect } from "react";
import { useInfiniteQuery } from '@tanstack/react-query';
import Card from "../../component/Card/Card";
import ForumSystem from "../../component/AiForumPage/ForumSystem";
import Loader from "../../component/Loader/Loader";
import InfiniteScroll from "react-infinite-scroll-component";
import Masonry from "react-masonry-css";
import { MasonrySkeletonGrid } from "./MansorySkeletonGrid";
import { LoginContext } from "../../component/ContextProvider/context";
import { handleGoogleLogin, validateToken } from "../../utils/authUtils";
import { useNavigate } from "react-router-dom";
const baseUrl = process.env.REACT_APP_BASE_URL;


const fetchPosts = async ({ pageParam = 1 }) => {
  const res = await fetch(`${baseUrl}/allget?page=${pageParam}&limit=9`);
  return res.json();
};

const Page = () => {
  const history = useNavigate();
  const { loginData, setLoginData } = useContext(LoginContext);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  });

  const allPosts = data?.pages.flatMap(page => page.userposts) || [];

  const validateUser = async () => {
    try {
      handleGoogleLogin();
      const userData = await validateToken();
      if (userData) {
        setLoginData(userData);
      } else if (!loginData) {
        history("/");
      }
    } catch (err) {
      console.error("Validation error", err);
    }
  };

  useEffect(() => {
    validateUser();
  }, []);

  const breakpointColumnsObj = {
    default: 3,
    1024: 2,
    768: 1,
  };

  return (
  <div className="relative h-[calc(100vh-4rem)]"> {/* Define explicit height */}
    <div className="relative z-10 h-full">
      <div className="mx-auto px-4 h-full"> {/* Add h-full */}
        <div className="flex gap-8 h-full"> {/* Add h-full */}
          <div className="flex-1 h-full"> {/* Add h-full */}
            {isLoading ? (
              <MasonrySkeletonGrid />
            ) : allPosts.length > 0 ? (
              <div
                id="scrollableDiv"
                className="h-full overflow-y-auto no-scrollbar pt-2" 
              >
                <InfiniteScroll
                  dataLength={allPosts.length}
                  next={fetchNextPage}
                  hasMore={hasNextPage}
                  loader={
                    <div className="flex justify-center my-4">
                      <Loader />
                    </div>
                  }
                  scrollThreshold="90%"
                  scrollableTarget="scrollableDiv"
                >
                  <Masonry
                    breakpointCols={breakpointColumnsObj}
                    className="flex gap-2"
                    columnClassName="flex flex-col gap-0"
                  >
                    {allPosts.map((post) => (
                      <div key={post._id}>
                        <Card post={post} />
                      </div>
                    ))}
                  </Masonry>
                </InfiniteScroll>
              </div>
            ) : (
              <div className="text-center text-gray-300 text-lg">
                No posts available
              </div>
            )}
          </div>

          {/* Forum section */}
          <div className="w-96 relative hidden md:block h-full"> {/* Add h-full */}
            <div className="sticky top-4 pt-2 pb-2 h-full overflow-hidden">
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