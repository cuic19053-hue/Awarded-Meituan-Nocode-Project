import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Building2, TrendingUp, Clock } from 'lucide-react';

const Navbar = ({ currentPage, onPageChange }) => {
  const { user, logout, isAdmin } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const formatTime = (date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const employeeMenuItems = [
    { id: 'booking', label: '预订会议室', icon: <Building2 className="h-4 w-4" /> },
    { id: 'my-bookings', label: '我的预订', icon: <User className="h-4 w-4" /> }
  ];

  const adminMenuItems = [
    { id: 'approval', label: '预订审批', icon: <Building2 className="h-4 w-4" /> },
    { id: 'room-management', label: '会议室管理', icon: <Building2 className="h-4 w-4" /> },
    { id: 'dashboard', label: '数据看板', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'analytics', label: '数据分析', icon: <TrendingUp className="h-4 w-4" /> }
  ];

  const menuItems = isAdmin ? adminMenuItems : employeeMenuItems;

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-xl font-bold text-gray-800">智能会议室管理系统</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* 实时时间显示 */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-lg">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-mono text-gray-700">
                {formatTime(currentTime)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-600" />
              <span className="text-gray-700">{user?.name}</span>
              <span className="text-sm text-gray-500">({user?.department})</span>
              {isAdmin && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  管理员
                </span>
              )}
            </div>

            <div className="flex space-x-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>退出</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
