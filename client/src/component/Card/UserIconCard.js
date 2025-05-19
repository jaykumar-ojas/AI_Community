import React from "react";
import { useEffect } from "react";
import { useState } from "react";

const UserIconCard = ({id}) =>{
    const [imageUrl,setImageUrl] = useState();

    useEffect(()=>{
        getUserImgUrl(id);
    },[id]);


    const getUserImgUrl = async () =>{

        try{
            const data = await fetch(`http://localhost:3000//getUserById/${id}`,{
                method:'GET',
                headers:{
                    'Content-Type': "application/json"
                }
            });

            const res = await data.json();
            if(res.status ===200){
                console.log(res);
                setImageUrl(res?.user?.profilePictureUrl);
            }
        }
        catch(error){
            console.log("imageUrl not generated");
        }
    }

    return (
        <div className="relative w-full h-full rounded-full overflow-hidden border border-gray-300">
            <img
                src={imageUrl}
                alt="userImage"
                className="w-full h-full object-cover"
            />
        </div>
    );
}

export default UserIconCard;

