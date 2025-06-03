import {
    Disclosure,
    DisclosureButton,
    DisclosurePanel,
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
  } from "@headlessui/react";
import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline";
import logo from './logo.jpg'
import { useContext } from "react";
import { LoginContext } from "../ContextProvider/context";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, logout } from "../../utils/authUtils";
import { SearchIcon } from "../../asset/icons";


  const navigation = [
    { name: "Home", href:'/',current: true},
    { name: "Team", href: "/test2", current: false }
  ];
  
  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }
  
  export default function Navbar() {
    const {loginData,setLoginData} = useContext(LoginContext);
    const navigate = useNavigate();

    const handleLogout = () => {
      logout();
      setLoginData(null);
      navigate("/");
    };

    return (
      <>
      <Disclosure as="nav" className="sticky top-0 z-50 backdrop-blur-md backdrop-saturate-150 bg-bg_comment/80 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
          <div className="flex justify-between  items-center h-14">
            {/* Mobile Menu */}
            <div className="flex items-center sm:hidden">
              <DisclosureButton className="inline-flex items-center justify-center p-2 text-gray-600 hover:bg-gray-200 hover:text-gray-800 rounded-md">
                <span className="sr-only">Open main menu</span>
                <Bars3Icon className="h-6 w-6" />
              </DisclosureButton>
            </div>
  
            {/* Logo and Navigation Links */}
            <div className="relative flex h-full items-center space-x-4 overflow-hidden">
              <div className="h-8 w-8 rounded-full overflow-hidden">
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-full w-full object-cover"
                  />
                </div>

              
              <div className="hidden sm:flex space-x-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={classNames(
                      item.current
                        ? "text-like_color font-semibold"
                        : "text-text_header hover:text-like_color",
                      "px-3 py-2 rounded-md text-sm"
                    )}
                    aria-current={item.current ? "page" : undefined}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
              
              {/* search icon */}
            <div className="flex items-center w-[60%] px-4 rounded-full border border-gray-300 shadow-sm bg-bg_comment/70">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-sm"
                />
                <button className="p-2 rounded-full hover:bg-gray-100 transition">
                  <SearchIcon/>
                </button>
              </div>

  
             {/* user icon bell icon */}
            <div className="flex items-center space-x-4">
  
              {/* Notification and Profile Dropdown */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  className="p-2 text-text_header hover:text-text_comment"
                >
                  <BellIcon className="h-6 w-6" />
                </button>
                {isAuthenticated() && loginData ?
                (<Menu as="div" className="relative z-10">
                  <MenuButton className="flex items-center focus:outline-none">
                    <img
                      src={loginData?.validuserone?.profilePictureUrl || loginData?.validuserone?.image}
                      alt="Profile"
                      className="h-8 w-8 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  </MenuButton>
                  <MenuItems className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <MenuItem>
                      {({ active }) => (
                        <Link
                          to={`/userprofile/${loginData?.validuserone?._id}`}
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
                          onClick={handleLogout}
                          className={`block px-4 py-2 text-sm ${
                            active ? "bg-gray-100" : "text-gray-700"
                          }`}
                        >
                          Sign Out
                        </a>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Menu>)
                :(<Link
                  to="/login"
                  className=" text-white px-4 py-2"
                >
                  Sign In
                </Link>)}
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
      </>
    )
}
  