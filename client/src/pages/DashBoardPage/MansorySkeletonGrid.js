import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const masonryHeights = [
  250, 300, 350, 400, 450, 500,
  320, 380, 420, 280, 360, 340,
  290, 410, 370, 480, 330, 390,
  310, 440, 400, 520, 350, 430,
];

const SkeletonCard = ({ height, index }) => {
    const baseColor= '#f3f4f6';
    const highlightColor='#e5e7eb';
    
    // Add some variation to the skeleton animation
    const animationDelay = (index * 0.1) % 2;
    
    return(
      <div className="mb-4 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="relative">
          <Skeleton 
            height={height} 
            className="w-full rounded-lg" 
            baseColor={baseColor}
            highlightColor={highlightColor}
            style={{ animationDelay: `${animationDelay}s` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </div>
      </div>
    );
};

export const MasonrySkeletonGrid = () => {
  return (
    <div className="h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar pt-2">
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-3 gap-4 p-4">
      {masonryHeights.map((height, idx) => (
        <SkeletonCard key={idx} height={height} index={idx} />
      ))}
    </div>
    </div>
  );
};
