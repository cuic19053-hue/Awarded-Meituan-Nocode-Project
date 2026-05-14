import React, { useState, useEffect } from 'react';
import { dbService } from '../services/database';
import { Brain, Star, Clock, Users, Zap, TrendingUp } from 'lucide-react';

const SmartRoomRecommendation = ({ attendees, duration, equipment, onSelectRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (rooms.length > 0) {
      generateRecommendations();
    }
  }, [rooms, attendees, duration, equipment]);

  const loadRooms = () => {
    const allRooms = dbService.getRooms();
    setRooms(allRooms);
    setLoading(false);
  };

  const generateRecommendations = () => {
    const scores = rooms.map(room => {
      let score = 0;
      const reasons = [];

      // 容量匹配度 (40%权重)
      const capacityRatio = attendees / room.capacity;
      if (capacityRatio >= 0.6 && capacityRatio <= 1.0) {
        score += 40;
        reasons.push('容量完美匹配');
      } else if (capacityRatio >= 0.4 && capacityRatio < 0.6) {
        score += 30;
        reasons.push('容量适中');
      } else if (capacityRatio > 1.0) {
        score -= 20;
        reasons.push('容量不足');
      } else {
        score += 10;
        reasons.push('容量较大，可能有空间浪费');
      }

      // 设备匹配度 (30%权重)
      if (equipment && equipment.length > 0) {
        const equipmentMatch = equipment.filter(eq => room.equipment.includes(eq)).length;
        const equipmentScore = (equipmentMatch / equipment.length) * 30;
        score += equipmentScore;
        if (equipmentMatch === equipment.length) {
          reasons.push('设备完全匹配');
        } else if (equipmentMatch > 0) {
          reasons.push(`设备部分匹配 (${equipmentMatch}/${equipment.length})`);
        } else {
          reasons.push('设备不匹配');
        }
      } else {
        score += 15;
        reasons.push('设备选择多样');
      }

      // 能耗效率 (20%权重)
      const energyEfficiency = 100 - (room.energy_consumption * 10);
      score += Math.max(0, energyEfficiency * 0.2);
      if (room.energy_consumption < 2) {
        reasons.push('能耗较低');
      } else if (room.energy_consumption > 3) {
        reasons.push('能耗较高');
      }

      // 历史使用频率 (10%权重)
      const bookings = dbService.getBookings();
      const roomBookings = bookings.filter(b => b.room_id === room.room_id);
      const usageScore = Math.min(roomBookings.length * 2, 10);
      score += usageScore;
      if (roomBookings.length > 10) {
        reasons.push('使用频率高');
      } else if (roomBookings.length < 3) {
        reasons.push('使用频率较低');
      }

      return {
        room,
        score: Math.round(score),
        reasons,
        estimatedCost: (duration || 1) * room.energy_consumption * 0.8 // 假设每度电0.8元
      };
    });

    // 按分数排序
    scores.sort((a, b) => b.score - a.score);
    setRecommendations(scores);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return '强烈推荐';
    if (score >= 60) return '推荐';
    return '不推荐';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="text-gray-500">AI分析中...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <Brain className="h-6 w-6 text-purple-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">智能会议室推荐</h3>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div
            key={rec.room.room_id}
            className={`border rounded-lg p-4 transition-all hover:shadow-md ${
              index === 0 ? 'border-purple-200 bg-purple-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-lg font-medium text-gray-800">
                    {rec.room.room_name}
                    {index === 0 && <Star className="inline h-4 w-4 text-yellow-500 ml-1" />}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(rec.score)}`}>
                    {getScoreLabel(rec.score)} ({rec.score}分)
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>容量: {rec.room.capacity}人</span>
                  </div>
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 mr-1" />
                    <span>能耗: {rec.room.energy_consumption}度/时</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>预估费用: ¥{rec.estimatedCost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>设备: {rec.room.equipment.length}项</span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">推荐理由:</p>
                  <div className="flex flex-wrap gap-1">
                    {rec.reasons.map((reason, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  可用设备: {rec.room.equipment.join(', ')}
                </div>
              </div>

              <button
                onClick={() => onSelectRoom(rec.room)}
                className={`ml-4 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  index === 0
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                选择此会议室
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">AI推荐说明</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 基于参会人数、设备需求、能耗效率等多维度分析</li>
          <li>• 考虑历史使用数据和会议室性能表现</li>
          <li>• 智能平衡使用效率和成本控制</li>
          <li>• 实时更新推荐结果，确保最佳选择</li>
        </ul>
      </div>
    </div>
  );
};

export default SmartRoomRecommendation;
