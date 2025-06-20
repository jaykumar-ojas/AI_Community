// components/skeletons/UserContentSkeleton.jsx
import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const UserContentSkeleton = () => {
  return (
    <div className="w-full rounded-lg bg-bg_comment_box/40 shadow-lg flex flex-col gap-0">
      {/* Header */}
      <div className="flex justify-between items-center px-2 w-full h-full py-3">
        <div className="flex items-center gap-2">
          <Skeleton circle width={32} height={32} />
          <Skeleton width={80} height={14} />
        </div>
        <Skeleton width={24} height={14} />
      </div>

      {/* Media */}
      <div className="w-full min-h-[300px] flex justify-center items-center p-2">
        <Skeleton height={300} width="100%" baseColor="#e5e7eb" highlightColor="#9ca3af" />
      </div>

      {/* Interaction */}
      <div className="p-2">
        <div className="flex gap-4 mb-2">
          <Skeleton width={60} height={20} />
          <Skeleton width={60} height={20} />
        </div>
        <Skeleton count={2} height={12} />
      </div>
    </div>
  );
};

export default UserContentSkeleton;
