import React, { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Clock, ChevronRight } from 'lucide-react';
import { formatDate } from '../AiForumPage/components/ForumUtils';
import UserIconCard from '../Card/UserIconCard';
import UserNameCard from '../Card/UserNameCard';
import {LoginContext} from "../ContextProvider/context";
import {encodeId} from "../../utils/hashids"

const NotificationComponent = ({ onClose }) => {
  const {loginData} = useContext(LoginContext);
  const userId = loginData?.validuserone?._id;
  const baseUrl = process.env.REACT_APP_BASE_URL;


  const fetchNotifications = async () => {
    const token = localStorage.getItem('userdatatoken');
    const res = await fetch(`${baseUrl}/getNotification/${userId}`, {
      method:'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data.data || [];
  };

  const {
    data: notifs = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: fetchNotifications,
    enabled: !!userId,
    select: (data) => {
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  });

  
  const handleNav = (notif) => {
    const { postId, topicId, commentId } = notif;
    let url = '#';
    if (postId && commentId) url = `/userPost/${postId}?comment=${commentId}`;
    else if (postId) url = `/userPost/${postId}`;
    else if (topicId && commentId) url = `/forum/topic/${encodeId(topicId)}?comment=${commentId}`;
    else if (topicId) url = `/forum/topic/${encodeId(topicId)}`;
    window.location.href = url;
    onClose?.();
  };

  return (
    <div className="bg-black text-white rounded-lg shadow-2xl max-h-[70vh] w-full flex flex-col overflow-hidden  ">
      {/* Header */}
      <div className="sticky top-0  px-4 py-3 border-b border-gray-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold">Notifications</h2>
        </div>
        <span className="text-sm text-gray-400">{notifs.length} new</span>
      </div>

      {/* Content */}
      <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-black flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="animate-spin h-5 w-5 mr-3 border-2 border-blue-500 border-t-transparent rounded-full" />
            Loading notifications...
          </div>
        ) : isError ? (
          <div className="p-4 text-center text-red-400">
            <p>Error fetching notifications.</p>
            <button
              className="mt-3 text-blue-400 underline"
              onClick={refetch}
            >
              Try again
            </button>
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <Bell className="w-10 h-10 opacity-30 mb-2" />
            <p>No notifications yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {notifs.map((n) => (
              <li
                key={n._id}
                onClick={() => handleNav(n)}
                className="p-4 hover:bg-gray-800 transition cursor-pointer flex gap-3"
              >
                {/* <div className="mt-1">{getIcon(n.field)}</div> */}
                <div className="flex-1">
                  <p className="text-sm text-gray-200">{n.desc}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1 gap-2">
                    {n.replierId && (
                      <div className='flex items-center gap-2 justify-start'>
                        <div className='h-8 w-8 flex flex-shrink-0'>
                          <UserIconCard id={n.replierId} />
                        </div>
                        
                        <UserNameCard id={n.replierId} />
                      </div>
                    )}
                    <span className="bg-gray-700 px-2 py-0.5 rounded uppercase">
                      {n.field}
                    </span>
                     <div className="flex items-center text-xs text-gray-400 gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(n.createdAt)}
                  </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationComponent;
