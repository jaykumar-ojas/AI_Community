import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import UserIconCard from '../../Card/UserIconCard';

const SubscriptionsList = ({ userId }) => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubscriptions();
    }, [userId]);

    const fetchSubscriptions = async () => {
        try {
            const token = localStorage.getItem("userdatatoken");
            const response = await fetch('http://localhost:8099/subscriptions', {
                method: 'GET',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            setSubscriptions(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching subscriptions:", error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4">
                <Skeleton count={5} height={60} />
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Following</h2>
            {subscriptions.length === 0 ? (
                <p className="text-gray-500">Not following anyone yet</p>
            ) : (
                <div className="space-y-4">
                    {subscriptions.map((user) => (
                        <Link 
                            to={`/sample-user/${user._id}`} 
                            key={user._id}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                                < UserIconCard
                                    id = {user._id}
                                />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{user.userName}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SubscriptionsList; 