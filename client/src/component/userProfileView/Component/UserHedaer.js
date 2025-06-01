import React, { useState, useEffect, useContext } from "react";
import { useParams } from 'react-router-dom';
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';
import SubscriptionsList from './SubscriptionsList';

import { LoginContext } from "../../ContextProvider/context";

const UserHeader = () => {
    const [backgroundLoaded, setBackgroundLoaded] = useState(false);
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [subscriptionStats, setSubscriptionStats] = useState({
        subscribersCount: 0,
        subscribedToCount: 0
    });

    const { loginData, setLoginData } = useContext(LoginContext);
    const [profileUser, setProfileUser] = useState();
    const { id } = useParams();

    useEffect(() => {
        console.log("Login data:", loginData); // Debug log
        fetchUserProfile(id);
        if (loginData?.validuserone?._id && id !== loginData?.validuserone?._id) {
            checkSubscriptionStatus(id);
        }
        fetchSubscriptionStats(id);
    }, [id, loginData]);

    const fetchUserProfile = async (userId) => {
        try {
            const response = await fetch(`http://localhost:8099/get-user-profile/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            if (data.status === 200) {
                setProfileUser(data.user);
                setBackgroundLoaded(true);
                setProfileLoaded(true);
            } else {
                console.error("Failed to fetch user profile");
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    };

    const checkSubscriptionStatus = async (userId) => {
        try {
            const token = localStorage.getItem("userdatatoken");
            console.log("Checking subscription with token:", token); // Debug log
            const response = await fetch(`http://localhost:8099/check/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            console.log("Subscription status:", data); // Debug log
            setIsSubscribed(data.isSubscribed);
        } catch (error) {
            console.error("Error checking subscription status:", error);
        }
    };

    const fetchSubscriptionStats = async (userId) => {
        try {
            const token = localStorage.getItem("userdatatoken");
            const response = await fetch(`http://localhost:8099/stats/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            setSubscriptionStats(data);
        } catch (error) {
            console.error("Error fetching subscription stats:", error);
        }
    };

    const handleSubscription = async () => {
        if (!loginData?.validuserone?._id) {
            alert("Please login to subscribe");
            return;
        }

        setIsSubscribing(true);
        
        try {
            const token = localStorage.getItem("userdatatoken");
            const url = isSubscribed 
                ? `http://localhost:8099/unsubscribe/${id}`
                : `http://localhost:8099/subscribe/${id}`;
            
            const method = isSubscribed ? 'DELETE' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                setIsSubscribed(!isSubscribed);
                // Update follower count
                setSubscriptionStats(prev => ({
                    ...prev,
                    subscribersCount: isSubscribed 
                        ? prev.subscribersCount - 1 
                        : prev.subscribersCount + 1
                }));
            } else {
                alert(data.error || "Failed to update subscription");
            }
        } catch (error) {
            console.error("Error updating subscription:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSubscribing(false);
        }
    };

    const isOwnProfile = loginData?.validuserone?._id === id;

    console.log("loginData?.validuserone?._id", loginData?.validuserone?._id);
    console.log("isOwnProfile", isOwnProfile);
    return (
        <>
            <div className="relative h-36 bg-cover bg-center md:h-52" style={{ backgroundImage: `url(${profileUser?.backgroundImageUrl})` }}>
                {/* Background skeleton/spinner */}
                {!backgroundLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
                    </div>
                )}

                {/* Hidden image to detect background load */}
                <img
                    src={profileUser?.backgroundImageUrl}
                    alt=""
                    className="hidden"
                    onLoad={() => setBackgroundLoaded(true)}
                    onError={() => setBackgroundLoaded(true)}
                />

                <div className="absolute bottom-0 transform left-1/2
                          translate-y-1/2
                          sm:left-[8%] sm:translate-x-0 sm:translate-y-2/3
                          lg:translate-y-3/4
                          ">
                    <div className="relative">
                        {/* Profile skeleton/spinner */}
                        {!profileLoaded && (
                            <div className="w-28 h-28 rounded-[30px] border-4 border-white shadow-lg bg-gray-200 animate-pulse transform -translate-x-1/2
                                md:w-36 md:h-36 
                                sm:w-32 sm:h-32 sm:rounded-[30px] sm:translate-x-0
                                lg:w-48 lg:h-48
                                flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
                            </div>
                        )}

                        <div
                            className={`w-28 h-28 rounded-[30px] border-4 border-white shadow-lg bg-cover bg-center transform -translate-x-1/2
                            md:w-36 md:h-36 
                            sm:w-32 sm:h-32 sm:rounded-[30px] sm:translate-x-0
                            lg:w-48 lg:h-48 ${profileLoaded ? 'block' : 'hidden'}`}
                            style={{ backgroundImage: `url(${profileUser?.profilePictureUrl})` }}
                        />

                        {/* Hidden image to detect profile load */}
                        <img
                            src={profileUser?.profilePictureUrl}
                            alt=""
                            className="hidden"
                            onLoad={() => setProfileLoaded(true)}
                            onError={() => setBackgroundLoaded(true)}
                        />
                    </div>
                </div>
            </div>
            <div className="it not needed for flexibilty it is here">
                <div className="relative flex flex-col justify-end
                         md:items-center md:gap-8 md:pt-4 md:gap-0
                         sm:gap-4 sm:justify-end sm:flex sm:pt-1 sm:flex-row
                         lg:gap-0">
                    {/* Left: Name & Bio */}
                    <div className="pt-20 w-full 
                            md:mb-0 md:p-4 md:p-0
                            sm:py-2 sm:px-0  sm:w-1/3
                          ">
                        {profileUser ? (
                            <>
                                <h1 className="text-medium text-center justify-center font-bold text-gray-800 md:text-2xl sm:text-2xl sm:text-start lg:text-3xl">
                                    {profileUser?.userName}
                                </h1>
                                <p className="pt-1 text-center justify-center text-sm text-gray-600 sm:text-md sm:text-start md:text-lg">
                                    {profileUser?.email}
                                </p>
                                
                                {/* Subscription Button */}
                                {!isOwnProfile && loginData?.validuserone && (
                                    <div className="flex justify-center sm:justify-start mt-3">
                                        <button
                                            onClick={handleSubscription}
                                            disabled={isSubscribing}
                                            className={`px-6 py-2 rounded-full font-medium text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                isSubscribed
                                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-lg'
                                            }`}
                                        >
                                            {isSubscribing ? (
                                                <div className="flex items-center space-x-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                                    <span>Loading...</span>
                                                </div>
                                            ) : (
                                                isSubscribed ? 'Unsubscribe' : 'Subscribe'
                                            )}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <Skeleton height={30} width={150} />
                                <Skeleton count={2} />
                                <div className="mt-3">
                                    <Skeleton height={40} width={100} />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right: Stats */}
                    <div className="w-full p-4 pb-0 px-12 md:mb-0 flex flex-row gap-2 text-center justify-between
                            md:mr-8 md:gap-6 md:p-0
                            sm:gap-2 sm:px-1 sm:pr-4 sm:py-3 sm:w-1/3
                            lg:p-12 lg:gap-8"
                    >
                        {profileUser ? (
                            <>
                                <div>
                                    <div className="text-md font-bold text-gray-900 tracking-wide md:text-2xl sm:text-xl lg:text-3xl">0</div>
                                    <div className="text-base font-small md:font-medium text-gray-600">Posts</div>
                                </div>
                                <div>
                                    <div className="text-md font-bold text-gray-900 tracking-wide  md:text-2xl  sm:text-xl lg:text-3xl">
                                        {subscriptionStats.subscribersCount}
                                    </div>
                                    <div className="text-base font-small md:font-medium text-gray-600">Followers</div>
                                </div>
                                <div>
                                    <div className="text-md font-bold text-gray-900 tracking-wide  md:text-2xl  sm:text-xl lg:text-3xl">
                                        {subscriptionStats.subscribedToCount}
                                    </div>
                                    <div className="text-base font-small md:font-medium text-gray-600">Following</div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <Skeleton height={28} width={50} />
                                    <Skeleton height={16} width={60} />
                                </div>
                                <div>
                                    <Skeleton height={28} width={50} />
                                    <Skeleton height={16} width={80} />
                                </div>
                                <div>
                                    <Skeleton height={28} width={50} />
                                    <Skeleton height={16} width={75} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Show subscriptions list only on own profile */}
            {isOwnProfile && (
                <div className="mt-8 border-t border-gray-200">
                    <SubscriptionsList userId={id} />
                </div>
            )}
        </>
    );
};

export default UserHeader;