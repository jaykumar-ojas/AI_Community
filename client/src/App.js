import logo from "./logo.svg";
import "./App.css";
import Navbar from "./component/Navbar/Navbar";
import DashBoardPage from "./pages/DashBoardPage/DashBoardPage";
import Login from "./component/Auth/Login";
import Register from "./component/Auth/Register";
import UserProfile2 from "./component/UserProfile/userProfile2";
import UserProfile from "./component/UserProfile/userProfile2";
import Error from "./component/Error/error";
import UpdatePassword from "./component/Auth/updatePassword";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";
import Context from "./component/ContextProvider/context";
import ForgotPassword from "./component/Auth/ForgotPassword";
import VerfiyOtp from "./component/Auth/verifyOtp";
import PostContent from "./component/Postcontent/postcontent";
import PostData from "./component/Postcontent/PostData";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login></Login>,
  },
  {
    path: "/register",
    element: <Register></Register>,
  },
  {
    path: "/",
    element: <DashBoardPage></DashBoardPage>,
  },
  {
    path: "*",
    element: <Error></Error>,
  },
  {
    path:'/userprofile',
    element:<UserProfile></UserProfile>
  },
  {
    path:'/userPost/:id',
    element:<PostContent></PostContent>
  },
  {
    path:'/test2',
    element:<PostData></PostData>
  },
]);

function App() {
  return (
        <RouterProvider router={router} />
  );
}

export default App;
