import React, { Children, createContext, useEffect, useState } from "react";

export const ForumContext = createContext("");

const Context=({children})=> {
    const [model,setModel]= useState("");
    const [viewBox,setViewBox] = useState(false);
    const [replyIdForContext,setReplyIdForContext]= useState(null);
    const [userName,setUserName] = useState(null);
    const [modelType, setModelType] = useState('text');
    const [provider,setProvider]= useState("");

    return (   
        <ForumContext.Provider value={{model,setModel,viewBox,setViewBox,replyIdForContext,setReplyIdForContext,userName,setUserName,modelType,setModelType,provider,setProvider}}>
            {children}
        </ForumContext.Provider>
    )
}

export default Context;