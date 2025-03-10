import {
    Disclosure,
    DisclosureButton,
    DisclosurePanel,
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
  } from "@headlessui/react";
  import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
  import logo from './logo.jpg'
import { useContext } from "react";
import { LoginContext } from "../ContextProvider/context";
// import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
  
  const navigation = [
    { name: "Dashboard", href: "#", current: true },
    { name: "Team", href: "/test2", current: false },
    { name: "Projects", href: "#", current: false },
    { name: "Calendar", href: "#", current: false },
  ];
  
  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }
  
  export default function Navbar() {
    const {loginData,setLoginData} = useContext(LoginContext);
    // const history = useNavigate();

    const logoutUser =async()=>{
      console.log("call happen");
      const token = localStorage.getItem("userdatatoken");
      console.log(token);
      const data = await fetch("http://localhost:8099/logout",{
        method:"GET",
        headers:{
          "Content-Type":"application/json",
          "Authorization":token,
          Accept:"application/json"
        },
        credentials:"include"
      });

      const res = await data.json();
      console.log("call happen with ", res);
      console.log(res)
      if(!res || res.status===401){
        console.log("some error happened");
      }
      else{
        
        localStorage.removeItem("userdatatoken");
        setLoginData(false);
        // history("/login");
        alert("user successfully logout");
        console.log("user successfully logout");
      }
    }


    return (
      <Disclosure as="nav" className="sticky top-0 z-50 bg-gray-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Mobile Menu */}
            <div className="flex items-center sm:hidden">
              <DisclosureButton className="inline-flex items-center justify-center p-2 text-gray-600 hover:bg-gray-200 hover:text-gray-800 rounded-md">
                <span className="sr-only">Open main menu</span>
                <Bars3Icon className="h-6 w-6" />
              </DisclosureButton>
            </div>
  
            {/* Logo and Navigation Links */}
            <div className="flex items-center space-x-4">
              <img
                src={logo}
                alt="Logo"
                className="h-10 w-auto"
              />
              <div className="hidden sm:flex space-x-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={classNames(
                      item.current
                        ? "text-indigo-600 font-semibold"
                        : "text-gray-600 hover:text-indigo-600",
                      "px-3 py-2 rounded-md text-sm"
                    )}
                    aria-current={item.current ? "page" : undefined}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
  
            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center px-4 py-2 rounded-full border border-gray-300 shadow-sm bg-white">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-48 md:w-64 outline-none bg-transparent text-gray-700 placeholder-gray-400 text-sm"
                />
                <button className="p-2 rounded-full hover:bg-gray-100 transition">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 192.904 192.904"
                    width="20px"
                    className="fill-gray-500"
                  >
                    <path d="m190.707 180.101-47.078-47.077c11.702-14.072 18.752-32.142 18.752-51.831C162.381 36.423 125.959 0 81.191 0 36.422 0 0 36.423 0 81.193c0 44.767 36.422 81.187 81.191 81.187 19.688 0 37.759-7.049 51.831-18.751l47.079 47.078a7.474 7.474 0 0 0 5.303 2.197 7.498 7.498 0 0 0 5.303-12.803zM15 81.193C15 44.694 44.693 15 81.191 15c36.497 0 66.189 29.694 66.189 66.193 0 36.496-29.692 66.187-66.189 66.187C44.693 147.38 15 117.689 15 81.193z"></path>
                  </svg>
                </button>
              </div>
  
              {/* Notification and Profile Dropdown */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-800"
                >
                  <BellIcon className="h-6 w-6" />
                </button>
                <Menu as="div" className="relative z-10">
                  <MenuButton className="flex items-center focus:outline-none">
                    <img
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      alt="Profile"
                      className="h-8 w-8 rounded-full"
                    />
                  </MenuButton>
                  <MenuItems className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <MenuItem>
                      {({ active }) => (
                        <Link
                          to="/userprofile"
                          className={`block px-4 py-2 text-sm ${
                            active ? "bg-gray-100" : "text-gray-700"
                          }`}
                        >
                          Your Profile
                        </Link>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ active }) => (
                        <a
                          href="#"
                          className={`block px-4 py-2 text-sm ${
                            active ? "bg-gray-100" : "text-gray-700"
                          }`}
                        >
                          Settings
                        </a>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ active }) => (
                        <a
                          href="#"
                          onClick={logoutUser}
                          className={`block px-4 py-2 text-sm ${
                            active ? "bg-gray-100" : "text-gray-700"
                          }`}
                        >
                          Sign Out
                        </a>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </div>
            </div>
          </div>
        </div>
  
        {/* Mobile Menu Panel */}
        <DisclosurePanel className="sm:hidden">
          <div className="space-y-1 px-2 pt-2 pb-3">
            {navigation.map((item) => (
              <DisclosureButton
                key={item.name}
                as="a"
                href={item.href}
                className={classNames(
                  item.current
                    ? "bg-indigo-100 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-200 hover:text-indigo-600",
                  "block rounded-md px-3 py-2 text-base font-medium"
                )}
                aria-current={item.current ? "page" : undefined}
              >
                {item.name}
              </DisclosureButton>
            ))}
          </div>
        </DisclosurePanel>
      </Disclosure>
    );
  }
  