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
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  UserIcon as UserIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
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
import "./wave-btn.css";
import logoName from "./logoName.png";
import Switch from "./toggle";
import ModelTicker from "./ModelTicker";
import { getAuthHeaders } from "../AiForumPage/components/ForumUtils";
import PromoCard from "../Card/PromoCard";
const baseUrl = process.env.REACT_APP_BASE_URL;
// Create context for forum visibility
export const ForumContext = createContext();

const fetchUnreadCount = async ({ userId, baseUrl }) => {
  if (!userId) return { unreadCount: 0 };

  const token = localStorage.getItem("userdatatoken");

  const res = await fetch(`${baseUrl}/getNotification/unreadCount/${userId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch unread count");
  }

  const json = await res.json();
  return { unreadCount: Number(json.unreadCount ?? 0) };
};

const navigation = [
  { name: "Home", href: "/" },
  { name: `generate image`, href: "/post" },
  { name: "Feedback", href: "/feedback" },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar({ showForum, setShowForum }) {
  const { loginData, setLoginData } = useContext(LoginContext);
  const [showNotification, setShowNotification] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const userId = loginData?.validuserone?._id || null;

  const { data: unreadSummary, refetch: refetchUnread, isFetching: isFetchingUnread, error: unreadError } = useQuery({
  queryKey: ["notificationsUnread", userId],
  queryFn: () => fetchUnreadCount({ userId, baseUrl }),
  enabled: !!userId,
  refetchInterval: 5 * 60 * 1000, // 5 minutes
  refetchIntervalInBackground: true, // keeps polling in background tabs (optional)
  staleTime: 60_000, // 1 minute - adjust as needed
  cacheTime: 2 * 60_000, // 2 minutes
  retry: 1,
});

useEffect(() => {
  if (!userId) return;
  const count = unreadSummary?.unreadCount ?? 0;
  setUnread(count);
}, [unreadSummary, setUnread, userId]);


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
      name: "generate",
      href: "/post",
      icon: PlusIcon,
      iconSolid: PlusIcon,
      isActive: location.pathname === "/post",
      //isSpecial: true, // Special styling for add button
    },
    {
      name: "Forum",
      // onClick: handleForumToggle,
      href: "/forum",
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
      isActive: location.pathname === "/forum",
      // isTab: true,
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
        className="sticky top-0 z-50 min-h-[2.5rem] hidden sm:block"
      >
        <div className="relative bg-neutral-50 dark:bg-bg_dark min-h-[2.5rem]">
          <div className="relative z-10 max-w-[97%] mx-auto px-4 sm:px-6 lg:px-0">
            <div className="flex justify-between items-center h-10">
              {/* Logo and Navigation Links */}
              <div className="relative flex h-full items-center space-x-4 overflow-hidden">
                <Link
                  to={"/"}
                  className="flex items-center justify-center rounded-md"
                >
                  <div className="flex items-center justify-center">
                    <img
                      src={logo}
                      alt="Logo"
                      className="h-full w-12 object-contain p-1 "
                    />
                    <img
                      src={logoName}
                      alt="LogoAvatar"
                      className="h-full w-24 -ml-1 object-contain p-1 "
                    />
                  </div>
                </Link>
                {/* Desktop links */}
                <div className="hidden sm:flex space-x-2">
                  {navigation.map((item) => {
                    const isCurrent = location.pathname === item.href; // dynamically check
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          isCurrent
                            ? "text-theme_dark_color dark:text-theme_color"
                            : " rounded-md  text-[#1a1a1a] dark:text-low_text hover:text-theme_hover dark:hover:text-theme_hover",
                          "px-2  font-[Arial,sans-serif] font-semibold text-md transition-colors duration-200"
                        )}
                        aria-current={isCurrent ? "page" : undefined}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>

                {/* Navigation links removed */}
              </div>

              {/* User icon bell icon */}
              <div className="flex items-center space-x-4">
                {/* Notification and Profile Dropdown */}
                <div className="flex items-center space-x-4">
                   {loginData && <Menu as="div" className="relative z-10">
                      <MenuButton className="flex w-full items-center focus:outline-none">
                       <DynamicNumberSVG
                    value={loginData ? loginData?.validuserone?.credit : 50}
                  />
                      </MenuButton>
                      <MenuItems className="absolute right-0 mt-2 w-96">
                        <MenuItem >
                          <PromoCard/>
                        </MenuItem>
                       
                      </MenuItems>
                    </Menu>}
                  <Menu as="div" className="relative z-10">
                    <MenuButton
                      className="flex items-center focus:outline-none text-[#1a1a1a] hover:text-theme_color dark:hover:text-theme_color dark:text-low_text p-2 dark:hover:bg-[#0d0d0d] hover:bg-gray-200 rounded-full transition"
                      aria-label={`Notifications${
                        unread > 0 ? `, ${unread} unread` : ""
                      }`}
                    >
                      <div className="relative">
                        <BellIcon className="h-6 w-6 stroke-[2]" />
                        {unread > 0 && (
                          <span
                            className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white bg-red-600 rounded-full shadow-sm"
                            aria-hidden="true"
                          >
                            {unread > 10 ? "10+" : unread}
                          </span>
                        )}
                      </div>
                    </MenuButton>

                    <MenuItems
                      as="div"
                      className="absolute right-0 mt-3 w-96 max-h-[80vh] rounded-lg shadow-2xl backdrop-blur-md focus:outline-none overflow-hidden z-50"
                    >
                      {/* pass unread & setUnread so NotificationComponent can update parent */}
                      <NotificationComponent
                        onClose={() => {}}
                        setUnread={setUnread}
                      />
                    </MenuItems>
                  </Menu>
                  {isAuthenticated() && loginData ? (
                    <Menu as="div" className="relative z-10">
                      <MenuButton className="flex items-center focus:outline-none">
                        <div className="h-8 w-8 flex flex-shrink-0 pointer-events-none">
                          <UserIconCard id={loginData?.validuserone?._id} />
                        </div>
                      </MenuButton>
                      <MenuItems className="bg-gray-100 dark:bg-black font-[Arial,sans-serif] font-semibold absolute right-0 mt-2 w-48 shadow-md rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <MenuItem>
                          <Link
                            to={`/userprofile/${encodeId(
                              loginData?.validuserone?._id
                            )}`}
                            className={`block px-4 py-2 text-sm hover:bg-gray-200 hover:text-theme_dark_color dark:hover:text-theme_color dark:text-low_text dark:bg-dark dark:hover:bg-nav_hover "
                              `}
                          >
                            Your Profile
                          </Link>
                        </MenuItem>
                        <MenuItem>
                          <Link
                            to="/feedback"
                            className={`block px-4 py-2 text-sm hover:bg-gray-200 hover:text-theme_dark_color dark:hover:text-theme_color dark:text-low_text dark:bg-dark dark:hover:bg-nav_hover`}
                          >
                            Feedback
                          </Link>
                        </MenuItem>
                        <MenuItem>
                          <a
                            href="#"
                            onClick={handleLogout}
                            className={`block px-4 py-2 text-sm hover:bg-gray-200 hover:text-theme_dark_color dark:hover:text-theme_color dark:text-low_text dark:bg-dark dark:hover:bg-nav_hover`}
                          >
                            Sign Out
                          </a>
                        </MenuItem>
                      </MenuItems>
                    </Menu>
                  ) : (
                    <>
                      <Link
                        to="/feedback"
                        className={classNames(
                          location.pathname === "/feedback"
                            ? "text-theme_dark_color dark:text-theme_color"
                            : "text-[#1a1a1a] dark:text-low_text hover:text-theme_hover dark:hover:text-theme_hover",
                          "px-2 font-[Arial,sans-serif] font-semibold text-md transition-colors duration-200"
                        )}
                      >
                        Feedback
                      </Link>
                      <Link
                        to="/login"
                        className="px-3 py-2 rounded-md text-sm"
                        aria-current={
                          location.pathname === "/login" ? "page" : undefined
                        }
                      >
                        <button
                          type="button"
                          className="p-1 px-2 rounded-md font-[Arial,sans-serif] font-semibold text-gray-800 dark:text-low_text dark:hover:bg-nav_hover dark:hover:text-theme_color"
                        >
                          Sign In
                        </button>
                      </Link>
                    </>
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
              <div className="font-[Arial,sans-serif] font-semibold relative flex h-full items-center space-x-4 overflow-hidden">
                <Link
                  to={"/"}
                  className="h-12 flex items-center justify-center rounded-md"
                >
                  <div className="flex items-center justify-center">
                    <img
                      src={logo}
                      alt="Logo"
                      className="h-full w-14 object-contain p-1"
                    />
                    <img
                      src={logoName}
                      alt="LogoAvatar"
                      className="h-full w-24 -ml-1 object-contain p-1"
                    />
                  </div>
                </Link>

                {/* Navigation links removed */}
              </div>

              {/* User icon bell icon */}
              <div className="flex items-center space-x-2">
                {loginData && (
                  <DynamicNumberSVG
                    value={loginData ? loginData?.validuserone?.credit : 50}
                    size={5}
                  />
                )}
                {/* Notification and Profile Dropdown */}
                <div className="flex items-center space-x-4">
                  <Menu as="div" className="relative z-10">
                    <MenuButton onClick={()=>{navigate('/notification')}} className="flex items-center focus:outline-none text-[#1a1a1a] hover:text-theme_color  dark:hover:text-theme_color dark:text-low_text p-2 dark:hover:bg-[#0d0d0d] hover:bg-gray-200 rounded-full transition">
                      <BellIcon className="h-6 w-6 " />
                    </MenuButton>
                    {/* <MenuItems
                      as="div"
                      className="absolute left-1/2 -translate-x-2/3 mt-3 w-96 max-h-[80vh] rounded-lg shadow-2xl backdrop-blur-md focus:outline-none overflow-hidden z-50"
                    >
                      <NotificationComponent isOpen={true} onClose={() => {}} />
                    </MenuItems> */}
                  </Menu>
                  {showNotification && (
                    <NotificationComponent
                      isOpen={true}
                      onClose={() => {
                        setShowNotification(false);
                      }}
                    />
                  )}

                  {isAuthenticated() && loginData ? (
                    <Menu as="div" className="relative z-10">
                      <MenuButton className="flex items-center focus:outline-none">
                        <div className="h-8 w-8 flex flex-shrink-0 pointer-events-none">
                          <UserIconCard id={loginData?.validuserone?._id} />
                        </div>
                      </MenuButton>
                      <MenuItems className="bg-gray-100 dark:bg-black font-[Arial,sans-serif] font-semibold absolute right-0 mt-2 w-48 shadow-md rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <MenuItem>
                          <Link
                            to={`/userprofile/${encodeId(
                              loginData?.validuserone?._id
                            )}`}
                            className={`block px-4 py-2 text-sm hover:bg-gray-200 hover:text-theme_dark_color dark:hover:text-theme_color dark:text-low_text dark:bg-dark dark:hover:bg-nav_hover "
                              `}
                          >
                            Your Profile
                          </Link>
                        </MenuItem>
                        <MenuItem>
                          <Link
                            to="/feedback"
                            className={`block px-4 py-2 text-sm hover:bg-gray-200 hover:text-theme_dark_color dark:hover:text-theme_color dark:text-low_text dark:bg-dark dark:hover:bg-nav_hover`}
                          >
                            Feedback
                          </Link>
                        </MenuItem>
                        <MenuItem>
                          <a
                            href="#"
                            onClick={handleLogout}
                            className={`block px-4 py-2 text-sm hover:bg-gray-200 hover:text-theme_dark_color dark:hover:text-theme_color dark:text-low_text dark:bg-dark dark:hover:bg-nav_hover`}
                          >
                            Sign Out
                          </a>
                        </MenuItem>
                      </MenuItems>
                    </Menu>
                  ) : (
                    <Link
                      to="/login"
                      className="px-3 py-2 rounded-md text-sm"
                      aria-current={
                        location.pathname === "/login" ? "page" : undefined
                      }
                    >
                      <button
                        type="button"
                        className="p-1 px-2 rounded-md font-[Arial,sans-serif] font-semibold text-gray-800 dark:text-low_text dark:hover:bg-nav_hover dark:hover:text-theme_color"
                      >
                        Sign In
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModelTicker />

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-bg_dark border-t border-gray-200 dark:border-gray-900">
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
                    ? "text-theme_color"
                    : "text-gray-600 dark:text-low_text hover:text-[#1a1a1a]",
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
                        ? "ring-2 ring-theme_color ring-offset-1 rounded-full"
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
                        ? "text-theme_color"
                        : "text-gray-600 dark:text-low_text"
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
