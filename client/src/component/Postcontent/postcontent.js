import React, { useEffect, useState } from "react";
import UserContent from "./UserContent";
import { useNavigate, useParams } from "react-router-dom";
import CommentReview from "./CommentReview";
import ReplyCommentBox from "./CommentComponent/ReplyForComment";
import Card from "../Card/Card";

const PostContent = () => {
  const history = useNavigate();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relevantPost, setRelevantPost] = useState([]);

  const getPost = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        setError("No post ID provided");
        setLoading(false);
        return;
      }

      const res = await fetch("http://localhost:8099/getPostById", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: id }),
      });

      const data = await res.json();

      if (data.status === 201 && data.postdata) {
        setPost(data.postdata);
      } else {
        setError("Failed to load post. Please try again.");
      }
    } catch (err) {
      setError("An error occurred while loading the post.");
    } finally {
      setLoading(false);
    }
  };

  const getRelevantPost = async () => {
    try {
      if (!id) return;

      const res = await fetch(`http://localhost:8000/search/bypostid/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (data?.results?.length) {
        const parsed = data.results
          .map((value) => {
            if (!value || !value.metadata) return null;
            return {
              ...(value.metadata.data || {}),
              signedUrl: value.image_url || "",
            };
          })
          .filter(Boolean);
        setRelevantPost(parsed);
      } else {
        setRelevantPost([]);
      }
    } catch (err) {
      setRelevantPost([]);
    }
  };

  useEffect(() => {
    if (id) {
      getPost();
      getRelevantPost();
    } else {
      setError("No post ID provided");
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading post...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
        <button
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={getPost}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-bg_comment w-full overflow-x-hidden h-full">
  <div className="w-full justify-center flex flex-col lg:flex-row">
    {/* Left Section */}
    <div className="relative w-full rounded-xl lg:w-[70%] h-[calc(100vh-3.5rem)] flex flex-col">
  {/* Scrollable content that shrinks as ReplyCommentBox grows */}
  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-bg_comment_box scrollbar-no-arrows px-24">
    <div className="mb-6">
      {post ? (
        <UserContent post={post} />
      ) : (
        <div className="border border-gray-300 rounded-lg p-6 text-center">
          No post content available lorem1000
        </div>
      )}
    </div>

    <div className="flex-1 bg-bg_comment_box p-4 rounded-xl">
      <CommentReview />
    </div>
  </div>

  {/* Reply box grows and pushes content upward */}
  <div className="px-24">
    <ReplyCommentBox />
  </div>
</div>


    {/* Right Section - Sticky Sidebar */}
    <div className="w-full overflow-y-auto h-[calc(100vh-3.5rem)] no-scrollbar  bg-bg_comment_box rounded-xl lg:w-[30%]">
      <div className="border border-gray-300 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">More Related Content</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {relevantPost?.length > 0 ? (
            relevantPost.map((item, index) => (
              <Card key={item?._id || index} post={item} />
            ))
          ) : (
            <div className="col-span-3 text-center bg-bg_comment text-gray-500">
              No related content found
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
</div>

  );
};

export default PostContent;
