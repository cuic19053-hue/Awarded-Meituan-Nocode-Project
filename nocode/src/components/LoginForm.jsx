import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Building2, Clock } from 'lucide-react';

const LoginForm = () => {
  const [selectedRole, setSelectedRole] = useState('employee');
  const [userName, setUserName] = useState('');
  const [department, setDepartment] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const { login } = useAuth();

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!userName.trim()) return;

    const userData = {
      id: Date.now(),
      name: userName,
      department: department || '技术部',
      role: selectedRole
    };

    login(userData);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Building2 className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">智能会议室管理系统</h1>
          <p className="text-gray-600 mt-2">请选择您的身份登录</p>
          
          {/* 实时时间显示 */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-lg font-mono text-blue-800">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              姓名
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入您的姓名"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              部门
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入您的部门"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              角色
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="employee"
                  checked={selectedRole === 'employee'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mr-2"
                />
                <Users className="h-4 w-4 mr-2 text-blue-600" />
                员工
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="admin"
                  checked={selectedRole === 'admin'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mr-2"
                />
                <Building2 className="h-4 w-4 mr-2 text-green-600" />
                行政管理员
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
