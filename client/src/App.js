import logo from './logo.svg';
import './App.css';
import Navbar from './component/Navbar/Navbar'
import DashBoardPage from "./pages/DashBoardPage/DashBoardPage"
import Login from './component/Auth/Login'
import Register from './component/Auth/Register';
import UserProfile2 from './component/UserProfile/userProfile2'
import UserProfile from './component/UserProfile/userProfile'
import Error from './component/Error/error'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import React from 'react';
import Context from './component/ContextProvider/context';
import ForgotPassword from './component/Auth/ForgotPassword';


const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login></Login>,
  },
  {
    path:"/register",
    element:<Register></Register>
  },
  {
    path:"/",
    element:<DashBoardPage></DashBoardPage>
  },
  {
    path:"*",
    element:<Error></Error>
  },
  {
    path:'/userprofile',
    element:<UserProfile></UserProfile>
  },
  {
    path:'/forgot-password',
    element: <ForgotPassword></ForgotPassword>
  
  }

]);


function App() {
  return (
    <Context>
      <React.StrictMode>
    <RouterProvider router={router}>

    </RouterProvider>
    </React.StrictMode>
    </Context>
  );
}

export default App;
