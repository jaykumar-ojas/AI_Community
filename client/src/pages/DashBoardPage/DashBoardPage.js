import React, { useContext, useEffect } from "react";
import { useInfiniteQuery } from '@tanstack/react-query';
import Navbar from "../../component/Navbar/Navbar";
import Card from "../../component/Card/Card";
import ForumSystem from "../../component/AiForumPage/ForumSystem";
import Loader from "../../component/Loader/Loader";
import InfiniteScroll from "react-infinite-scroll-component";
import Masonry from "react-masonry-css";
import { MasonrySkeletonGrid } from "./MansorySkeletonGrid";
import { LoginContext } from "../../component/ContextProvider/context";
import { handleGoogleLogin, validateToken } from "../../utils/authUtils";
import { useNavigate } from "react-router-dom";

const fetchPosts = async ({ pageParam = 1 }) => {
  const res = await fetch(`http://localhost:8099/allget?page=${pageParam}&limit=9`);
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
    <div className="h-full bg-bg_comment">
      <div className="mx-auto px-4">
        <div className="flex gap-8">
          <div className="flex-1">
            {isLoading ? (
              <MasonrySkeletonGrid />
            ) : allPosts.length > 0 ? (
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
                <div
                  id="scrollableDiv"
                  className="h-[calc(100vh-3.5rem)] overflow-y-auto no-scrollbar pt-2"
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
                </div>
              </InfiniteScroll>
            ) : (
              <div className="text-center text-gray-500">
                No posts available
              </div>
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
