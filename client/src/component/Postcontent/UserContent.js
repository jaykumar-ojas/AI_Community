import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import React from "react";
import { Link, useNavigate } from "react-router-dom";

const heartSvg = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="21" id="heart">
      <path
        fill="none"
        fillRule="evenodd"
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M20.84 2.61a5.5 5.5 0 0 0-7.78 0L12 3.67l-1.06-1.06a5.501 5.501 0 0 0-7.78 7.78l1.06 1.06L12 19.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      ></path>
    </svg>
  );
};

const UserContent = ({ post }) => {
  const history = useNavigate();

  const handleDelete = async (postId, imgKey) => {
    try {
      const response = await fetch(`http://localhost:8099/delete/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imgKey }), // Send imgKey in the request body
      });

      const result = await response.json();
      if (response.ok) {
        console.log("Post deleted successfully:", result);
        alert("succesfylly deleted");
        history("/");
      } else {
        console.error("Failed to delete post:", result.error);
      }
    } catch (error) {
      console.error("Error occurred while deleting post:", error);
    }
  };

  const openInNewTab = (url) => {
    window.open(url, "_blank", "noreferrer");
  };

  return (
    <div className="w-full border rounded-lg bg-white shadow-lg flex flex-col gap-0">
      {/* user header */}
      <div className=" flex justify-between items-center w-full h-full">
        <div className="flex jsutify-between">
          <div className="w-12 h-12  m-2 ">
            <img
              src={post?.image}
              className="w-full h-full rounded-full"
              referrerPolicy="no-referrer"
            ></img>
          </div>
          {/* user name remiand */}
          <div className="font-bold text-red-700 m-2 flex items-center">
            {post?.userName}
          </div>
        </div>

        {/* this is for openpanel */}
        <div className="p-3">
          <Menu as="div" className="relative z-10">
            <MenuButton className="flex gap-1 text-gray-700 font-extrabold items-center focus:outline-none">
              <p>.</p>
              <p>.</p>
              <p>.</p>
            </MenuButton>
            <MenuItems className="absolute right-0 mt-2 w-24 bg-white shadow-md rounded-md  ring-1 ring-black ring-opacity-5 focus:outline-none">
              <MenuItem>
                {({ active }) => (
                  <button
                    className={`block border rounded-md px-4 py-2 w-full text-sm font-extrabold text-red-700 ${
                      active ? "bg-red-100 border-red-300" : " text-gray-700"
                    }`}
                    onClick={()=>handleDelete(post._id, post.imgKey)}
                  >
                    Delete
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ active }) => (
                  <button
                    className={`block border rounded-md px-4 py-2 w-full text-sm font-extrabold text-red-700 ${
                      active ? "bg-red-100 border-red-300" : " text-gray-700"
                    }`}
                  >
                    check
                  </button>
                )}
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
      </div>
      {/* user image content */}
      <div
        className="h-81 w-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer"
        style={{ height: "280px" }}
        onClick={() =>
          openInNewTab(
            post?.signedUrl
          )
        } // Adjust the height and width as needed
      >
        <img
          src={post?.signedUrl}
          className="w-full h-full object-cover"
          alt="example"
        />
      </div>

      {/* user description */}
      <div className="">
        <div className="flex items-center justify-center h-8 w-8 m-2">
          {heartSvg()}
        </div>
        <div className="p-2 h-16">{post?.desc}</div>
      </div>
    </div>
  );
};

export default UserContent;
