import React, { useState, useEffect } from 'react';
import { dbService } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Users, MapPin, CheckCircle, XCircle, Clock3 } from 'lucide-react';

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, [user]);

  const loadBookings = () => {
    const userBookings = dbService.getBookingsByUser(user.name);
    setBookings(userBookings);
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case '待审批':
        return <Clock3 className="h-4 w-4 text-yellow-600" />;
      case '已批准':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case '已拒绝':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case '已完成':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock3 className="h-4 w-4 text-gray-600" />;
    }
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">我的预订</h2>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">暂无预订记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => {
              const room = dbService.getRoomById(booking.room_id);
              return (
                <div key={booking.booking_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{booking.meeting_title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1">{booking.status}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{room?.room_name || '未知会议室'}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{booking.attendees_count} 人</span>
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
                        预订部门: {booking.department}
                      </div>
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

export default MyBookings;
