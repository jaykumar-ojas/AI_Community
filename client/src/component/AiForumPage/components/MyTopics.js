import React, { useContext } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { getAuthHeaders, handleAuthError, TOPICS_URL } from './ForumUtils';
import TopicList from './TopicList';
import { TopicListSkeleton } from './TopicListSkeleton';

const fetchMyTopics = async (userId) => {
  const response = await axios.get(`${TOPICS_URL}?userId=${userId}`, {
    headers: getAuthHeaders(),
  });
  return response.data.topics || [];
};

const MyTopics = () => {
  const { loginData } = useContext(LoginContext);
  const { validuserone } = loginData || {};

  const {
    data: topics = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['myTopics', validuserone?._id],
    queryFn: () => fetchMyTopics(validuserone._id),
    enabled: !!validuserone, // ✅ Only run query when user is logged in
    retry: false,
    onError: (err) => {
      if (!handleAuthError(err)) {
        console.error('Error fetching my topics:', err);
      }
    },
  });

  if (!validuserone) {
    return (<div className="p-4 text-center text-red-500">you are not logged in...</div>)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-red-500">
        Failed to load topics. Please try again later.
      </div>
    );
  }

  return (
    <TopicList
      topics={topics}
      emptyMessage="You haven't created any topics yet"
    />
  );
};

export default MyTopics;
