import React, { useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { getAuthHeaders, handleAuthError, TOPICS_URL } from './ForumUtils';

import TopicList from './TopicList';
import { TopicListSkeleton } from './TopicListSkeleton';

// 🔹 Separate fetch function
const fetchPopularTopics = async () => {
  const response = await axios.get(`${TOPICS_URL}?sort=popular`, {
    headers: getAuthHeaders(),
  });
  return response.data.topics || [];
};

const PopularTopics = () => {
  const { loginData } = useContext(LoginContext);
  const { emitDeleteTopic, subscribeToEvent } = useWebSocket();
  const queryClient = useQueryClient();

  // 🔹 React Query handles fetching + caching
  const {
    data: topics = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['popularTopics'],
    queryFn: fetchPopularTopics,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    retry: false,
    onError: (err) => {
      if (handleAuthError(err)) return;
      console.error('Error fetching topics:', err);
    },
  });

  // 🔹 Handle real-time topic deletion
  useEffect(() => {
    const unsubscribe = subscribeToEvent('topic_deleted', (deletedTopicId) => {
      queryClient.setQueryData(['popularTopics'], (oldTopics = []) =>
        oldTopics.filter((topic) => topic._id !== deletedTopicId)
      );
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Delete a topic manually
  const handleDeleteTopic = async (topicId) => {
    if (!loginData || !loginData.validuserone) {
      alert('You must be logged in to delete a topic');
      return;
    }

    if (!window.confirm("Are you sure you want to delete this topic? This will also delete all replies.")) {
      return;
    }

    try {
      await axios.delete(`${TOPICS_URL}/${topicId}`, {
        headers: getAuthHeaders(),
      });

      emitDeleteTopic(topicId);

      // Optimistically update cache
      queryClient.setQueryData(['popularTopics'], (oldTopics = []) =>
        oldTopics.filter((topic) => topic._id !== topicId)
      );
    } catch (err) {
      console.error('Error deleting topic:', err);
      if (!handleAuthError(err)) {
        alert('Failed to delete topic. Please try again.');
      }
    }
  };

  // 🔹 UI rendering
  if (isLoading) return <TopicListSkeleton />;
  if (isError) return <div className="p-4 text-center text-red-500">Failed to load topics.</div>;

  return (
    <TopicList
      topics={topics}
      onDeleteTopic={handleDeleteTopic}
      emptyMessage="No popular topics available"
    />
  );
};

export default PopularTopics;
