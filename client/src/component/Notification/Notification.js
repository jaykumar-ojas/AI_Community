import React, { useState, useEffect } from 'react';
import { Bell, User, MessageCircle, FileText, Hash, Clock, ChevronRight } from 'lucide-react';
import { useContext } from 'react';
import { LoginContext } from "../ContextProvider/context";
import { formatDate } from '../AiForumPage/components/ForumUtils';
import UserIconCard from "../Card/UserIconCard";
import UserNameCard from "../Card/UserNameCard";

const NotificationComponent = ({isOpen = true, onClose }) => {
  const [notifications, setNotifications] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {loginData} = useContext(LoginContext);
  const userId = loginData.validuserone._id;

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [userId, isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
        const userDataToken = localStorage.getItem('userdatatoken'); // Adjust based on where you store the token
    
        const response = await fetch(`http://localhost:8099/getNotification/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': userDataToken, // Add your token header
        },
        });
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const res = await response.json();
      console.log("this is my data",res?.data);
      setNotifications(res?.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (field) => {
    switch (field) {
      case 'post':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'topic':
        return <Hash className="w-5 h-5 text-green-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification) => {
    const id = notification?.postId || null;
    const topicId = notification?.topicId || null;
    const commentId = notification?.commentId || null;

    if(id && commentId){
        return `/userPost/${id}?comment=${commentId}`;
    }
    if(id){
        return `/userPost/${id}`;
    }
    if(topicId && commentId){
        return `/forum/topic/${topicId}?comment=${commentId}`;
    }
    if(topicId){
        return `/forum/topic/${topicId}`
    }
    return '#';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - notificationTime) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const handleNotificationClick = (notification) => {
    const link = getNotificationLink(notification);
    if (link !== '#') {
      // In a real app, you'd use React Router's navigate or Next.js router
      window.location.href = link;
    }
    onClose(); // Close the notification panel after clicking
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.notification-panel')) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-16">
        <div className="notification-panel bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-hidden">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading notifications...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-16">
        <div className="notification-panel bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-hidden">
          <div className="p-6">
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <Bell className="w-12 h-12 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Notifications</h3>
              <p className="text-gray-600 mb-4 text-sm">{error}</p>
              <button
                onClick={fetchNotifications}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-16">
      <div className="notification-panel bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-blue-500" />
              Notifications
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-80">
          {notifications.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-gray-600 text-sm">When you get notifications, they'll appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.field)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 leading-tight">
                          {notification.desc || 'New notification'}
                        </p>
                        <span className="text-xs text-gray-500 flex items-center ml-2 flex-shrink-0">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mb-1">
                        {notification.replierId && (
                          <span className="flex items-center">
                            <div className='h-6 w-6 flex-shrink-0'>
                                <UserIconCard id={notification?.replierId}/>
                            </div>
                            
                            <UserNameCard id= {notification?.replierId}/>
                          </span>
                        )}
                        
                        {notification.field && (
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700 capitalize">
                            {notification.field}
                          </span>
                        )}
                      </div>
                      
                      
                    </div>
                    
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
            <button
              onClick={fetchNotifications}
              className="w-full text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Refresh notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationComponent;