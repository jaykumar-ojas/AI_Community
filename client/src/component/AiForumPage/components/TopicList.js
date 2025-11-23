

import React, { useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import TopicData from "./TopicData";
import TopicData2 from "./TopicData2";
import { useWebSocket } from "./WebSocketContext";

const TopicList = ({ topics: initialTopics, emptyMessage }) => {
  const { subscribeToEvent } = useWebSocket();
  const [topics, setTopics] = useState(initialTopics);
  const location = useLocation();

  const isForumRoute = location.pathname.startsWith("/forum");

  useEffect(() => {
    const unsubscribe = subscribeToEvent("topic_deleted", (deletedTopicId) => {
      setTopics((prev) =>
        prev.filter((topic) => topic._id !== deletedTopicId)
      );
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setTopics(initialTopics);
  }, [initialTopics]);

  return (
    <div>
    {isForumRoute ? (<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
      {topics.length > 0 ? (
        topics.map((topic) =>
            <TopicData2 key={topic._id} topic={topic} />
          
        )
      ) : (
        <div className="p-4 text-center text-gray-500">{emptyMessage}</div>
      )}
    </div>)
    :
     <div className="grid gap-2 grid-cols-1">
      {topics.length > 0 ? (
        topics.map((topic) => {
          return <TopicData topic={topic} />;
        })
      ) : (
        <div className="p-4 text-center text-gray-500">{emptyMessage}</div>
      )}
    </div>}
    </div>
    
  );
};

export default TopicList;

