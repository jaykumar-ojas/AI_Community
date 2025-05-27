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
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) {
    return `${diffSec}s ${diffSec !== 1 ? '' : ''} ago`;
  } else if (diffMin < 60) {
    return `${diffMin}m ${diffMin !== 1 ? '' : ''} ago`;
  } else if (diffHr < 24) {
    return `${diffHr}h ${diffHr !== 1 ? '' : ''} ago`;
  } else if (diffDay < 7) {
    return `${diffDay}d${diffDay !== 1 ? '' : ''} ago`;
  } else if (diffDay < 15) {
    return `${diffWeek}w${diffWeek !== 1 ? '' : ''} ago`;
  } else {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
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