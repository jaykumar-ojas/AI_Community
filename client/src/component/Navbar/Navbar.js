import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import {
  Bars3Icon,
  BellIcon,
  HomeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  UserIcon as UserIconSolid,
} from "@heroicons/react/24/solid";
import logo from "./logo.png";
import { useContext, createContext, useEffect } from "react";
import { LoginContext } from "../ContextProvider/context";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated, logout } from "../../utils/authUtils";
import { DynamicNumberSVG, PlusIcon, SearchIcon } from "../../asset/icons";
import NotificationComponent from "../Notification/Notification";
import { useState } from "react";
import { encodeId } from "../../utils/hashids";
import UserIconCard from "../Card/UserIconCard";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Create context for forum visibility
export const ForumContext = createContext();

const navigation = [
  { name: "Home", href: "/", current: true },
  { name: <PlusIcon />, href: "/post", current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar({ showForum, setShowForum }) {
  const { loginData, setLoginData } = useContext(LoginContext);
  const [showNotification, setShowNotification] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  console.log(loginData?.validuserone);

  const [darkMode, setDarkMode] = useState(false);

  const { data: userData, isLoading, isError } = useQuery({
  queryKey: ["userCredit", loginData?.validuserone?._id],
  queryFn: async () => {
    const { data } = await axios.get(
      `/api/getCredit/${loginData?.validuserone?._id}`
    );
    return data; // { credit: 120 }
  },
  enabled: !!loginData?.validuserone?._id, // only run when userId exists
});



  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    setLoginData(null);
    navigate("/");
  };

  const handleForumToggle = () => {
    setShowForum(!showForum);
  };

  // Mobile bottom navigation items
  const mobileNavItems = [
    {
      name: "Home",
      href: "/",
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      isActive: location.pathname === "/" && !showForum,
      onClick: () => setShowForum(false), // Close forum when Home is clicked
    },
    {
      name: "Post",
      href: "/post",
      icon: PlusIcon,
      iconSolid: PlusIcon,
      isActive: location.pathname === "/post",
      // isSpecial: true, // Special styling for add button
    },
    {
      name: "Forum",
      onClick: handleForumToggle,
      icon: () => (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      iconSolid: () => (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      isActive: showForum,
      isTab: true,
    },
    {
      name: "Profile",
      href:
        isAuthenticated() && loginData
          ? `/userprofile/${encodeId(loginData?.validuserone?._id)}`
          : "/login",
      icon: UserIcon,
      iconSolid: UserIconSolid,
      isActive: location.pathname.includes("/userprofile"),
      isProfile: true,
    },
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <Disclosure
        as="nav"
        className="sticky top-0 z-50 min-h-[3rem] hidden sm:block"
      >
        <div className="relative bg-gray-200 dark:bg-gray-900 min-h-[3rem]">
          <div className="relative z-10 max-w-[97%] mx-auto px-4 sm:px-6 lg:px-0">
            <div className="flex justify-between items-center h-14">
              {/* Logo and Navigation Links */}
              <div className="relative flex h-full items-center space-x-4 overflow-hidden">
                <Link
                  to={"/"}
                  className="h-14 w-14 flex items-center justify-center rounded-md"
                >
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-full w-full object-contain p-1"
                  />
                </Link>
                <div className="hidden sm:flex space-x-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={classNames(
                        item.current
                          ? "text-like_color font-semibold"
                          : "text-gray-900 dark:text-text_header hover:text-like_color",
                        "px-3 py-2 rounded-md text-sm"
                      )}
                      aria-current={item.current ? "page" : undefined}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                {/* Navigation links removed */}
              </div>

              {/* User icon bell icon */}
              <div className="flex items-center space-x-4">
                <DynamicNumberSVG value={loginData ? loginData?.validuserone?.credit : 50 }/>
                {/* Notification and Profile Dropdown */}
                <div className="flex items-center space-x-4">
                  <Menu as="div" className="relative z-10">
                    <MenuButton className="flex items-center focus:outline-none p-2 hover:dark:bg-gray-800 hover:bg-gray-200 rounded-full transition">
                      <BellIcon className="h-6 w-6 text-gray-900 dark:text-white" />
                    </MenuButton>
                    <MenuItems
                      as="div"
                      className="absolute left-1/2 -translate-x-2/3 mt-3 w-96 max-h-[80vh] rounded-lg shadow-2xl backdrop-blur-md focus:outline-none overflow-hidden z-50"
                    >
                      <NotificationComponent isOpen={true} onClose={() => {}} />
                    </MenuItems>
                  </Menu>
                  {showNotification && (
                    <NotificationComponent
                      isOpen={true}
                      onClose={() => {
                        setShowNotification(false);
                      }}
                    />
                  )}
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:scale-110 transition"
                  >
                    {darkMode ? "☀️" : "🌙"}
                  </button>
                  {isAuthenticated() && loginData ? (
                    <Menu as="div" className="relative z-10">
                      <MenuButton className="flex items-center focus:outline-none">
                        {/* <img
                          src={
                            loginData?.validuserone?.profilePictureUrl ||
                            loginData?.validuserone?.image
                          }
                          alt="Profile"
                          className="h-8 w-8 rounded-full"
                          referrerPolicy="no-referrer"
                        /> */}
                        <div className="h-8 w-8 flex flex-shrink-0 pointer-events-none">
                          <UserIconCard id={loginData?.validuserone?._id} />
                        </div>
                      </MenuButton>
                      <MenuItems className="absolute right-0 mt-2 w-48 shadow-md rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <MenuItem>
                          {({ active }) => (
                            <Link
                              to={`/userprofile/${encodeId(
                                loginData?.validuserone?._id
                              )}`}
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
                    </Menu>
                  ) : (
                    <Link
                      to="/login"
                      className="text-gray-900 dark:text-white px-4 py-2"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Disclosure>

      {/* Mobile Top Bar - Desktop Style */}
      <div className="sm:hidden sticky top-0 z-50">
        <div className="relative min-h-[3rem] border-b dark:border-gray-900">
          <div className="relative z-10 px-2">
            <div className="flex justify-between items-center h-12">
              {/* Logo and Navigation Links */}
              <div className="relative flex h-full items-center space-x-4 overflow-hidden">
                <Link
                  to={"/"}
                  className="h-12 w-12 flex items-center justify-center rounded-md"
                >
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-full w-full object-contain p-1"
                  />
                </Link>

                {/* Navigation links removed */}
              </div>

              {/* User icon bell icon */}
              <div className="flex items-center space-x-4">
                {/* Notification and Profile Dropdown */}
                <div className="flex items-center ">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:scale-110 transition"
                  >
                    {darkMode ? "☀️" : "🌙"}
                  </button>
                  <Menu as="div" className="relative z-10">
                    <MenuButton className="flex items-center focus:outline-none p-2 hover:bg-gray-800 rounded-full transition">
                      <BellIcon className="h-6 w-6 dark:text-white text-gray-900" />
                    </MenuButton>
                    <MenuItems
                      as="div"
                      className="absolute left-1/2 -translate-x-2/3 mt-3 w-80 max-h-[80vh] rounded-lg shadow-2xl backdrop-blur-md focus:outline-none overflow-hidden z-50"
                    >
                      <NotificationComponent isOpen={true} onClose={() => {}} />
                    </MenuItems>
                  </Menu>
                  {isAuthenticated() && loginData ? (
                    <Menu as="div" className="relative z-10">
                      <MenuButton className="flex items-center focus:outline-none">
                        {/* <img
                          src={
                            loginData?.validuserone?.profilePictureUrl ||
                            loginData?.validuserone?.image
                          }
                          alt="Profile"
                          className="h-8 w-8 rounded-full"
                          referrerPolicy="no-referrer"
                        /> */}
                        <div className="h-8 w-8 flex flex-shrink-0 pointer-events-none">
                          <UserIconCard id={loginData?.validuserone?._id} />
                        </div>
                      </MenuButton>
                      <MenuItems className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <MenuItem>
                          {({ active }) => (
                            <Link
                              to={`/userprofile/${encodeId(
                                loginData?.validuserone?._id
                              )}`}
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
                    </Menu>
                  ) : (
                    <Link
                      to="/login"
                      className="dark:text-white text-gray-800 px-4 py-2"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-900">
        <div className="flex items-center justify-around">
          {mobileNavItems.map((item, index) => {
            const Component = item.isTab ? "button" : Link;
            const props = item.isTab
              ? { onClick: item.onClick }
              : {
                  to: item.href,
                  onClick: item.onClick, // Add onClick for all items that have it
                };

            return (
              <Component
                key={item.name}
                {...props}
                className={classNames(
                  "flex flex-col items-center justify-center pt-1 px-3 rounded-xl transition-all duration-200",
                  item.isActive
                    ? "text-blue-600"
                    : "text-gray-600 dark:text-white hover:text-gray-900",
                  item.isSpecial
                    ? "bg-blue-600 text-white hover:bg-blue-700 rounded-full p-3 -mt-4 shadow-lg"
                    : ""
                )}
              >
                {item.isProfile && isAuthenticated() && loginData ? (
                  <div
                    className={classNames(
                      "relative",
                      item.isActive
                        ? "ring-2 ring-blue-600 ring-offset-1 rounded-full"
                        : ""
                    )}
                  >
                    <div className="h-8 w-8 flex flex-shrink-0">
                      <UserIconCard id={loginData?.validuserone?._id} />
                    </div>
                  </div>
                ) : (
                  <div
                    className={classNames(item.isSpecial ? "text-white" : "")}
                  >
                    {item.isActive && !item.isSpecial ? (
                      <item.iconSolid className="h-6 w-6" />
                    ) : (
                      <item.icon className="h-6 w-6" />
                    )}
                  </div>
                )}
                {!item.isSpecial && (
                  <span
                    className={classNames(
                      "text-xs mt-1 font-medium",
                      item.isActive
                        ? "text-blue-600"
                        : "text-gray-600 dark:text-white"
                    )}
                  >
                    {item.name}
                  </span>
                )}
              </Component>
            );
          })}
        </div>
      </div>

      {/* Add padding bottom to content on mobile to prevent overlap with bottom nav */}
      {/* <div className="sm:hidden h-16"></div> */}
    </>
  );
}
