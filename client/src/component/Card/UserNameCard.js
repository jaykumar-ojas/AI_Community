import React from "react";
import Skeleton from "react-loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import "react-loading-skeleton/dist/skeleton.css";
import founderImage from "../../asset/founderImage.png";
const baseUrl = process.env.REACT_APP_BASE_URL;

const fetchUserById = async (id) => {
  const res = await fetch(`${baseUrl}/getUserById/${id}`);
  const json = await res.json();
  if (json.status !== 200) throw new Error("Failed to fetch user");
  return json.user;
};

const UserNameCard = ({ id ,hover=true, size=8}) => {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUserById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="relative min-w-[60px]">
      {isLoading ? (
        <Skeleton
          width={60}
          height={14}
          baseColor="#d1d5db"
          highlightColor="#6b7280"
        />
      ) : (
        <div className="flex flex-row items-center justify-content gap-0.5">
          <div className="font-semibold font-['Aerial'] dark:text-low_text truncate">{user?.userName}</div>
          {user?.founding_member && <div className="relative group inline-block">
            <img
              src={founderImage}
              alt="Founder Badge"
              className={`h-${size} select-none cursor-pointer`}
              onContextMenu={(e) => e.preventDefault()}
              draggable="false"
            />
            <div className={`absolute w-44 top-full z-20 mb-2 hidden ${hover? "group-hover:block" : ""} bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm font-semibold px-3 py-2 rounded-lg shadow-lg`}>
              <img src={founderImage} alt="founder Badge" className="h-4 w-4" />
              Founder Badge
              <p className="text-xs text-gray-600  dark:text-low_text mt-1">
                Early creators and core community member.
              </p>
            </div>
          </div>}
        </div>
      )}
    </div>
  );
};

export default UserNameCard;

const HoverCard = () => {
  return (
    <div className="absolute bottom-0 w-10 font-['Aerial'] font-semibold p-2">
      Founder badge
    </div>
  );
};
