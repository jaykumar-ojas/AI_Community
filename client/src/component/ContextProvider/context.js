import React, { Children, createContext, useState } from "react";


export const LoginContext = createContext("");

const Context=({children})=>{
    const [loginData,setLoginData] = useState(null);
    return (
        <>
            <LoginContext.Provider value={{loginData,setLoginData}}>
                {children}
            </LoginContext.Provider>
        </>
    )
}

export default Context;