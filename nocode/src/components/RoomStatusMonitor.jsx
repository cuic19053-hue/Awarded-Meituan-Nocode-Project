import React, { useState, useEffect } from 'react';
import { dbService } from '../services/database';
import { 
  Monitor, Wifi, Thermometer, Zap, Users, Clock, 
  CheckCircle, AlertTriangle, XCircle, Activity 
} from 'lucide-react';

const RoomStatusMonitor = () => {
  const [rooms, setRooms] = useState([]);
  const [currentBookings, setCurrentBookings] = useState([]);
  const [roomStatus, setRoomStatus] = useState({});

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 每30秒更新一次
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    const allRooms = dbService.getRooms();
    const allBookings = dbService.getBookings();
    const now = new Date();

    setRooms(allRooms);

    // 获取当前正在进行的预订
    const activeBookings = allBookings.filter(booking => {
      const startTime = new Date(booking.start_time);
      const endTime = new Date(booking.end_time);
      return booking.status === '已批准' && now >= startTime && now <= endTime;
    });

    setCurrentBookings(activeBookings);

    // 生成模拟的实时状态数据
    const status = {};
    allRooms.forEach(room => {
      const activeBooking = activeBookings.find(b => b.room_id === room.room_id);
      
      status[room.room_id] = {
        isOccupied: !!activeBooking,
        currentBooking: activeBooking,
        temperature: 20 + Math.random() * 8, // 20-28°C
        humidity: 40 + Math.random() * 20, // 40-60%
        airQuality: Math.floor(Math.random() * 5) + 1, // 1-5级
        energyUsage: activeBooking ? room.energy_consumption * (0.5 + Math.random() * 0.5) : 0,
        wifiStrength: Math.floor(Math.random() * 4) + 1, // 1-4格
        equipmentStatus: {
          projector: Math.random() > 0.1, // 90%正常
          airConditioner: Math.random() > 0.05, // 95%正常
          lights: Math.random() > 0.02, // 98%正常
          audio: Math.random() > 0.08 // 92%正常
        }
      };
    });

    setRoomStatus(status);
  };

  const getStatusColor = (status) => {
    if (status === 'occupied') return 'bg-red-100 text-red-800';
    if (status === 'available') return 'bg-green-100 text-green-800';
    if (status === 'maintenance') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'occupied':
        return <Users className="h-4 w-4" />;
      case 'available':
        return <CheckCircle className="h-4 w-4" />;
      case 'maintenance':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getAirQualityColor = (level) => {
    switch (level) {
      case 1: return 'text-red-600';
      case 2: return 'text-orange-600';
      case 3: return 'text-yellow-600';
      case 4: return 'text-blue-600';
      case 5: return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getAirQualityText = (level) => {
    switch (level) {
      case 1: return '很差';
      case 2: return '较差';
      case 3: return '一般';
      case 4: return '良好';
      case 5: return '优秀';
      default: return '未知';
    }
  };

  const getWifiIcon = (strength) => {
    const bars = [];
    for (let i = 1; i <= 4; i++) {
      bars.push(
        <div
          key={i}
          className={`w-1 h-${i + 2} rounded-sm ${
            i <= strength ? 'bg-green-500' : 'bg-gray-300'
          }`}
        />
      );
    }
    return <div className="flex space-x-1 items-end">{bars}</div>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">会议室状态监控</h2>
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-green-600" />
          <span className="text-sm text-gray-600">实时更新中</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map(room => {
          const status = roomStatus[room.room_id] || {};
          const statusType = status.isOccupied ? 'occupied' : 'available';
          
          return (
            <div key={room.room_id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{room.room_name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(statusType)}`}>
                  {getStatusIcon(statusType)}
                  <span className="ml-1">
                    {statusType === 'occupied' ? '使用中' : '空闲'}
                  </span>
                </span>
              </div>

              {status.isOccupied && status.currentBooking && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Clock className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">当前会议</span>
                  </div>
                  <p className="text-sm text-blue-700">{status.currentBooking.meeting_title}</p>
                  <p className="text-xs text-blue-600">
                    {new Date(status.currentBooking.start_time).toLocaleTimeString('zh-CN')} - 
                    {new Date(status.currentBooking.end_time).toLocaleTimeString('zh-CN')}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Thermometer className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-sm text-gray-600">温度</span>
                  </div>
                  <span className="text-sm font-medium">{status.temperature?.toFixed(1)}°C</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">湿度</span>
                  </div>
                  <span className="text-sm font-medium">{status.humidity?.toFixed(1)}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Monitor className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">空气质量</span>
                  </div>
                  <span className={`text-sm font-medium ${getAirQualityColor(status.airQuality)}`}>
                    {getAirQualityText(status.airQuality)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm text-gray-600">能耗</span>
                  </div>
                  <span className="text-sm font-medium">{status.energyUsage?.toFixed(1)} 度/时</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wifi className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">WiFi</span>
                  </div>
                  <div className="flex items-center">
                    {getWifiIcon(status.wifiStrength)}
                    <span className="text-sm font-medium ml-2">{status.wifiStrength}/4</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-800 mb-2">设备状态</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(status.equipmentStatus || {}).map(([equipment, isWorking]) => (
                    <div key={equipment} className="flex items-center">
                      {isWorking ? (
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className="text-xs text-gray-600">
                        {equipment === 'projector' ? '投影仪' :
                         equipment === 'airConditioner' ? '空调' :
                         equipment === 'lights' ? '灯光' :
                         equipment === 'audio' ? '音响' : equipment}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">系统概览</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {rooms.filter(room => !roomStatus[room.room_id]?.isOccupied).length}
            </div>
            <div className="text-sm text-gray-600">空闲会议室</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {rooms.filter(room => roomStatus[room.room_id]?.isOccupied).length}
            </div>
            <div className="text-sm text-gray-600">使用中</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(roomStatus).reduce((sum, status) => sum + (status.energyUsage || 0), 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">总能耗 (度/时)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.values(roomStatus).filter(status => 
                status.equipmentStatus && Object.values(status.equipmentStatus).every(Boolean)
              ).length}
            </div>
            <div className="text-sm text-gray-600">设备正常</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomStatusMonitor;
