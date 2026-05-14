import React, { useState, useEffect } from 'react';
import { dbService } from '../services/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Users, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import YearSelector from './YearSelector';

const Analytics = () => {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [energyLogs, setEnergyLogs] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
  };

  const getMonthlyEnergyTrend = () => {
    const monthlyData = {};
    const today = new Date();
    today.setFullYear(selectedYear);
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().slice(0, 7);
      monthlyData[monthStr] = { month: monthStr, energy: 0 };
    }

    energyLogs.forEach(log => {
      const month = log.date.slice(0, 7);
      if (monthlyData[month]) {
        monthlyData[month].energy += log.total_energy_used;
      }
    });

    return Object.values(monthlyData);
  };

  const getRoomUsageData = () => {
    const roomUsage = {};
    
    rooms.forEach(room => {
      const roomBookings = bookings.filter(b => b.room_id === room.room_id);
      const totalHours = roomBookings.reduce((sum, booking) => {
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);
        return sum + (end - start) / (1000 * 60 * 60);
      }, 0);
      
      roomUsage[room.room_name] = {
        name: room.room_name,
        bookings: roomBookings.length,
        hours: totalHours,
        capacity: room.capacity
      };
    });

    return Object.values(roomUsage);
  };

  const getBookingStatusData = () => {
    const statusCount = {
      '待审批': 0,
      '已批准': 0,
      '已拒绝': 0,
      '已完成': 0
    };

    bookings.forEach(booking => {
      statusCount[booking.status]++;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      status,
      count
    }));
  };

  const getEfficiencyMetrics = () => {
    const totalBookings = bookings.length;
    const approvedBookings = bookings.filter(b => b.status === '已批准').length;
    const completedBookings = bookings.filter(b => b.status === '已完成').length;
    
    const totalEnergy = energyLogs.reduce((sum, log) => sum + log.total_energy_used, 0);
    const totalHours = energyLogs.reduce((sum, log) => sum + log.total_meeting_hours, 0);
    
    const avgEnergyPerHour = totalHours > 0 ? totalEnergy / totalHours : 0;
    const approvalRate = totalBookings > 0 ? (approvedBookings / totalBookings) * 100 : 0;
    const completionRate = approvedBookings > 0 ? (completedBookings / approvedBookings) * 100 : 0;

    return {
      avgEnergyPerHour,
      approvalRate,
      completionRate
    };
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const metrics = getEfficiencyMetrics();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 年份选择器 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">数据分析</h2>
        <YearSelector onYearChange={setSelectedYear} />
      </div>

      {/* 效率指标 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">平均每小时耗电</p>
              <p className="text-2xl font-bold text-gray-800">{metrics.avgEnergyPerHour.toFixed(1)} 度</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">审批通过率</p>
              <p className="text-2xl font-bold text-gray-800">{metrics.approvalRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">完成率</p>
              <p className="text-2xl font-bold text-gray-800">{metrics.completionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">月度能耗趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getMonthlyEnergyTrend()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="energy" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">预订状态分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getBookingStatusData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {getBookingStatusData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 会议室使用情况 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">会议室使用情况</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={getRoomUsageData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="bookings" fill="#3B82F6" name="预订次数" />
            <Bar dataKey="hours" fill="#10B981" name="使用时长(小时)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 详细分析 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">详细分析报告</h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">能耗分析</h4>
            <p className="text-blue-700">
              {selectedYear}年总耗电量为 {energyLogs.reduce((sum, log) => sum + log.total_energy_used, 0).toFixed(1)} 度，
              平均每小时耗电 {metrics.avgEnergyPerHour.toFixed(1)} 度。
              建议在非高峰时段使用节能模式，可节省约15%的能耗。
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">使用效率分析</h4>
            <p className="text-green-700">
              审批通过率为 {metrics.approvalRate.toFixed(1)}%，完成率为 {metrics.completionRate.toFixed(1)}%。
              建议优化审批流程，提高会议室使用效率。
            </p>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">优化建议</h4>
            <ul className="text-yellow-700 space-y-1">
              <li>• 建议在低使用率时段提供会议室折扣，提高利用率</li>
              <li>• 推广中小型会议室的使用，减少能源浪费</li>
              <li>• 实施智能预约系统，自动匹配最适合的会议室</li>
              <li>• 定期维护设备，确保能耗效率最优</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
