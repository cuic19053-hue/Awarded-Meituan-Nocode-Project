import React, { useState, useEffect } from 'react';
import { dbService } from '../services/database';
import { Calendar } from 'lucide-react';

const YearSelector = ({ onYearChange }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    loadAvailableYears();
  }, []);

  const loadAvailableYears = () => {
    const bookings = dbService.getBookings();
    const energyLogs = dbService.getEnergyLogs();
    
    // 从预订和能耗记录中提取所有年份
    const bookingYears = bookings.map(booking => 
      new Date(booking.start_time).getFullYear()
    );
    const logYears = energyLogs.map(log => 
      new Date(log.date).getFullYear()
    );
    
    // 合并并去重
    const allYears = [...new Set([...bookingYears, ...logYears])];
    
    // 如果没有数据，默认显示当前年份
    if (allYears.length === 0) {
      allYears.push(new Date().getFullYear());
    }
    
    // 排序
    allYears.sort((a, b) => b - a);
    
    setAvailableYears(allYears);
    
    // 设置默认选中年份
    const config = dbService.getYearConfig();
    if (config.activeYear) {
      setSelectedYear(config.activeYear);
      onYearChange?.(config.activeYear);
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    dbService.setActiveYear(year);
    onYearChange?.(year);
  };

  return (
    <div className="flex items-center space-x-2">
      <Calendar className="h-5 w-5 text-gray-600" />
      <select
        value={selectedYear}
        onChange={(e) => handleYearChange(parseInt(e.target.value))}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {availableYears.map(year => (
          <option key={year} value={year}>
            {year}年
          </option>
        ))}
      </select>
    </div>
  );
};

export default YearSelector;
