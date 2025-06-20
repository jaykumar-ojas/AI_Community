import SkeletonReplyCard from './ReplySkeleton';

const ReplySkeletonLayout = () => {
  return (
    <>
      <SkeletonReplyCard lines={2} indent={false} />
      <SkeletonReplyCard lines={3} indent={true} />
      <SkeletonReplyCard lines={2} indent={false} />
      <SkeletonReplyCard lines={2} indent={false} />
      <SkeletonReplyCard lines={3} indent={true} />
      <SkeletonReplyCard lines={2} indent={false} />
      <SkeletonReplyCard lines={2} indent={false} />
      <SkeletonReplyCard lines={3} indent={true} />
      <SkeletonReplyCard lines={2} indent={false} />
    </>
  );
};

export default ReplySkeletonLayout;
