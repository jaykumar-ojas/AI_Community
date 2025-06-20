// PostSkeleton.js
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const HeaderSkeleton = () => {
  const baseColor = "#d1d5db";     // Tailwind gray-300
const highlightColor = "#374151"; // Tailwind gray-700

  return (
    <div className="flex justify-start mb-6 animate-pulse">
      <div className="w-8 h-8 flex-shrink-0">
        <Skeleton
          circle
          height={32}
          width={32}
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
      </div>

      <div className="flex flex-col p-4 pt-0 ml-2 rounded-xl w-full bg-bg_commment_box  shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Skeleton
              width={80}
              height={14}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
            <Skeleton
              circle
              width={6}
              height={6}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
            <Skeleton
              width={50}
              height={12}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
          </div>
          <Skeleton
            width={20}
            height={20}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
        </div>

        <div className="pt-2 space-y-1">
          <Skeleton
            count={4}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
        </div>

        <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton
              key={i}
              height={100}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
          ))}
        </div>

        <div className="pt-4 flex gap-4 text-xs text-gray-500">
          <Skeleton
            width={60}
            height={20}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
          <Skeleton
            width={60}
            height={20}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
          <Skeleton
            width={50}
            height={20}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
        </div>
      </div>
    </div>
  );
};

export default HeaderSkeleton;
