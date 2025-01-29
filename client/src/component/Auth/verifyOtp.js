import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";


const EmailVerification = () => {
  const history = useNavigate();
  const {id} = useParams();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [timer, setTimer] = useState(120);

  const otpPageValid = async () => {
    console.log("second i am");
    const data = await fetch("http://localhost:8099/isvalid", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: id,
      }
    });

    const res=await data.json();
    if(res.status===401){
        history('/*')
    }
  }

  // Handle OTP input changes
  const handleChange = (value, index) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to the next input if a number is entered
    if (value && index < otp.length - 1) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // Handle backspace key
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  // Handle form submission
  const handleSubmit = async(e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    console.log("Entered OTP:", enteredOtp);
    const data = await fetch("http://localhost:8099/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: id,
        },
        body:JSON.stringify({
            enteredOtp
        })
      });
      const res = await data.json();
      console.log(res);
      if(res.status===200){
        console.log(res);
        history(`/update-password/${res.token}`);
      }
      else if(res.status===401){
        alert("otp is mismatched");
      }
      else{
        alert("session expired");
      }
  };

  // Handle resend OTP
  const handleResend = () => {
    console.log("Resend OTP clicked");
    setIsResendDisabled(true); // Disable resend button
    setTimer(120); // Reset timer to 2 minutes
    // Add your resend OTP logic here (e.g., API call to resend OTP)
  };

  useEffect(()=>{
    otpPageValid();
  },[]);

  // Timer countdown logic

  useEffect(() => {
    // dashboardValid();
    let interval;
    if (isResendDisabled && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [isResendDisabled, timer]);

  // Format the timer as MM:SS
  const formatTimer = (time) => {
    const minutes = Math.floor(time / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50 py-12">
      <div className="relative bg-white px-6 pt-10 pb-9 shadow-xl mx-auto w-full max-w-lg rounded-2xl">
        <div className="mx-auto flex w-full max-w-md flex-col space-y-16">
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="font-semibold text-3xl">
              <p>Email Verification</p>
            </div>
            <div className="flex flex-row text-sm font-medium text-gray-400">
              <p>We have sent a code to your email ba**@dipainhouse.com</p>
            </div>
          </div>

          <div>
            <form onSubmit={(e) => e.preventDefault()} method="post">
              <div className="flex flex-col space-y-16">
                <div className="flex flex-row items-center justify-between mx-auto w-full max-w-xs">
                  {otp.map((digit, index) => (
                    <div key={index} className="w-16 h-16">
                      <input
                        className="w-full h-full flex flex-col items-center justify-center text-center px-5 outline-none rounded-xl border border-gray-200 text-lg bg-white focus:bg-gray-50 focus:ring-1 ring-blue-700"
                        type="text"
                        value={digit}
                        maxLength={1}
                        onChange={(e) => handleChange(e.target.value, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        id={`otp-${index}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col space-y-5">
                  <div>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="flex flex-row items-center justify-center text-center w-full border rounded-xl outline-none py-5 bg-blue-700 border-none text-white text-sm shadow-sm"
                    >
                      Verify Account
                    </button>
                  </div>

                  <div className="flex flex-row items-center justify-center text-center text-sm font-medium space-x-1 text-gray-500">
                    <p>Didn't receive code?</p>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResendDisabled}
                      className={`flex flex-row items-center ${
                        isResendDisabled ? "text-gray-400" : "text-blue-600"
                      }`}
                    >
                      {isResendDisabled ? `Resend in ${formatTimer(timer)}` : "Resend"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
