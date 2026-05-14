import React, { useState, useEffect } from 'react';
import { dbService } from '../services/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, Users, Zap, TrendingUp } from 'lucide-react';
import YearSelector from './YearSelector';

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [energyLogs, setEnergyLogs] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({
    totalBookings: 0,
    approvedBookings: 0,
    totalEnergyUsed: 0,
    averageUsageRate: 0
  });

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = () => {
    const allRooms = dbService.getRooms();
    const allBookings = dbService.getBookingsByYear(selectedYear);
    const allEnergyLogs = dbService.getEnergyLogsByYear(selectedYear);

    setRooms(allRooms);
    setBookings(allBookings);
    setEnergyLogs(allEnergyLogs);

    // 计算统计数据
    const totalBookings = allBookings.length;
    const approvedBookings = allBookings.filter(b => b.status === '已批准').length;
    const totalEnergyUsed = allEnergyLogs.reduce((sum, log) => sum + log.total_energy_used, 0);
    
    // 计算使用率
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = allBookings.filter(b => 
      b.status === '已批准' && 
      b.start_time.startsWith(today)
    ).length;
    const averageUsageRate = allRooms.length > 0 ? (todayBookings / allRooms.length) * 100 : 0;

    setStats({
      totalBookings,
      approvedBookings,
      totalEnergyUsed,
      averageUsageRate
    });
  };

  const getWeeklyEnergyData = () => {
    const weeklyData = {};
    const today = new Date();
    today.setFullYear(selectedYear);
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      weeklyData[dateStr] = { date: dateStr, energy: 0 };
    }

    energyLogs.forEach(log => {
      if (weeklyData[log.date]) {
        weeklyData[log.date].energy += log.total_energy_used;
      }
    });

    return Object.values(weeklyData);
  };

  const getRoomEnergyData = () => {
    const roomEnergy = {};
    
    energyLogs.forEach(log => {
      const room = dbService.getRoomById(log.room_id);
      if (room) {
        if (!roomEnergy[room.room_name]) {
          roomEnergy[room.room_name] = 0;
        }
        roomEnergy[room.room_name] += log.total_energy_used;
      }
    });

    return Object.entries(roomEnergy).map(([roomName, energy]) => ({
      roomName,
      energy
    }));
  };

  const getOptimizationSuggestions = () => {
    const suggestions = [];
    const roomUsage = {};
    
    // 计算每个会议室的使用率
    rooms.forEach(room => {
      const roomBookings = bookings.filter(b => b.room_id === room.room_id);
      const usageRate = roomBookings.length / 30; // 假设一个月30天
      roomUsage[room.room_name] = usageRate;
      
      if (usageRate < 0.2) {
        suggestions.push(`检测到"${room.room_name}"使用率低于20%，建议将此时间段设为免预约，或鼓励小型团队使用。`);
      }
    });

    // 检查会议室容量利用率
    const smallRoomBookings = bookings.filter(b => {
      const room = dbService.getRoomById(b.room_id);
      return room && b.attendees_count < room.capacity * 0.3;
    });

    if (smallRoomBookings.length > 10) {
      suggestions.push(`过去一段时间，有${smallRoomBookings.length}场会议参会人数不足会议室容量的30%，导致能源浪费。建议推广使用中小型会议室。`);
    }

    return suggestions;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 年份选择器 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">数据看板</h2>
        <YearSelector onYearChange={setSelectedYear} />
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">总预订数</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">已批准预订</p>
              <p className="text-2xl font-bold text-gray-800">{stats.approvedBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">总耗电量</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalEnergyUsed.toFixed(1)} 度</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">平均使用率</p>
              <p className="text-2xl font-bold text-gray-800">{stats.averageUsageRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">本周能耗趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getWeeklyEnergyData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="energy" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">各会议室能耗对比</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getRoomEnergyData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="roomName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="energy" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 优化建议 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">优化建议</h3>
        <div className="space-y-3">
          {getOptimizationSuggestions().map((suggestion, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <p className="text-gray-700">{suggestion}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
