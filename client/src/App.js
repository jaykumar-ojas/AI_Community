import logo from "./logo.svg";
import "./App.css";
import Navbar from "./component/Navbar/Navbar";
import DashBoardPage from "./pages/DashBoardPage/DashBoardPage";
import Login from "./component/Auth/Login";
import Register from "./component/Auth/Register";
import UserProfile2 from "./component/UserProfile/userProfile2";
//import UserProfile from "./component/UserProfile/userProfile";
import Error from "./component/Error/error";
import UpdatePassword from "./component/Auth/updatePassword";
import { createBrowserRouter, RouterProvider, useLocation, useNavigate,Outlet } from "react-router-dom";
import React from "react";
import Context from "./component/ContextProvider/context";
import ForgotPassword from "./component/Auth/ForgotPassword";
import VerfiyOtp from "./component/Auth/verifyOtp";
import PostContent from "./component/Postcontent/postcontent";
import PostData from "./component/Postcontent/PostData";
import AnotherUser from "./component/UserProfile/AnotherUser";
import AIAggregator from "./component/AIchatbot/chatbot";

import { WebSocketProvider } from "./component/AiForumPage/components/WebSocketContext";
import NewTopicModal from "./component/AiForumPage/components/NewTopicModal";
import TopicContent from "./component/TopicComponent/TopicContent";
import  ForumContext  from "./component/ContextProvider/ModelContext";
import 'react-image-crop/dist/ReactCrop.css';
import PixelLoader from "./component/Loader/PixelLoader";
import UserProfile from "./component/userProfileView/userProfile";


const Layout = () => {
  const location = useLocation();
  
  // Paths where you do NOT want the Navbar to appear
  const noNavbarPaths = ["/login", "/register", "/forgot-password"];
  const shouldHideNavbar = noNavbarPaths.includes(location.pathname);

  return (
    <div className="flex flex-col h-screen">
  {!shouldHideNavbar && <Navbar />}
  <main className="flex-1 overflow-auto bg-comment_box">
    <Outlet />
  </main>
</div>
  );
};


const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, // Wrap layout here
    children: [
      { index: true, element: <DashBoardPage /> },
      { path: "userprofile", element: <UserProfile2 /> },
      { path: "userprofile/:userId", element: <UserProfile /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "verify-otp/:id", element: <VerfiyOtp /> },
      { path: "update-password/:id", element: <UpdatePassword /> },
      { path: "userPost/:id", element: <PostContent /> },
      { path: "test2", element: <PostData /> },
      { path: "userProfile/:userId", element: <AnotherUser /> },
      { path: "ai-aggregator/:topicId", element: <AIAggregator /> },
      { path: "forum/topic/:topicId/:replyId?", element: <AIAggregator /> },
      { path: "t/:topicId", element: <TopicContent /> },
      { path: "loader", element: <PixelLoader /> },
      { path: "sample-user/:id", element: <UserProfile /> },
    ]
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "*", element: <Error /> },
]);

function App() {
  return (  
    <Context>
      <WebSocketProvider>
        <ForumContext>
        <RouterProvider router={router} />
        </ForumContext>
      </WebSocketProvider>
    </Context>
  );
}

export default App;


