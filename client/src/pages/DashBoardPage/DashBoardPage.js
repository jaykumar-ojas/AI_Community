import React from "react";
import Navbar from "../../component/Navbar/Navbar";
import Card from "../../component/Card/Card";

const page = () => {
  return (
    <>
      <Navbar></Navbar>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 15 }, (_, i) => (
          <div key={i}>
            <Card />
          </div>
        ))}
      </div>
    </>
  );
};

export default page;
