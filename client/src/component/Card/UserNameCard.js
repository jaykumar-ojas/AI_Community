import React from "react";
import { useEffect } from "react";
import { useState } from "react";

const UserNameCard = ({id}) =>{
    const [userName,setUserName] = useState();

    useEffect(()=>{
        getUserName();
    },[id]);


    const getUserName = async () =>{

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
                setUserName(res?.user?.userName);
            }
        }
        catch(error){
            console.log("imageUrl not generated");
        }
    }

    return (
       <div className="relative">
        {userName}
       </div>
    );
}

export default UserNameCard;

