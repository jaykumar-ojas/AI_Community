import React, { useEffect, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import DashBoardPage from "./pages/DashBoardPage/DashBoardPage";
import Login from "./component/Auth/Login";
import Register from "./component/Auth/Register";
import UserProfile2 from "./component/UserProfile/userProfile2";
import Error from "./component/Error/error";
import UpdatePassword from "./component/Auth/updatePassword";
import ForgotPassword from "./component/Auth/ForgotPassword";
import VerfiyOtp from "./component/Auth/verifyOtp";
import PostContent from "./component/Postcontent/postcontent";
import PostData from "./component/Postcontent/PostData";

const Layout = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const [lastPage, setLastPage] = useState(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isLoginPage && contentRef.current) {
      // Capture the last visible page (before navigating to login)
      setLastPage(contentRef.current.innerHTML);
    }
  }, [location.pathname]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Show the last captured page as a blurred background on login */}
      {isLoginPage && lastPage && (
        <div
          className="absolute inset-0 z-0 overflow-hidden backdrop-blur-md transition-all duration-500"
          dangerouslySetInnerHTML={{ __html: lastPage }}
        />
      )}

      {/* Content Wrapper */}
      <div
        ref={contentRef}
        className={`relative z-10 w-full h-full ${isLoginPage ? "hidden" : ""}`}
      >
        <Routes>
          <Route path="/" element={<DashBoardPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/userprofile" element={<UserProfile2 />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp/:id" element={<VerfiyOtp />} />
          <Route path="/update-password/:id" element={<UpdatePassword />} />
          <Route path="/userPost/:id" element={<PostContent />} />
          <Route path="/test2" element={<PostData />} />
          <Route path="*" element={<Error />} />
        </Routes>
      </div>

      {/* Login Page Overlay */}
      {isLoginPage && <Login />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
