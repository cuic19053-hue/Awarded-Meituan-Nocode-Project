import React, { useState, useEffect } from 'react';
import { dbService } from '../services/database';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    room_name: '',
    capacity: '',
    equipment: [],
    energy_consumption: ''
  });

  const equipmentOptions = ['投影仪', '白板', '视频会议', '音响系统', '空调', 'WiFi'];

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = () => {
    const allRooms = dbService.getRooms();
    setRooms(allRooms);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEquipmentChange = (equipment) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(eq => eq !== equipment)
        : [...prev.equipment, equipment]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const roomData = {
      ...formData,
      capacity: parseInt(formData.capacity),
      energy_consumption: parseFloat(formData.energy_consumption)
    };

    if (editingRoom) {
      dbService.updateRoom(editingRoom.room_id, roomData);
    } else {
      dbService.addRoom(roomData);
    }

    loadRooms();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      room_name: '',
      capacity: '',
      equipment: [],
      energy_consumption: ''
    });
    setEditingRoom(null);
    setShowAddForm(false);
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      room_name: room.room_name,
      capacity: room.capacity.toString(),
      equipment: room.equipment,
      energy_consumption: room.energy_consumption.toString()
    });
    setShowAddForm(true);
  };

  const handleDelete = (roomId) => {
    if (window.confirm('确定要删除这个会议室吗？')) {
      dbService.deleteRoom(roomId);
      loadRooms();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">会议室管理</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加会议室
          </button>
        </div>

        {showAddForm && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingRoom ? '编辑会议室' : '添加会议室'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    会议室名称
                  </label>
                  <input
                    type="text"
                    name="room_name"
                    value={formData.room_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    容纳人数
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  设备配置
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {equipmentOptions.map(equipment => (
                    <label key={equipment} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.equipment.includes(equipment)}
                        onChange={() => handleEquipmentChange(equipment)}
                        className="mr-2"
                      />
                      {equipment}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  每小时耗电量 (度)
                </label>
                <input
                  type="number"
                  name="energy_consumption"
                  value={formData.energy_consumption}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  保存
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => (
            <div key={room.room_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{room.room_name}</h3>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(room)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(room.room_id)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div>容量: {room.capacity} 人</div>
                <div>设备: {room.equipment.join(', ')}</div>
                <div>每小时耗电: {room.energy_consumption} 度</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoomManagement;
