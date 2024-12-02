import logo from './logo.svg';
import './App.css';
import Navbar from './component/Navbar/Navbar'
import DashBoardPage from "./pages/DashBoardPage/DashBoardPage"
import Login from './component/Auth/Login'
import Register from './component/Auth/Register';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import React from 'react';


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
  }

]);


function App() {
  return (
    <React.StrictMode>
    <RouterProvider router={router} />
    </React.StrictMode>
  );
}

export default App;
