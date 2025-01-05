import logo from "./logo.svg";
import "./App.css";
import Navbar from "./component/Navbar/Navbar";
import DashBoardPage from "./pages/DashBoardPage/DashBoardPage";
import Login from "./component/Auth/Login";
import Register from "./component/Auth/Register";
import UserProfile2 from "./component/UserProfile/userProfile2";
import UserProfile from "./component/UserProfile/userProfile";
import Error from "./component/Error/error";
import Uploader from "./pages/Uploader";
import UpdatePassword from "./component/Auth/updatePassword";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";
import Context from "./component/ContextProvider/context";
import ForgotPassword from "./component/Auth/ForgotPassword";
import VerfiyOtp from "./component/Auth/verifyOtp";

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
    path: "/Uploader",
    element: <Uploader></Uploader>,
  },
  {
    path: "/userprofile",
    element: <UserProfile></UserProfile>,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword></ForgotPassword>,
  },
  {
    path: "/verify-otp/:id",
    element:<VerfiyOtp></VerfiyOtp>
  },
  {
    path:'/update-password/:id',
    element:<UpdatePassword></UpdatePassword>
  }
]);

function App() {
  return (
    <Context>
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>
    </Context>
  );
}

export default App;
