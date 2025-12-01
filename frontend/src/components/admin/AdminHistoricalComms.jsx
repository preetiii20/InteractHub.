import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import apiConfig from '../../config/api';

const ADMIN_SERVICE_URL = `${apiConfig.adminService}`;
const CHAT_SERVICE_URL = `${apiConfig.chatService}`;

const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
};

const AdminHistoricalComms = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFullHistory();
    }, []);

    const fetchFullHistory = async () => {
        try {
            // 1. Fetch static Poll/Announcement history (Admin DB)
            const [announcementsRes, pollsRes] = await Promise.all([
                axios.get(`${ADMIN_SERVICE_URL}/announcements`),
                axios.get(`${ADMIN_SERVICE_URL}/polls`)
            ]);

            const announcements = announcementsRes.data.map(item => ({ 
                ...item, type: 'Announcement', date: item.createdAt, entityId: item.id 
            }));
            const polls = pollsRes.data.map(item => ({ 
                ...item, type: 'Poll', date: item.createdAt, entityId: item.id 
            }));

            // 2. Fetch interaction history (comments/votes) from Chat Service DB
            // NOTE: This endpoint needs to be created in ChatRestController.java
            const interactionsRes = await axios.get(`${CHAT_SERVICE_URL}/interactions/history/all`);
            const interactions = interactionsRes.data.map(item => ({
                ...item, type: 'Interaction', date: item.createdAt, entityId: item.entityId
            }));

            // Combine, sort by date, and flatten the history
            const fullHistory = [...announcements, ...polls, ...interactions].sort((a, b) => new Date(b.date) - new Date(a.date));

            setHistory(fullHistory);

        } catch (error) {
            console.error("Failed to fetch full history:", error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        if (type === 'Announcement') return '📢';
        if (type === 'Poll') return '📊';
        if (type === 'Interaction') return '💬';
        return '📑';
    };

    if (loading) return <div className="text-center py-10">Loading Full Communication History...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 border-b pb-4">Communication History & Audit</h1>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4">All System Communication Events</h2>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                    {history.map((item, index) => (
                        <motion.div 
                            key={index} 
                            variants={itemVariants} 
                            className={`p-3 rounded-lg flex justify-between items-center ${item.type === 'Interaction' ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'bg-gray-50 border-l-4 border-indigo-400'}`}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-lg">{getIcon(item.type)}</span>
                                <div>
                                    <p className="font-medium text-gray-800">
                                        {item.type === 'Interaction' ? `New Comment on ${item.entityType} #${item.entityId}` : item.title || item.question}
                                    </p>
                                    <p className="text-sm text-gray-600 truncate max-w-lg">
                                        {item.content || item.question || `From User ID: ${item.senderId}`}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500">
                                {new Date(item.date).toLocaleDateString()}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default AdminHistoricalComms;