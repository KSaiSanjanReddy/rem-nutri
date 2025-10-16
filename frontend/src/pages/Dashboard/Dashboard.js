// Dashboard.js

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
// Note: These actions would need to be implemented in your Redux store
// import {
//   fetchDashboardStats,
//   fetchRecentChats,
//   fetchAvailableDoctors,
// } from "../../redux/actions/dashboardActions";
// import { fetchNotifications } from "../../redux/actions/notificationActions";
// import { getProfile } from "../../redux/actions/authActions";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import { formatDistanceToNow } from "date-fns";
import {
  FiUser,
  FiMessageSquare,
  FiRefreshCw,
  FiActivity,
  FiArrowRight,
  FiPhoneCall,
  FiVideo,
  FiCalendar,
} from "react-icons/fi";
// Note: These UI components would need to be implemented
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);

  // Mock data for now - replace with actual Redux selectors when implemented
  const stats = { totalUsers: 0, activeChats: 0, totalDoctors: 0 };
  const recentChats = [];
  const availableDoctors = [];
  const dashboardLoading = false;
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading || dashboardLoading) {
    return <LoadingSpinner size="large" />;
  }


  // --------------------
  // Render Recent Chats (changed fullName -> full_name)
  // --------------------
  const renderRecentChats = recentChats?.map((chat, index) => {
    const otherParticipant =
      chat.participants?.find((p) => p._id !== user?._id) || {};

    return (
      <motion.div
        key={index}
        className="border rounded-lg p-3 shadow-sm bg-white hover:shadow-md transition-all"
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-800">
              {otherParticipant?.full_name || "Unknown"}
            </h4>
            <p className="text-sm text-gray-500">{chat.lastMessage}</p>
          </div>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center">
            <FiMessageSquare className="mr-1" /> Chat
          </button>
        </div>
      </motion.div>
    );
  });

  // --------------------
  // Stats Cards (changed fullName -> full_name)
  // --------------------
  const statsCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      icon: <FiUser className="text-blue-600 text-2xl" />,
    },
    {
      label: "Active Chats",
      value: stats?.activeChats || 0,
      icon: <FiMessageSquare className="text-green-600 text-2xl" />,
    },
    {
      label: "Total Doctors",
      value: stats?.totalDoctors || 0,
      icon: <FiActivity className="text-red-600 text-2xl" />,
    },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
            <FiRefreshCw className="mr-1" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statsCards.map((card, idx) => (
          <div
            key={idx}
            className="shadow-md border-t-4 border-blue-500 bg-white rounded-lg"
          >
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-gray-500 text-sm">{card.label}</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {card.value}
                </h3>
              </div>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Welcome User (changed fullName -> full_name) */}
      <div className="mb-8">
        <div className="shadow-md bg-gradient-to-r from-blue-50 to-white border-blue-100 rounded-lg">
          <div className="flex justify-between items-center p-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                Welcome back, {user?.full_name || "User"} 👋
              </h3>
              <p className="text-gray-500">
                Here's an overview of your activity today.
              </p>
            </div>
            <div className="w-32 h-32 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUser className="w-16 h-16 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Chats and Doctors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Recent Chats
          </h3>
          <div className="space-y-4">{renderRecentChats}</div>
        </div>

        {/* Available Doctors (changed fullName -> full_name, consultationFee -> consultation_fee) */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Available Doctors
          </h3>
          <div className="space-y-4">
            {availableDoctors?.map((doctor, index) => (
              <motion.div
                key={index}
                className="border rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-all"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {doctor.full_name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {doctor.specialization}
                    </p>
                    <p className="text-xs text-gray-400">
                      ₹{doctor.consultation_fee}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center">
                      <FiPhoneCall className="mr-1" /> Call
                    </button>
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center">
                      <FiVideo className="mr-1" /> Video
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
            <FiMessageSquare className="mr-2" /> Start New Chat
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
            <FiCalendar className="mr-2" /> Schedule Appointment
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
            <FiArrowRight className="mr-2" /> View Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
