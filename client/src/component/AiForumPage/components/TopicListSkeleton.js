import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const TopicSkeletonCard = () => (
  <div className="p-4 hover:bg-bg_comment_box transition-colors cursor-pointer divide-y">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        {/* Title */}
        <Skeleton height={18} width={`60%`} className="mb-2" />

        {/* Content */}
        <Skeleton count={2} height={12} className="mb-2" />

        {/* User info row */}
        <div className="flex flex-row w-full items-center mt-2 space-x-2">
          <Skeleton circle height={24} width={24} />
          <Skeleton width={30} height={12} />
          <Skeleton width={30}  height={12} />
          <Skeleton width={30} height={12} />
          <Skeleton width={30} height={12} />
          <Skeleton width={30} height={12} />
        </div>
      </div>

      {/* Like/Dislike/Delete */}
      <div className="flex items-center space-x-4 ml-4">
        <div className="flex items-center space-x-1 bg-btn_bg rounded-lg px-2 py-0.5">
          <Skeleton   width={24} />
          <Skeleton width={16} />
          <Skeleton  width={24} />
          <Skeleton width={16} />
        </div>
      </div>
    </div>
  </div>
);

export const TopicListSkeleton = ({ count = 6 }) => {
  return (
    <div className="divide-y">
      {Array.from({ length: count }).map((_, idx) => (
        <TopicSkeletonCard key={idx} />
      ))}
    </div>
  );
};
