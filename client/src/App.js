import logo from './logo.svg';
import './App.css';
import Navbar from './component/Navbar/Navbar'
import DashBoardPage from "./pages/DashBoardPage/DashBoardPage"
import Login from './component/Auth/Login'
import Register from './component/Auth/Register';

function App() {
  return (
    <div className="App">
      {/* <DashBoardPage></DashBoardPage> */}
      <Register></Register>
    </div>
  );
}

export default App;
