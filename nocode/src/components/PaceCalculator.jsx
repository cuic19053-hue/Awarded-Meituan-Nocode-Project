import React, { useState } from 'react';
import { Calculator, Clock, MapPin } from 'lucide-react';

const PaceCalculator = () => {
  const [targetTime, setTargetTime] = useState('');
  const [distance, setDistance] = useState('42.195');
  const [pace, setPace] = useState(null);
  const [error, setError] = useState('');

  const calculatePace = () => {
    setError('');
    
    // 验证时间格式
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
    if (!timeRegex.test(targetTime)) {
      setError('请输入正确的时间格式 (HH:MM:SS)');
      return;
    }

    // 验证距离
    const distanceNum = parseFloat(distance);
    if (isNaN(distanceNum) || distanceNum <= 0) {
      setError('请输入有效的距离');
      return;
    }

    // 解析时间
    const [hours, minutes, seconds] = targetTime.split(':').map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    
    // 计算每公里配速
    const paceSecondsPerKm = totalSeconds / distanceNum;
    const paceMinutes = Math.floor(paceSecondsPerKm / 60);
    const paceSeconds = Math.round(paceSecondsPerKm % 60);
    
    setPace({
      minutes: paceMinutes,
      seconds: paceSeconds,
      perKm: `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`
    });
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <Calculator className="mx-auto h-12 w-12 text-blue-600 mb-2" />
        <h2 className="text-2xl font-bold text-gray-800">马拉松配速计算器</h2>
        <p className="text-gray-600">计算您的每公里配速</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="inline h-4 w-4 mr-1" />
            目标成绩 (HH:MM:SS)
          </label>
          <input
            type="text"
            value={targetTime}
            onChange={(e) => setTargetTime(e.target.value)}
            placeholder="04:00:00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline h-4 w-4 mr-1" />
            距离 (公里)
          </label>
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            step="0.001"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <button
          onClick={calculatePace}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          计算配速
        </button>

        {pace && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">计算结果</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {pace.perKm}
              </div>
              <div className="text-sm text-green-700">
                每公里配速 (分钟:秒)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaceCalculator;
