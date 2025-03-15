import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { LoginContext } from '../ContextProvider/context';
import io from 'socket.io-client';

const socket = io('http://localhost:8099');

const ForumSystem = () => {
  const {loginData } = useContext(LoginContext);
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState({ title: '', content: '' });
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState('popular'); // 'popular', 'recent', 'my'
  console.log("this si forum apge", loginData);

  // State for reply forms
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  // API endpoints
  const API_BASE_URL = 'http://localhost:8099';
  const TOPICS_URL = `${API_BASE_URL}/forum/topics`;
  const REPLIES_URL = `${API_BASE_URL}/forum/replies`;

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("userdatatoken");
    return token ? {
      'Content-Type': 'application/json',
      'Authorization': token
    } : {
      'Content-Type': 'application/json'
    };
  };

  // Helper function to handle authentication errors
  const handleAuthError = (error) => {
    console.error('Authentication error:', error);
    if (error.response && error.response.status === 401) {
      // Clear token if it's invalid
      localStorage.removeItem("userdatatoken");
      setError('Your session has expired. Please log in again.');
      return true;
    }
    return false;
  };

  // WebSocket event listeners
  useEffect(() => {
    // Listen for new topics
    socket.on('topic_created', (newTopic) => {
      if (currentTab === 'recent') {
        setTopics(prevTopics => [newTopic, ...prevTopics]);
      }
    });

    // Listen for new replies
    socket.on('reply_created', (newReply) => {
      if (selectedTopic && selectedTopic._id === newReply.topicId) {
        setReplies(prevReplies => [...prevReplies, newReply]);
      }
    });

    // Listen for deleted topics
    socket.on('topic_deleted', (deletedTopicId) => {
      setTopics(prevTopics => prevTopics.filter(topic => topic._id !== deletedTopicId));
      if (selectedTopic && selectedTopic._id === deletedTopicId) {
        setSelectedTopic(null);
        setReplies([]);
      }
    });

    // Listen for deleted replies
    socket.on('reply_deleted', (deletedReplyId) => {
      setReplies(prevReplies => prevReplies.filter(reply => reply._id !== deletedReplyId));
    });

    return () => {
      socket.off('topic_created');
      socket.off('reply_created');
      socket.off('topic_deleted');
      socket.off('reply_deleted');
    };
  }, [currentTab, selectedTopic]);

  // Join/Leave topic room when selecting/deselecting a topic
  useEffect(() => {
    if (selectedTopic) {
      socket.emit('join_topic', selectedTopic._id);
    }
    return () => {
      if (selectedTopic) {
        socket.emit('leave_topic', selectedTopic._id);
      }
    };
  }, [selectedTopic?._id]);

  // Fetch topics based on current tab
  useEffect(() => {
    fetchTopics();
  }, [currentTab, loginData]);

  const fetchTopics = async () => {
    if (currentTab === 'my' && (!loginData || !loginData.validuserone)) {
      setTopics([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      let url = TOPICS_URL;
      if (currentTab === 'popular') {
        url += '?sort=popular';
      } else if (currentTab === 'recent') {
        url += '?sort=recent';
      } else if (currentTab === 'my' && loginData?.validuserone) {
        url += `?userId=${loginData.validuserone._id}`;
      }
      
      const response = await axios.get(url, { headers: getAuthHeaders() });
      setTopics(response.data.topics || []);
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }
      console.error('Error fetching topics:', err);
      setError('Failed to load topics. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch replies for a selected topic
  const fetchReplies = async (topicId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${REPLIES_URL}?topicId=${topicId}`, { headers: getAuthHeaders() });
      setReplies(response.data.replies || []);
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }
      console.error('Error fetching replies:', err);
      setError('Failed to load replies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle topic selection
  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    fetchReplies(topic._id);
  };

  // Modify handleCreateTopic to emit socket event
  const handleCreateTopic = async () => {
    if (!loginData) {
      alert('Please log in to create a topic');
      return;
    }

    if (!newTopic.title.trim() || !newTopic.content.trim()) {
      alert('Please provide both title and content for your topic');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(TOPICS_URL, {
        title: newTopic.title,
        content: newTopic.content,
        userId: loginData.validuserone._id,
        userName: loginData.validuserone.userName
      }, { headers: getAuthHeaders() });
      
      // Emit socket event for new topic
      socket.emit('new_topic', response.data.topic);
      
      // Reset form and refresh topics
      setNewTopic({ title: '', content: '' });
      fetchTopics();
      
      // Select the newly created topic
      setSelectedTopic(response.data.topic);
      fetchReplies(response.data.topic._id);
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }
      console.error('Error creating topic:', err);
      setError('Failed to create topic. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Modify handlePostReply to emit socket event
  const handlePostReply = async (parentReplyId = null) => {
    if (!loginData || !loginData.validuserone) {
      alert('Please log in to reply');
      return;
    }

    const content = parentReplyId ? replyContent : newReply;

    if (!content.trim() || !selectedTopic) {
      alert('Please enter a reply');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(REPLIES_URL, {
        content: content,
        topicId: selectedTopic._id,
        userId: loginData.validuserone._id,
        userName: loginData.validuserone.userName,
        parentReplyId: parentReplyId
      }, { headers: getAuthHeaders() });
      
      // Emit socket event for new reply
      socket.emit('new_reply', response.data.reply);
      
      // Reset form and refresh replies
      if (parentReplyId) {
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setNewReply('');
      }
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }
      console.error('Error posting reply:', err);
      setError('Failed to post reply. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Organize replies into a nested structure
  const organizeReplies = (replyList) => {
    const topLevelReplies = [];
    const replyMap = {};
    
    // First pass: create a map of all replies by ID
    replyList.forEach(reply => {
      reply.children = [];
      replyMap[reply._id] = reply;
    });
    
    // Second pass: organize into parent-child relationships
    replyList.forEach(reply => {
      if (reply.parentReplyId && replyMap[reply.parentReplyId]) {
        // This is a child reply, add it to its parent
        replyMap[reply.parentReplyId].children.push(reply);
      } else {
        // This is a top-level reply
        topLevelReplies.push(reply);
      }
    });
    
    return topLevelReplies;
  };

  // Render a single reply and its children recursively
  const renderReply = (reply, depth = 0) => {
    const isReplying = replyingTo === reply._id;
    
    // Check if the current user is the author or an admin
    const isAuthor = loginData?.validuserone?._id.toString() === reply.userId.toString();
    const isAdmin = loginData?.validuserone?.role === 'admin';
    const canDelete = isAuthor || isAdmin;
    
    console.log('Reply permissions:', {
      replyId: reply._id,
      replyUserId: reply.userId,
      currentUserId: loginData?.validuserone?._id,
      isAuthor,
      isAdmin,
      canDelete
    });
    
    return (
      <div key={reply._id} className={`pl-${depth * 4} mb-4`}>
        <div className="bg-white rounded-lg border p-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="font-medium text-blue-600">{reply.userName}</span>
              <span className="text-gray-400 text-sm ml-2">{formatDate(reply.createdAt)}</span>
            </div>
            <div className="flex items-center">
              {canDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteReply(reply._id);
                  }}
                  className="text-red-500 hover:text-red-700 mr-3"
                  title="Delete reply"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => {
                  if (isReplying) {
                    setReplyingTo(null);
                    setReplyContent('');
                  } else {
                    setReplyingTo(reply._id);
                    setReplyContent('');
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {isReplying ? 'Cancel' : 'Reply'}
              </button>
            </div>
          </div>
          
          <div className="text-gray-700 whitespace-pre-wrap">{reply.content}</div>
          
          {isReplying && (
            <div className="mt-4 pl-4 border-l-2 border-blue-100">
              <textarea
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <button
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  onClick={() => {
                    if (replyContent.trim()) {
                      handlePostReply(reply._id);
                    }
                  }}
                  disabled={!loginData || !replyContent.trim()}
                >
                  Post Reply
                </button>
              </div>
            </div>
          )}
        </div>
        
        {reply.children && reply.children.length > 0 && (
          <div className="mt-2 pl-4 border-l-2 border-gray-100">
            {reply.children.map(childReply => renderReply(childReply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  // Handle deleting a topic
  const handleDeleteTopic = async (topicId) => {
    if (!loginData || !loginData.validuserone) {
      setError('You must be logged in to delete a topic');
      return;
    }

    // Ask for confirmation before deleting
    if (!window.confirm("Are you sure you want to delete this topic? This will also delete all replies. This action cannot be undone.")) {
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await axios.delete(`${TOPICS_URL}/${topicId}`, {
        headers: getAuthHeaders()
      });

      if (response.status === 200) {
        // Emit socket event for topic deletion
        socket.emit('delete_topic', topicId);
        
        // If the deleted topic is currently selected, clear the selection
        if (selectedTopic && selectedTopic._id === topicId) {
          setSelectedTopic(null);
          setReplies([]);
        }
        
        // Refresh the topics list
        fetchTopics();
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      if (!handleAuthError(error)) {
        if (error.response && error.response.status === 403) {
          setError('You are not authorized to delete this topic');
        } else {
          setError('Failed to delete topic. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a reply
  const handleDeleteReply = async (replyId) => {
    if (!loginData || !loginData.validuserone) {
      setError('You must be logged in to delete a reply');
      return;
    }

    // Ask for confirmation before deleting
    if (!window.confirm("Are you sure you want to delete this reply? This action cannot be undone.")) {
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await axios.delete(`${REPLIES_URL}/${replyId}`, {
        headers: getAuthHeaders()
      });

      if (response.status === 200) {
        // Emit socket event for reply deletion
        socket.emit('delete_reply', { replyId, topicId: selectedTopic._id });
        
        // Refresh the replies for the current topic
        if (selectedTopic) {
          fetchReplies(selectedTopic._id);
        }
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      if (!handleAuthError(error)) {
        if (error.response && error.response.status === 403) {
          setError('You are not authorized to delete this reply');
        } else {
          setError('Failed to delete reply. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden flex flex-col h-full">
      {/* Header with search */}
      <div className="p-4 border-b sticky top-0 bg-white z-10">
        <h2 className="text-xl font-bold mb-4">AI Forum</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search discussions..."
            className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b bg-white sticky top-[88px] z-10">
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium ${currentTab === 'popular' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setCurrentTab('popular')}
        >
          Popular
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium ${currentTab === 'recent' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setCurrentTab('recent')}
        >
          Recent
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium ${currentTab === 'my' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setCurrentTab('my')}
        >
          My Topics
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : selectedTopic ? (
          // Topic Detail View
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setSelectedTopic(null)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Topics
              </button>
              
              {/* Add delete button for topic owner or admin */}
              {(loginData?.validuserone?._id.toString() === selectedTopic.userId.toString() || loginData?.validuserone?.role === 'admin') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTopic(selectedTopic._id);
                  }}
                  className="text-red-500 hover:text-red-700 flex items-center"
                  title="Delete topic"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Topic
                </button>
              )}
            </div>
            
            <div className="bg-white rounded-lg border p-4 mb-4">
              <h3 className="text-xl font-semibold mb-2">{selectedTopic.title}</h3>
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <span className="font-medium text-blue-600 mr-2">{selectedTopic.userName}</span>
                <span>{formatDate(selectedTopic.createdAt)}</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedTopic.content}</p>
            </div>

            {/* Replies Section */}
            <div className="space-y-4">
              {replies.length > 0 ? (
                organizeReplies(replies).map(reply => renderReply(reply))
              ) : (
                <div className="text-center text-gray-500 py-4">No replies yet. Be the first to reply!</div>
              )}
            </div>

            {/* Reply Input */}
            <div className="mt-4 bg-white rounded-lg border p-4">
              <textarea
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
                placeholder={loginData ? "Write your reply..." : "Please login to reply"}
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                disabled={!loginData}
              />
              <div className="flex justify-end mt-2">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  onClick={() => handlePostReply()}
                  disabled={!loginData || !newReply.trim()}
                >
                  {loginData ? "Post Reply" : "Login to Reply"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Topics List View
          <div className="divide-y">
            {topics.length > 0 ? (
              topics.map(topic => (
                <div
                  key={topic._id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => handleSelectTopic(topic)}>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{topic.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{topic.content}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <span className="font-medium text-blue-600 mr-2">{topic.userName}</span>
                        <span className="mr-4">{formatDate(topic.createdAt)}</span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {topic.replyCount || 0}
                        </span>
                      </div>
                    </div>
                    
                    {/* Add delete button for topic owner or admin */}
                    {(loginData?.validuserone?._id.toString() === topic.userId.toString() || loginData?.validuserone?.role === 'admin') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTopic(topic._id);
                        }}
                        className="text-red-500 hover:text-red-700 ml-4"
                        title="Delete topic"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                {currentTab === 'my' 
                  ? "You haven't created any topics yet"
                  : "No topics available"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Topic Button */}
      {!selectedTopic && (
        <div className="p-4 border-t sticky bottom-0 bg-white">
          <button
            onClick={() => document.getElementById('new-topic-modal').classList.remove('hidden')}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            disabled={!loginData}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {loginData ? "Create New Topic" : "Login to Create Topic"}
          </button>
        </div>
      )}

      {/* New Topic Modal */}
      <div id="new-topic-modal" className="hidden fixed inset-0 bg-black bg-opacity-50 z-50">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Create New Topic</h3>
              <button
                onClick={() => document.getElementById('new-topic-modal').classList.add('hidden')}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Topic title"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({...newTopic, title: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="5"
                  placeholder="Describe your topic..."
                  value={newTopic.content}
                  onChange={(e) => setNewTopic({...newTopic, content: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => document.getElementById('new-topic-modal').classList.add('hidden')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleCreateTopic();
                  document.getElementById('new-topic-modal').classList.add('hidden');
                }}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={!newTopic.title.trim() || !newTopic.content.trim()}
              >
                Create Topic
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumSystem; 