import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ReplySkeleton = ({ indent = false, lines = 3 }) => {
  const baseColor = "#d1d5db"; // gray-300
  const highlightColor = "#6b7280"; // gray-500

  return (
    <div className={`flex justify-start mb-4 ${indent ? "ml-6" : ""}`}>
      {/* User Icon */}
      <div className="w-8 h-8 flex-shrink-0 z-30">
        <Skeleton
          circle
          height={32}
          width={32}
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
      </div>

      {/* Reply Content Skeleton */}
      <div className="flex flex-col px-2 p-4 pt-0 w-full bg-gray-100 dark:bg-bg_comment_box rounded-xl">
        {/* Header */}
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

        {/* Content */}
        <div className="space-y-2">
          <Skeleton
            count={lines}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
        </div>

        <div className="w-full flex flex-row justify-start gap-3 h-[100px] sm:h-[120px] rounded-md overflow-hidden shadow-sm">
  <div className="w-1/3 h-full">
    <Skeleton
      height="100%"
      width="100%"
      baseColor={baseColor}
      highlightColor={highlightColor}
    />
  </div>
  <div className="w-1/3 h-full">
    <Skeleton
      height="100%"
      width="100%"
      baseColor={baseColor}
      highlightColor={highlightColor}
    />
  </div>
</div>


        {/* Action buttons */}
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

export default ReplySkeleton;
