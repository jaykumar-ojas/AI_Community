// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem("userdatatoken");
  return token ? {
    'Content-Type': 'application/json',
    'Authorization': token
  } : {
    'Content-Type': 'application/json'
  };
};

// Helper function to handle authentication errors
export const handleAuthError = (error, setError) => {
  console.error('Authentication error:', error);
  if (error.response && error.response.status === 401) {
    // Clear token if it's invalid
    localStorage.removeItem("userdatatoken");
    setError('Your session has expired. Please log in again.');
    return true;
  }
  return false;
};

// Format date for display
export const formatDate = (dateString) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};

// Organize replies into a nested structure
export const organizeReplies = (replyList) => {
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

// API endpoints
export const API_BASE_URL = 'http://localhost:8099';
export const TOPICS_URL = `${API_BASE_URL}/forum/topics`;
export const REPLIES_URL = `${API_BASE_URL}/forum/replies`; 