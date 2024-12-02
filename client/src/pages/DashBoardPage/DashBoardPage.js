import React from "react";
import Navbar from "../../component/Navbar/Navbar";
import Card from "../../component/Card/Card";

const page = () => {
  return (
    <>
      <Navbar></Navbar>
      <div className="grid grid-cols-4 min-h-screen mx-auto w-full">
        {Array.from({ length: 16}, (_, i) => (
          <div key={i} className="flex justify-center">
            <Card />
          </div>
        ))}
      </div>
    </>
  );
};

export default page;
