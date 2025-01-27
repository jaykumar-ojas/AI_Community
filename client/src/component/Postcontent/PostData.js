import React, { useContext, useState } from "react";
import { LoginContext } from "../ContextProvider/context"

const PostData = () => {
  const { loginData } = useContext(LoginContext);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [desc,setDesc]=useState("");
  
  const setChange = (e) => {
    setDesc(e.target.value);
  };


  const handleSubmit =async(e)=>{
    console.log(loginData);
    if(!loginData){
      alert("user not login");
    }
    else if(desc==="" && !file){
      alert("desc is required");
    }
    else{
      const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", loginData.validuserone._id);
        formData.append("desc", desc);
      const data =await fetch('http://localhost:8099/upload',{
        method:'POST',
        body:formData
      });
      const res =await data.json();
      console.log(res)
      if(res){
        console.log(res);
        setFile(null);
        setDesc("");
        setPreviewUrl(null);
      }
      else{
        console.log("data not submitted");
      }

    }
  }

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      const preview = URL.createObjectURL(uploadedFile);
      setPreviewUrl(preview);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(null);
    URL.revokeObjectURL(previewUrl); // Clean up the object URL
  };


  return (
    <div className="bg-whtie-700 border border-black min-h-screen max-w-screen p-4 m-4">
      <div className="flex flex-row justify-between gap-4 w-full">
        <div className="w-1/2 border-red-700">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-64 border border-white shadow-md rounded-lg cursor-pointer bg-white dark:hover:bg-white dark:bg-white hover:bg-white dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
            >
              {previewUrl ? (
                <div className="flex flex-col items-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-48 w-auto mb-4 object-contain rounded-lg"
                  />
                  <button
                    onClick={handleRemoveFile}
                    className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 16"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    SVG, PNG, JPG or GIF (MAX. 800x400px)
                  </p>
                </div>
              )}
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
              />
            </label>
          </div>
        </div>
        <div className="w-1/2 shadow-md flex flex-col p-2">
            <div className="w-full m-2 p-2 font-bold">
                Description
            </div>
            <div className="border border-bubblegum w-full h-full rounded-lg bg-pink-50">
                <textarea onChange={setChange}
                className="w-full h-full p-2 text-base border-0 bg-pink-50 text-left align-top outline-none focus:outline" 
                placeholder="speak to people" 
                />
            </div>
            <button onClick={handleSubmit} className="w-full border border-blue-700 mt-2 mx-auto bg-blue-700 h-16">Submit</button>
        </div>

      </div>
      <div>lower container</div>
    </div>
  );
};

export default PostData;
