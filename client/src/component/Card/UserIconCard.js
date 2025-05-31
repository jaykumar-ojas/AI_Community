import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

const UserIconCard = ({id}) =>{
    const [imageUrl,setImageUrl] = useState();
    const navigate = useNavigate();

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
                setImageUrl(res?.user?.profilePictureUrl);
            }
        }
        catch(error){
            console.log("imageUrl not generated");
        }
    }

    return (
        <div onClick={()=>navigate(`/sample-user/${id}`)} className="relative w-full h-full rounded-full overflow-hidden ">
            <img
                src={imageUrl}
                alt="userImage"
                className="w-full h-full object-cover"
            />
        </div>
    );
}

export default UserIconCard;

