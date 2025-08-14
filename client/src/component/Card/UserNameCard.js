import React from "react";
import Skeleton from "react-loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import "react-loading-skeleton/dist/skeleton.css";


const fetchUserById = async (id) => {
  const res = await fetch(`/getUserById/${id}`);
  const json = await res.json();
  if (json.status !== 200) throw new Error("Failed to fetch user");
  return json.user;
};


const UserNameCard = ({ id }) => {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUserById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="relative min-w-[60px]">
      {isLoading ? (
        <Skeleton width={60} height={14} baseColor="#d1d5db" highlightColor="#6b7280" />
      ) : (
        <span>{user?.userName}</span>
      )}
    </div>
  );
};

export default UserNameCard;
