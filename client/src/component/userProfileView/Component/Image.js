import React from "react";
import PostCard from "./PostCard"
const purl = "";

const samplePosts = [
  {
    _id: "1",
    userId: "user1",
    desc: "Beautiful landscape in Iceland",
    fileType: "image",
    imgUrl: purl,
  },
  {
    _id: "2",
    userId: "user2",
    desc: "Chill beats to relax/study to",
    fileType: "image",
    imgUrl: purl,
  },
  {
    _id: "3",
    userId: "user3",
    desc: "My drone footage over the ocean",
    fileType: "image",
    imgUrl: purl,
  },
  {
    _id: "4",
    userId: "user4",
    desc: "City view from above",
    fileType: "image",
    imgUrl: purl,
  },
  {
    _id: "1",
    userId: "user1",
    desc: "Beautiful landscape in Iceland",
    fileType: "image",
    imgUrl: purl,
  },
  {
    _id: "2",
    userId: "user2",
    desc: "Chill beats to relax/study to",
    fileType: "image",
    imgUrl: purl,
  },
  {
    _id: "3",
    userId: "user3",
    desc: "My drone footage over the ocean",
    fileType: "image",
    imgUrl: purl,
  },
  {
    _id: "4",
    userId: "user4",
    desc: "City view from above",
    fileType: "image",
    imgUrl: purl,
  }
];


const Image = ({data}) =>{
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4">
        {data?.map((post) => (
            <PostCard key={post._id} post={post} />
        ))}
         </div>

    )
}

export default Image;