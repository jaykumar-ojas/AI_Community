import { getAuthHeaders } from '../component/AiForumPage/components/ForumUtils';

export const handleGoogleLogin = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  
  if (token) {
    localStorage.setItem("userdatatoken", token);
    window.history.replaceState({}, document.title, "/");
    return true;
  }
  return false;
};

export const validateToken = async () => {
  const token = localStorage.getItem("userdatatoken");
  
  if (!token) {
    return false;
  }

  try {
    const response = await fetch("http://localhost:8099/validuser", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("userdatatoken");
        localStorage.removeItem("userData");
        return false;
      }
      return false;
    }

    const res = await response.json();
    if (!res || res.status === 401) {
      localStorage.removeItem("userdatatoken");
      localStorage.removeItem("userData");
      return false;
    }

    localStorage.setItem("userData", JSON.stringify(res));
    return res;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("userdatatoken");
};

export const logout = () => {
  localStorage.removeItem("userdatatoken");
  localStorage.removeItem("userData");
}; 