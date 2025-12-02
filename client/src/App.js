import logo from "./logo.svg";
import "./App.css";
import Navbar from "./component/Navbar/Navbar";
import DashBoardPage from "./pages/DashBoardPage/DashBoardPage";
import Login from "./component/Auth/Login";
import Register from "./component/Auth/Register";
//import UserProfile from "./component/UserProfile/userProfile";
import Error from "./component/Error/error";
import UpdatePassword from "./component/Auth/updatePassword";
import { createBrowserRouter, RouterProvider, useLocation, useNavigate, Outlet } from "react-router-dom";
import React, { useState } from "react";
import Context from "./component/ContextProvider/context";
import ForgotPassword from "./component/Auth/ForgotPassword";
import VerfiyOtp from "./component/Auth/verifyOtp";
import PostContent from "./component/Postcontent/postcontent";
import AIAggregator from "./component/AIchatbot/chatbot";
import { WebSocketProvider } from "./component/AiForumPage/components/WebSocketContext";
import NewTopicModal from "./component/AiForumPage/components/NewTopicModal";
import TopicContent from "./component/TopicComponent/TopicContent";
import ForumContext from "./component/ContextProvider/ModelContext";
import 'react-image-crop/dist/ReactCrop.css';
import PixelLoader from "./component/Loader/PixelLoader";
import UserProfile from "./component/userProfileView/userProfile";
import PostImage from "./component/PostImage/PostImage";
import UserEdit from "./component/userProfileView/UserEdit";
import CommentModelProvider from "./component/ContextProvider/CommentModelContext";
import { BackgroundBeams } from "./component/ui/background-beams";

import { PostContext } from "./component/PostImage/PostContext";

import { NotificationProvider } from "./component/ContextProvider/NotificationContext";

import ForumSystem from "./component/AiForumPage/ForumSystem";
import FeedbackPage from "./component/Navbar/feedback";
import { ModelsProvider } from "./component/PostImage/ModelsContext";
import PostProvider from "./component/PostImage/PostContext";
import NotificationComponent from "./component/Notification/Notification";
import Challenges from "./component/Challanges/Challanges";
import DailyChallenges from "./component/Challanges/component/DailyChallange";
import WeeklyChallenges from "./component/Challanges/component/WeekelyChallange";
import CreateChallenge from "./component/Challanges/component/CreateChallenge";
import AIChatPage from "./pages/AiChatPage/AIChatPage";
import ChallengeContent from "./component/Challanges/component/ChallengeContent";

const Layout = () => {
  const location = useLocation();
  const [showForum, setShowForum] = useState(false);

  // Paths where you do NOT want the Navbar to appear
  const noNavbarPaths = ["/login", "/register", "/forgot-password"];
  const shouldHideNavbar = noNavbarPaths.includes(location.pathname);

  return (
    <div className="flex flex-col h-screen relative">
      {/* Single BackgroundBeams for the entire layout */}
      <BackgroundBeams className="absolute inset-0 z-0" />

      {/* Content overlay - make sure it's above the background */}
      <div className="relative z-10 flex flex-col h-screen">
        {!shouldHideNavbar && <Navbar showForum={showForum} setShowForum={setShowForum} />}
        <main className="flex-1 overflow-auto">
          <Outlet context={{ showForum, setShowForum }} />
        </main>
      </div>
    </div>
  );
};

const BackgroundWrapper = ({ children }) => {
  return (
    <div className="min-h-screen relative">
      <BackgroundBeams className="absolute inset-0 z-0" />
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
};


const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, // Wrap layout here
    children: [
      { index: true, element: <DashBoardPage /> },
      { path: "userprofile/:id", element: <UserProfile /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "verify-otp/:id", element: <VerfiyOtp /> },
      { path: "update-password/:id", element: <UpdatePassword /> },
      { path: "userPost/:id/:comment?", element: <PostContent /> },
      { path: "ai-aggregator/:topicId", element: <AIAggregator /> },
      { path: "forum/topic/:topicId/:comment?", element: <AIAggregator /> },
      { path: "t/:topicId", element: <TopicContent /> },
      { path: "loader", element: <PixelLoader /> },
      { path: "sample-user/:id", element: <UserProfile /> },
      { path: "post", element:<PostImage/>},
      {path: "userPost/edit/:id?", element: <UserEdit/>},
      {path: "community", element: <ForumSystem/>},
      {path: "forum", element: <ForumSystem/>},
      { path: "ai-chat", element: <AIChatPage /> },
      {path: "feedback", element: <FeedbackPage/>},
      {path:"notification", element:<NotificationComponent/>},
      {
        path: "challenges",
        element: <Challenges/>,
        children: [
          { index: true, element: <DailyChallenges/> },
          {path :"create", element:<CreateChallenge/>},
          { path: "daily", element: <DailyChallenges /> },
          { path: "weekly", element: <WeeklyChallenges/>},
          { path:"daily/:id" , element:<ChallengeContent/>},
        ]
      }
      
    ]
  },
  { path: "/login", element: <BackgroundWrapper><Login /></BackgroundWrapper> },
  { path: "/register", element: <BackgroundWrapper><Register /></BackgroundWrapper> },
  { path: "*", element: <BackgroundWrapper><Error /></BackgroundWrapper> },
]);

function App() {
  return (
    <Context>
      <NotificationProvider>
        <WebSocketProvider>
          <PostProvider>
            <ForumContext>
              <CommentModelProvider>
                <ModelsProvider>
                  <RouterProvider router={router} />
                </ModelsProvider>
              </CommentModelProvider>
            </ForumContext>
          </PostProvider>
        </WebSocketProvider>
      </NotificationProvider>
    </Context>
  );
}

export default App;