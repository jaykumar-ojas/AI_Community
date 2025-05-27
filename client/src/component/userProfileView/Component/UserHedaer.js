import React, { useState, useEffect, useContext } from "react";
import { useParams } from 'react-router-dom';
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';

import { LoginContext } from "../../ContextProvider/context";

const bio = "A astrologer, Traveler, Enjoy Life huhu.....";

const UserHeader = () => {
    const [backgroundLoaded, setBackgroundLoaded] = useState(false);
    const [profileLoaded, setProfileLoaded] = useState(false);

    const { loginData, setLoginData } = useContext(LoginContext);
    const [profileUser, setProfileUser] = useState();
    const { id } = useParams();

    useEffect(() => {
        fetchUserProfile(id);
    }, [id]);

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
                            onError={() => setProfileLoaded(true)}
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
                            </>
                        ) : (
                            <>
                                <Skeleton height={30} width={150} />
                                <Skeleton count={2} />
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
                                    <div className="text-md font-bold text-gray-900 tracking-wide md:text-2xl sm:text-xl lg:text-3xl">16</div>
                                    <div className="text-base font-small md:font-medium text-gray-600">Posts</div>
                                </div>
                                <div>
                                    <div className="text-md font-bold text-gray-900 tracking-wide  md:text-2xl  sm:text-xl lg:text-3xl">324</div>
                                    <div className="text-base font-small md:font-medium text-gray-600">Followers</div>
                                </div>
                                <div>
                                    <div className="text-md font-bold text-gray-900 tracking-wide  md:text-2xl  sm:text-xl lg:text-3xl">210</div>
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
        </>
    )
}

export default UserHeader;