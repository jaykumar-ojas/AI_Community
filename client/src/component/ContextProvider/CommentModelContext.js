import React, { Children, createContext, useEffect, useState } from "react";

export const CommentContext = createContext({});

const Context=({children})=>{
    const [model,setModel]= useState("");
    const [viewBox,setViewBox] = useState(false);
    const [replyIdForContext,setReplyIdForContext]= useState(null);
    const [userName,setUserName] = useState(null);
    const [modelType, setModelType] = useState('text');

    return (
        <CommentContext.Provider value={{model,setModel,viewBox,setViewBox,replyIdForContext,setReplyIdForContext,userName,setUserName,modelType,setModelType}}>
            {children}
        </CommentContext.Provider>
    )
}

export default Context;