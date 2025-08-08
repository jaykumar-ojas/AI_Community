import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const masonryHeights = [
  350, 400, 330, 300, 450, 400,
  430, 600, 560, 480, 340, 380,
];

const SkeletonCard = ({ height }) => {
    const baseColor= '#d1d5db';
    const highlightColor='#6b7280';
    return(
  <div className="mb-4 rounded-lg overflow-hidden">
    <Skeleton height={height} className="w-full rounded-lg" baseColor={baseColor}
      highlightColor={highlightColor} />
  </div>
    );
};

export const MasonrySkeletonGrid = () => {
  return (
    <div classname="h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar pt-2">
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-3 gap-4 p-4">
      {masonryHeights.map((height, idx) => (
        <SkeletonCard key={idx} height={height} />
      ))}
    </div>
    </div>
  );
};
