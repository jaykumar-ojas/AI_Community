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
import { useNavigate, useOutletContext } from "react-router-dom";
const baseUrl = process.env.REACT_APP_BASE_URL;


const fetchPosts = async ({ pageParam = 1 }) => {
  const res = await fetch(`${baseUrl}/allget?page=${pageParam}&limit=9`);
  return res.json();
};

const Page = () => {
  const history = useNavigate();
  const { loginData, setLoginData } = useContext(LoginContext);
  const { showForum, setShowForum } = useOutletContext();

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

  // Mobile breakpoint for single column
  const mobileBreakpointColumnsObj = {
    default: 1,
  };

  return (
    <>
     <div className="relative min-h-screen overflow-hidden">
        {/* Content */}
        <div className="relative z-10 min-h-screen overflow-hidden">
          <div className="mx-auto md:px-4 md:pb-0 pb-20 ">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
              {/* Main content area */}
              <div className={classNames(
                "transition-all duration-300 ease-in-out",
                showForum ? "hidden sm:flex sm:flex-1" : "flex-1"
              )}>
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
                    className="overflow-visible"
                  >
                    <div
                      id="scrollableDiv"
                      className="sm:h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar pt-2" // i change it dont know the effect on infinite scroll
                    >
                      {/* Desktop: Multi-column masonry */}
                      <div className="hidden sm:block">
                        <Masonry
                          breakpointCols={breakpointColumnsObj}
                          className="flex gap-2"
                          columnClassName="flex flex-col gap-0"
                        >
                          {allPosts.map((post) => (
                            <div key={post?._id}>
                              <Card post={post} />
                            </div>
                          ))}
                        </Masonry>
                      </div>

                      {/* Mobile: Single column without spacing */}
                      <div className="sm:hidden">
                        {allPosts.map((post) => (
                          <div key={post?._id} className="w-full">
                            <Card post={post} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </InfiniteScroll>
                ) : (
                  <div className="text-center text-gray-300 text-lg mt-8">
                    No posts available
                  </div>
                )}
              </div>

{/* Desktop Forum Sidebar */}
              <div className={classNames(
                "w-full lg:w-96 relative transition-all duration-300 ease-in-out",
                "hidden lg:block"
              )}>
                <div className="sticky top-4 pt-2 h-[calc(100vh-7rem)] overflow-hidden">
                  <ForumSystem />
                </div>
              </div>

              {/* Mobile Forum Overlay - Solution 1 */}
<div 
  className="sm:hidden fixed inset-0 bg-black z-40 transition-all duration-300 ease-in-out"
  style={{
    transform: showForum ? 'translateX(0)' : 'translateX(100%)',
    visibility: 'visible', // Always visible during transitions
    pointerEvents: showForum ? 'auto' : 'none' // Prevent interaction when closed
  }}
>
  <div className="h-full pt-16 pb-20 overflow-hidden">
    <ForumSystem />
  </div>
</div>


            </div>
          </div>
        </div>
      </div>
    </>
  );

  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }
};

export default Page;