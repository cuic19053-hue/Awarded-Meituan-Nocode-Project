import React, { useState, useEffect } from 'react';
import { dbService } from '../services/database';
import { Calendar, Clock, Users, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ApprovalBoard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('待审批');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = () => {
    const allBookings = dbService.getBookings();
    setBookings(allBookings);
    setLoading(false);
  };

  const handleApprove = (bookingId) => {
    dbService.updateBookingStatus(bookingId, '已批准');
    loadBookings();
  };

  const handleReject = (bookingId) => {
    dbService.updateBookingStatus(bookingId, '已拒绝');
    loadBookings();
  };

  const handleComplete = (bookingId) => {
    const booking = bookings.find(b => b.booking_id === bookingId);
    dbService.updateBookingStatus(bookingId, '已完成');
    
    // 自动计算能耗
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    const duration = (endTime - startTime) / (1000 * 60 * 60); // 小时
    const room = dbService.getRoomById(booking.room_id);
    const energyUsed = duration * room.energy_consumption;
    
    dbService.addEnergyLog({
      room_id: booking.room_id,
      date: new Date().toISOString().split('T')[0],
      total_energy_used: energyUsed,
      total_meeting_hours: duration
    });
    
    loadBookings();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '待审批':
        return 'bg-yellow-100 text-yellow-800';
      case '已批准':
        return 'bg-green-100 text-green-800';
      case '已拒绝':
        return 'bg-red-100 text-red-800';
      case '已完成':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredBookings = bookings.filter(booking => booking.status === activeTab);

  const tabs = ['待审批', '已批准', '已拒绝', '已完成'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">预订审批</h2>

        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab} ({bookings.filter(b => b.status === tab).length})
            </button>
          ))}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">暂无{activeTab}的预订申请</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(booking => {
              const room = dbService.getRoomById(booking.room_id);
              return (
                <div key={booking.booking_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{booking.meeting_title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{room?.room_name || '未知会议室'}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{booking.organizer} ({booking.department})</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{formatDateTime(booking.start_time)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{formatDateTime(booking.end_time)}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-500">
                        参会人数: {booking.attendees_count} 人
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      {booking.status === '待审批' && (
                        <>
                          <button
                            onClick={() => handleApprove(booking.booking_id)}
                            className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            批准
                          </button>
                          <button
                            onClick={() => handleReject(booking.booking_id)}
                            className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            拒绝
                          </button>
                        </>
                      )}
                      {booking.status === '已批准' && (
                        <button
                          onClick={() => handleComplete(booking.booking_id)}
                          className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          标记完成
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalBoard;
