import React, { useEffect, useState } from "react";
import Audio from "./Audio";
import Video from "./Video";
import Image from "./Image";
import { useParams } from "react-router-dom";

const tabs = ['Image', 'Video', 'Audio', 'Saved'];

const TabProfile = () => {
    const [activeTab, setActiveTab] = useState('Image');
    const [posts,setPosts] = useState([]);
    const [image,setImage] = useState([]);
    const [video,setVideo] = useState([]);
    const [audio,setAudio] = useState([]);
    const {id} = useParams();

    const filterPostData = () => {
        setImage(posts.filter(post => post.fileType === "image"));
        setVideo(posts.filter(post => post.fileType === "video"));
        setAudio(posts.filter(post => post.fileType === "audio"));
    };

    console.log("this is my image",image);

    useEffect(()=>{
        filterPostData();
    },[posts])

    useEffect(()=>{
        fetchUserPosts(id);
    },[id]);

    const fetchUserPosts = async (userId) => {
        if (!userId) {
        return;
        }
        
        try {
        const response = await fetch('http://localhost:8099/get', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: userId }),
        });

        
        
        const data = await response.json();
        console.log("i m coming back from database",data);
        
        if (data.status === 200) {
            setPosts(data.userposts);
            console.log("i m setting posts");
        }
        } catch (error) {
        console.error("Error fetching user posts:", error);
        } finally {
        console.log("not")
        }
    };

    return (
        <>
            <div className="border-b pt-3  flex gap-6 border-gray-300">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-2 text-lg font-semibold transition-colors duration-200 ${activeTab === tab
                            ? 'border-b-4 border-gray-600 text-gray-700'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className=" pb-16 mx-auto text-center border-gray-300">
                {activeTab === 'Image' && <Image data ={image} />}
                {activeTab === 'Video' && <Video data = {video} />}
                {activeTab === 'Audio' && <Audio data={audio} />}
                {activeTab === 'Saved' && <div>💾 Saved content goes here...</div>}
            </div>
        </>
    )

}

export default TabProfile;