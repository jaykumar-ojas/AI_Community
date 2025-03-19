import React, { Children, createContext, useEffect, useState } from "react";


export const LoginContext = createContext("");

const Context=({children})=>{
    const [loginData,setLoginData] = useState(null);

    useEffect(() => {
        console.log("i am coming to set userData");
        const storedUser = localStorage.getItem("userData");
        if (storedUser ) {
          setLoginData(JSON.parse(storedUser));
        }
        
      }, []);


      useEffect(() => {
        if (loginData) {
            localStorage.setItem("userData", JSON.stringify(loginData));
        } else {
            localStorage.removeItem("userData");
        }
    }, [loginData]);
      console.log("this is set loginData,",loginData);
    
    return (
        <>
            <LoginContext.Provider value={{loginData,setLoginData}}>
                {children}
            </LoginContext.Provider>
        </>
    )
}

export default Context;













 




  