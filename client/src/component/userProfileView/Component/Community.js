import React from "react";
import { useQuery } from "@tanstack/react-query";
import TopicData2 from "../../AiForumPage/components/TopicData2";
const baseUrl = process.env.REACT_APP_BASE_URL;

const fetchTopicsBatch = async ({ signal, queryKey }) => {
  // queryKey = ['communityTopics', dataArray]
  const [, topicIds, populateAuthor] = queryKey;
  const url = `${baseUrl}/forum/topics/batch`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ topicIds, populateAuthor }),
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Failed to fetch topics (${res.status})`);
  }

  const body = await res.json();
  return Array.isArray(body.topics) ? body.topics : [];
};

const Community = ({ data = [], populateAuthor = true }) => {
  // useQuery key includes the raw array of ids (react-query handles array keys)
  const {
    data: topics = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["communityTopics", data, populateAuthor],
    queryFn: fetchTopicsBatch,
    enabled: Array.isArray(data) && data.length > 0,
    // optional: tune caching
    staleTime: 1000 * 60 * 2, // 2 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="py-4">
        <p className="text-sm text-gray-500">No topics to show.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isLoading && (
        <div className="py-4">
          <p className="text-sm text-gray-500">Loading topics...</p>
        </div>
      )}

      {isError && (
        <div className="py-2">
          <p className="text-sm text-red-500">Error: {error?.message || "Failed to load"}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 px-3 py-1 bg-theme_color text-white rounded"
          >
            Retry
          </button>
        </div>
      )}


      <div className="grid p-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {topics.map((topic) => (
          <TopicData2 key={topic._id} topic={topic} />
        ))}
      </div>
    </div>
  );
};

export default Community;
