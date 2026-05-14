import React, { useState, useEffect } from 'react';
import { dbService } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Users, AlertCircle, CheckCircle } from 'lucide-react';

const BookingForm = ({ onBookingSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    room_id: '',
    meeting_title: '',
    start_time: '',
    end_time: '',
    attendees_count: 1
  });
  const [rooms, setRooms] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRooms(dbService.getRooms());
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const checkConflicts = () => {
    if (!formData.room_id || !formData.start_time || !formData.end_time) return;

    const hasConflict = dbService.checkBookingConflict(
      parseInt(formData.room_id),
      formData.start_time,
      formData.end_time
    );

    if (hasConflict) {
      const selectedRoom = dbService.getRoomById(parseInt(formData.room_id));
      const availableRooms = dbService.getAvailableRooms(
        formData.start_time,
        formData.end_time,
        parseInt(formData.attendees_count)
      );

      setConflicts([selectedRoom.room_name]);
      setRecommendations(availableRooms);
      setShowRecommendations(true);
    } else {
      setConflicts([]);
      setRecommendations([]);
      setShowRecommendations(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const booking = {
        ...formData,
        room_id: parseInt(formData.room_id),
        organizer: user.name,
        department: user.department,
        attendees_count: parseInt(formData.attendees_count),
        start_time: formData.start_time,
        end_time: formData.end_time
      };

      dbService.addBooking(booking);
      onBookingSuccess?.();
      
      // 重置表单
      setFormData({
        room_id: '',
        meeting_title: '',
        start_time: '',
        end_time: '',
        attendees_count: 1
      });
      setShowRecommendations(false);
    } catch (error) {
      console.error('预订失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectRecommendedRoom = (roomId) => {
    setFormData(prev => ({
      ...prev,
      room_id: roomId.toString()
    }));
    setShowRecommendations(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">预订会议室</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            会议标题
          </label>
          <input
            type="text"
            name="meeting_title"
            value={formData.meeting_title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入会议标题"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择会议室
            </label>
            <select
              name="room_id"
              value={formData.room_id}
              onChange={handleInputChange}
              onBlur={checkConflicts}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">请选择会议室</option>
              {rooms.map(room => (
                <option key={room.room_id} value={room.room_id}>
                  {room.room_name} (容量: {room.capacity}人)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              参会人数
            </label>
            <input
              type="number"
              name="attendees_count"
              value={formData.attendees_count}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              开始时间
            </label>
            <input
              type="datetime-local"
              name="start_time"
              value={formData.start_time}
              onChange={handleInputChange}
              onBlur={checkConflicts}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              结束时间
            </label>
            <input
              type="datetime-local"
              name="end_time"
              value={formData.end_time}
              onChange={handleInputChange}
              onBlur={checkConflicts}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {showRecommendations && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-center mb-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">
                检测到冲突：{conflicts.join(', ')} 已被预订
              </span>
            </div>
            <p className="text-yellow-700 mb-3">为您推荐以下可用会议室：</p>
            <div className="space-y-2">
              {recommendations.map(room => (
                <button
                  key={room.room_id}
                  type="button"
                  onClick={() => selectRecommendedRoom(room.room_id)}
                  className="w-full text-left p-3 bg-white border border-yellow-300 rounded-md hover:bg-yellow-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{room.room_name}</span>
                    <span className="text-sm text-gray-600">
                      容量: {room.capacity}人 | 设备: {room.equipment.join(', ')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? '提交中...' : '提交预订申请'}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
