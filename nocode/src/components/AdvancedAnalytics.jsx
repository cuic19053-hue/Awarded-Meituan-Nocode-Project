import React, { useState, useEffect } from 'react';
import { dbService } from '../services/database';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart 
} from 'recharts';
import { 
  Calendar, Users, Zap, TrendingUp, AlertTriangle, Target, 
  DollarSign, Clock, MapPin, Activity 
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import YearSelector from './YearSelector';

const AdvancedAnalytics = () => {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [energyLogs, setEnergyLogs] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth]);

  const loadData = () => {
    const allRooms = dbService.getRooms();
    const allBookings = dbService.getBookingsByYear(selectedYear);
    const allEnergyLogs = dbService.getEnergyLogsByYear(selectedYear);

    setRooms(allRooms);
    setBookings(allBookings);
    setEnergyLogs(allEnergyLogs);

    generateAnalytics(allRooms, allBookings, allEnergyLogs);
  };

  const generateAnalytics = (rooms, bookings, energyLogs) => {
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth));
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth));
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // 基础统计
    const totalBookings = bookings.length;
    const approvedBookings = bookings.filter(b => b.status === '已批准').length;
    const completedBookings = bookings.filter(b => b.status === '已完成').length;
    const totalEnergy = energyLogs.reduce((sum, log) => sum + log.total_energy_used, 0);
    const totalCost = totalEnergy * 0.8; // 假设每度电0.8元

    // 会议室使用率分析
    const roomUsage = rooms.map(room => {
      const roomBookings = bookings.filter(b => b.room_id === room.room_id);
      const totalHours = roomBookings.reduce((sum, booking) => {
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);
        return sum + (end - start) / (1000 * 60 * 60);
      }, 0);
      
      const usageRate = (totalHours / (30 * 8)) * 100; // 假设每天8小时可用
      const energyUsed = energyLogs
        .filter(log => log.room_id === room.room_id)
        .reduce((sum, log) => sum + log.total_energy_used, 0);

      return {
        roomId: room.room_id,
        roomName: room.room_name,
        bookings: roomBookings.length,
        hours: totalHours,
        usageRate: Math.min(usageRate, 100),
        energyUsed,
        cost: energyUsed * 0.8
      };
    });

    // 时间分布分析
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const hourBookings = bookings.filter(booking => {
        const startHour = new Date(booking.start_time).getHours();
        return startHour === hour;
      });
      return {
        hour: `${hour}:00`,
        bookings: hourBookings.length,
        energy: energyLogs
          .filter(log => {
            const logHour = new Date(log.date).getHours();
            return logHour === hour;
          })
          .reduce((sum, log) => sum + log.total_energy_used, 0)
      };
    });

    // 部门使用分析
    const departmentUsage = {};
    bookings.forEach(booking => {
      if (!departmentUsage[booking.department]) {
        departmentUsage[booking.department] = {
          bookings: 0,
          hours: 0,
          energy: 0
        };
      }
      departmentUsage[booking.department].bookings++;
      
      const start = new Date(booking.start_time);
      const end = new Date(booking.end_time);
      const hours = (end - start) / (1000 * 60 * 60);
      departmentUsage[booking.department].hours += hours;
    });

    energyLogs.forEach(log => {
      const booking = bookings.find(b => 
        b.room_id === log.room_id && 
        b.start_time.startsWith(log.date)
      );
      if (booking && departmentUsage[booking.department]) {
        departmentUsage[booking.department].energy += log.total_energy_used;
      }
    });

    // 预测分析
    const avgDailyBookings = totalBookings / 30;
    const projectedMonthlyBookings = avgDailyBookings * 30;
    const projectedEnergy = totalEnergy * 1.1; // 假设增长10%
    const projectedCost = projectedEnergy * 0.8;

    // 效率指标
    const approvalRate = totalBookings > 0 ? (approvedBookings / totalBookings) * 100 : 0;
    const completionRate = approvedBookings > 0 ? (completedBookings / approvedBookings) * 100 : 0;
    const avgEnergyPerBooking = totalBookings > 0 ? totalEnergy / totalBookings : 0;
    const costPerBooking = totalBookings > 0 ? totalCost / totalBookings : 0;

    setAnalytics({
      totalBookings,
      approvedBookings,
      completedBookings,
      totalEnergy,
      totalCost,
      roomUsage,
      hourlyDistribution,
      departmentUsage: Object.entries(departmentUsage).map(([dept, data]) => ({
        department: dept,
        ...data
      })),
      projectedMonthlyBookings,
      projectedEnergy,
      projectedCost,
      approvalRate,
      completionRate,
      avgEnergyPerBooking,
      costPerBooking
    });
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const getOptimizationRecommendations = () => {
    const recommendations = [];
    
    // 分析低使用率会议室
    const lowUsageRooms = analytics.roomUsage?.filter(room => room.usageRate < 30) || [];
    if (lowUsageRooms.length > 0) {
      recommendations.push({
        type: 'warning',
        title: '低使用率会议室',
        description: `${lowUsageRooms.length}个会议室使用率低于30%，建议优化资源配置`,
        rooms: lowUsageRooms.map(r => r.roomName)
      });
    }

    // 分析高峰时段
    const peakHours = analytics.hourlyDistribution?.filter(h => h.bookings > 5) || [];
    if (peakHours.length > 0) {
      recommendations.push({
        type: 'info',
        title: '使用高峰时段',
        description: `建议在${peakHours.map(h => h.hour).join('、')}等高峰时段增加会议室资源`,
        hours: peakHours.map(h => h.hour)
      });
    }

    // 分析能耗异常
    const highEnergyRooms = analytics.roomUsage?.filter(room => room.energyUsed > 50) || [];
    if (highEnergyRooms.length > 0) {
      recommendations.push({
        type: 'error',
        title: '高能耗会议室',
        description: `${highEnergyRooms.length}个会议室能耗异常，建议检查设备效率`,
        rooms: highEnergyRooms.map(r => r.roomName)
      });
    }

    return recommendations;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 头部控制 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">高级数据分析</h2>
        <div className="flex space-x-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {format(new Date(2024, i), 'MMMM', { locale: zhCN })}
              </option>
            ))}
          </select>
          <YearSelector onYearChange={setSelectedYear} />
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">总预订数</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.totalBookings || 0}</p>
              <p className="text-xs text-green-600">
                预计本月: {analytics.projectedMonthlyBookings?.toFixed(0) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">审批通过率</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.approvalRate?.toFixed(1) || 0}%</p>
              <p className="text-xs text-blue-600">
                完成率: {analytics.completionRate?.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">总能耗</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.totalEnergy?.toFixed(1) || 0} 度</p>
              <p className="text-xs text-orange-600">
                预计本月: {analytics.projectedEnergy?.toFixed(1) || 0} 度
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">总成本</p>
              <p className="text-2xl font-bold text-gray-800">¥{analytics.totalCost?.toFixed(2) || 0}</p>
              <p className="text-xs text-red-600">
                预计本月: ¥{analytics.projectedCost?.toFixed(2) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">每小时使用分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={analytics.hourlyDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="bookings" fill="#3B82F6" name="预订数" />
              <Line yAxisId="right" type="monotone" dataKey="energy" stroke="#10B981" strokeWidth={2} name="能耗" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">部门使用分析</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.departmentUsage}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ department, bookings }) => `${department}: ${bookings}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="bookings"
              >
                {analytics.departmentUsage?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 会议室使用详情 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">会议室使用详情</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">会议室</th>
                <th className="text-left py-2">预订次数</th>
                <th className="text-left py-2">使用时长</th>
                <th className="text-left py-2">使用率</th>
                <th className="text-left py-2">能耗</th>
                <th className="text-left py-2">成本</th>
              </tr>
            </thead>
            <tbody>
              {analytics.roomUsage?.map(room => (
                <tr key={room.roomId} className="border-b">
                  <td className="py-2 font-medium">{room.roomName}</td>
                  <td className="py-2">{room.bookings}</td>
                  <td className="py-2">{room.hours.toFixed(1)}小时</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      room.usageRate > 70 ? 'bg-green-100 text-green-800' :
                      room.usageRate > 40 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {room.usageRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2">{room.energyUsed.toFixed(1)}度</td>
                  <td className="py-2">¥{room.cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 优化建议 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">智能优化建议</h3>
        <div className="space-y-4">
          {getOptimizationRecommendations().map((rec, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${
              rec.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
              rec.type === 'error' ? 'bg-red-50 border-red-400' :
              'bg-blue-50 border-blue-400'
            }`}>
              <div className="flex items-start">
                <AlertTriangle className={`h-5 w-5 mr-3 mt-0.5 ${
                  rec.type === 'warning' ? 'text-yellow-600' :
                  rec.type === 'error' ? 'text-red-600' :
                  'text-blue-600'
                }`} />
                <div>
                  <h4 className="font-medium text-gray-800">{rec.title}</h4>
                  <p className="text-gray-700 mt-1">{rec.description}</p>
                  {rec.rooms && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-600">涉及会议室: </span>
                      <span className="text-sm font-medium">{rec.rooms.join(', ')}</span>
                    </div>
                  )}
                  {rec.hours && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-600">高峰时段: </span>
                      <span className="text-sm font-medium">{rec.hours.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
