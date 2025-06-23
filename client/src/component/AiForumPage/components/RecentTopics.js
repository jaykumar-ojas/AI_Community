import React, { useEffect, useContext } from 'react';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { getAuthHeaders, handleAuthError, TOPICS_URL } from './ForumUtils';
import TopicList from './TopicList';
import { TopicListSkeleton } from './TopicListSkeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const fetchTopics = async () => {
  const response = await axios.get(`${TOPICS_URL}?sort=recent`, {
    headers: getAuthHeaders(),
  });
  const fetchedTopics = response.data.topics || [];
  sessionStorage.setItem('recent_topics', JSON.stringify(fetchedTopics));
  return fetchedTopics;
};

const RecentTopics = () => {
  const { loginData } = useContext(LoginContext);
  const { emitDeleteTopic, subscribeToEvent } = useWebSocket();
  const queryClient = useQueryClient();

  const {
    data: topics = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['recentTopics'],
    queryFn: fetchTopics,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    retry: false,
    onError: (err) => {
      if (handleAuthError(err)) return;
      console.error('Error fetching topics:', err);
    },
  });

  useEffect(() => {
    const unsubscribeNew = subscribeToEvent('topic_created', (newTopic) => {
      queryClient.setQueryData(['recentTopics'], (oldTopics = []) => [
        newTopic,
        ...oldTopics,
      ]);
    });

    const unsubscribeDelete = subscribeToEvent('topic_deleted', (deletedTopicId) => {
      queryClient.setQueryData(['recentTopics'], (oldTopics = []) =>
        oldTopics.filter((topic) => topic?._id !== deletedTopicId)
      );
    });

    return () => {
      unsubscribeNew();
      unsubscribeDelete();
    };
  }, []);

  const handleDeleteTopic = async (topicId) => {
    if (!loginData?.validuserone) {
      alert('You must be logged in to delete a topic');
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to delete this topic? This will also delete all replies. This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete(`${TOPICS_URL}/${topicId}`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 200) {
        emitDeleteTopic(topicId);
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      if (!handleAuthError(error)) {
        alert(
          error?.response?.status === 403
            ? 'You are not authorized to delete this topic'
            : 'Failed to delete topic. Please try again.'
        );
      }
    }
  };

  if (isLoading) {
    return <TopicListSkeleton />;
  }

  if (isError) {
    return <div className="p-4 text-center text-red-500">Failed to load topics. Please try again later.</div>;
  }

  return (
    <TopicList
      topics={topics}
      onDeleteTopic={handleDeleteTopic}
      emptyMessage="No recent topics available"
    />
  );
};

export default RecentTopics;
