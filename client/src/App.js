import logo from './logo.svg';
import './App.css';
import Navbar from './component/Navbar/Navbar'
import DashBoardPage from "./pages/DashBoardPage/DashBoardPage"
import Login from './component/Auth/Login'
import Register from './component/Auth/Register';
import Error from './component/Error/error'
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
