import logo from './logo.svg';
import './App.css';
import Navbar from './component/Navbar/Navbar'
import DashBoardPage from "./pages/DashBoardPage/DashBoardPage"
import Login from './component/Auth/Login'
import Register from './component/Auth/Register';
import UserProfile from './component/UserProfile/userProfile'
import Error from './component/Error/error'
import Uploader from './pages/Uploader';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import React from 'react';
import Context from './component/ContextProvider/context';


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
<<<<<<< HEAD
    path:"/Uploader",
    element:<Uploader></Uploader>
=======
    path:'/userprofile',
    element:<UserProfile></UserProfile>
>>>>>>> da3fc29df36a00c4fff29186bcd98b8a1fd46f6d
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
