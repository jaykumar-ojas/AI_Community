import React, { useState, useEffect } from 'react';

const Discussion = () => {
  const [comments, setComments] = useState([
    {
      id: 1,
      user: 'User 1',
      level: 'Level 1',
      comment: 'this is sample comment',
      replies: [
        {
          id: 2,
          user: 'User 2',
          level: 'Level 1',
          comment: 'this is sample reply',
          replies: [
            {
              id: 8,
              user: 'User 2',
              level: 'Level 3',
              comment: 'this is another reply',
            },
          ],
        },
        {
          id: 3,
          user: 'User 3',
          level: 'Level 2',
          comment: 'this is another sample reply',
        },
      ],
    },
    {
      id: 4,
      user: 'User 4',
      level: 'Level 1',
      comment: 'this is another sample comment',
    },
  ]);

  const [newComment, setNewComment] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  // Handle posting new comments
  const handlePostComment = () => {
    if (newComment.trim()) {
      setComments([
        ...comments,
        { id: comments.length + 1, user: 'New User', level: 'Level 1', comment: newComment },
      ]);
      setNewComment('');
    }
  };

  // Simulate fetching more comments (for infinite scroll)
  const fetchMoreComments = () => {
    setIsFetching(true);

    // Simulate an API call with a timeout to fetch more comments
    setTimeout(() => {
      const newComments = [
        {
          id: comments.length + 1,
          user: `User ${comments.length + 1}`,
          level: 'Level 1',
          comment: 'Fetched comment',
        },
        {
          id: comments.length + 2,
          user: `User ${comments.length + 2}`,
          level: 'Level 1',
          comment: 'Another fetched comment',
        },
      ];
      setComments((prevComments) => [...prevComments, ...newComments]);
      setIsFetching(false);
    }, 1500); // Simulate network delay
  };

  // Handle scroll event to detect when to load more comments
  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight === e.target.scrollTop + e.target.clientHeight;
    if (bottom && !isFetching) {
      fetchMoreComments();
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg border p-1 md:p-3">
      <h3 className="font-semibold p-1">Discussion</h3>
      <div
        className="flex flex-col gap-5 m-3 overflow-y-auto"
        style={{ maxHeight: '220px' }} // Set a fixed height for the scrollable area
        onScroll={handleScroll} // Add scroll event listener
      >
        {comments.map((comment) => (
          <div key={comment.id}>
            <div className="flex w-full justify-between border rounded-md">
              <div className="p-3">
                <div className="flex gap-3 items-center">
                  <img
                    src="https://avatars.githubusercontent.com/u/22263436?v=4"
                    alt="avatar"
                    className="object-cover w-10 h-10 rounded-full border-2 border-emerald-400 shadow-emerald-400"
                  />
                  <h3 className="font-bold">
                    {comment.user}
                    <br />
                    <span className="text-sm text-gray-400 font-normal">{comment.level}</span>
                  </h3>
                </div>
                <p className="text-gray-600 mt-2">{comment.comment}</p>
                <button className="text-right text-blue-500">Reply</button>
              </div>
            </div>

            {comment.replies &&
              comment.replies.map((reply) => (
                <div key={reply.id}>
                  <div className="text-gray-300 font-bold pl-14">|</div>
                  <div className="flex justify-between border ml-5 rounded-md">
                    <div className="p-3">
                      <div className="flex gap-3 items-center">
                        <img
                          src="https://avatars.githubusercontent.com/u/22263436?v=4"
                          alt="avatar"
                          className="object-cover w-10 h-10 rounded-full border-2 border-emerald-400 shadow-emerald-400"
                        />
                        <h3 className="font-bold">
                          {reply.user}
                          <br />
                          <span className="text-sm text-gray-400 font-normal">{reply.level}</span>
                        </h3>
                      </div>
                      <p className="text-gray-600 mt-2">{reply.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ))}
        {isFetching && <div className="text-center text-gray-500">Loading more comments...</div>}
      </div>

      <div className="w-full px-3 mb-2 mt-6">
        <textarea
          className="bg-gray-100 rounded border border-gray-400 leading-normal resize-none w-full h-20 py-2 px-3 font-medium placeholder-gray-400 focus:outline-none focus:bg-white"
          name="body"
          placeholder="Comment"
          required
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        ></textarea>
      </div>

      <div className="w-full flex justify-end px-3 my-3">
        <button
          className="px-2.5 py-1.5 rounded-md text-white text-sm bg-indigo-500 text-lg"
          onClick={handlePostComment}
        >
          Post Comment
        </button>
      </div>
    </div>
  );
};

export default Discussion;
