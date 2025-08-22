import React from "react";
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import { encodeId } from "../../utils/hashids";
import { useQuery } from "@tanstack/react-query";
import "react-loading-skeleton/dist/skeleton.css";

const fetchUserById = async (id) => {
  const res = await fetch(`/getUserById/${id}`);
  const json = await res.json();
  if (json.status !== 200) throw new Error("Failed to fetch user");
  return json.user;
};

const UserIconCard = ({ id }) => {
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUserById(id),
    enabled: !!id, // only fetch if id exists
    staleTime: 5 * 60 * 1000, // optional: 5 min cache
  });

  const [imgError, setImgError] = React.useState(false);
  const profileUrl = !imgError ? (user?.profilePictureUrl || user?.image || "") : "";
  const initial = (user?.userName || "").trim().charAt(0).toUpperCase();

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/sample-user/${encodeId(id)}`);
      }}
      className="relative z-10 w-full h-full rounded-full overflow-hidden cursor-pointer"
    >
      {isLoading ? (
        <Skeleton
          circle
          width="100%"
          height="100%"
          baseColor="#d1d5db"
          highlightColor="#6b7280"
        />
      ) : profileUrl ? (
        <img
          src={profileUrl}
          alt="User"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gray-300 text-gray-700 flex items-center justify-center">
          <span className="text-lg font-semibold">
            {initial || ""}
          </span>
        </div>
      )}
    </div>
  );
};

export default UserIconCard;
