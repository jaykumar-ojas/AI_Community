import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import UserIconCard from '../../Card/UserIconCard';
import {encodeId} from '../../../utils/hashids'

const SubscriptionsList = ({ userId }) => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const baseUrl = process.env.REACT_APP_BASE_URL;


    useEffect(() => {
        fetchSubscriptions();
    }, [userId]);

    const fetchSubscriptions = async () => {
        try {
            const token = localStorage.getItem("userdatatoken");
            const response = await fetch(`${baseUrl}/subscriptions`, {
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
        <div className="p-2 bg-gray-800 rounded-lg border border-gray-600 max-h-48 overflow-y-auto">
            <h3 className="text-sm font-semibold mb-2 text-white text-center">Following</h3>
            {subscriptions.length === 0 ? (
                <p className="text-gray-300 text-xs text-center">Not following anyone yet</p>
            ) : (
                <div className="space-y-2">
                    {subscriptions.map((user) => (
                        <Link 
                            to={`/sample-user/${encodeId(user._id)}`} 
                            key={user._id}
                            className="flex items-center space-x-2 p-1 hover:bg-gray-700 text-white rounded transition-colors"
                        >
                            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                                < UserIconCard
                                    id = {user._id}
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-xs truncate">{user.userName}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SubscriptionsList; 