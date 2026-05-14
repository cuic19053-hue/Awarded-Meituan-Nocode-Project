// 模拟数据库服务
export class DatabaseService {
  constructor() {
    this.initializeData();
  }

  initializeData() {
    // 初始化会议室数据
    if (!localStorage.getItem('meeting_rooms')) {
      const rooms = [
        {
          room_id: 1,
          room_name: '101会议室',
          capacity: 10,
          equipment: ['投影仪', '白板', '视频会议'],
          energy_consumption: 2.5
        },
        {
          room_id: 2,
          room_name: '102会议室',
          capacity: 6,
          equipment: ['投影仪', '白板'],
          energy_consumption: 1.8
        },
        {
          room_id: 3,
          room_name: '201大会议室',
          capacity: 20,
          equipment: ['投影仪', '白板', '视频会议', '音响系统'],
          energy_consumption: 4.0
        }
      ];
      localStorage.setItem('meeting_rooms', JSON.stringify(rooms));
    }

    // 初始化预订记录
    if (!localStorage.getItem('bookings')) {
      localStorage.setItem('bookings', JSON.stringify([]));
    }

    // 初始化能耗记录
    if (!localStorage.getItem('energy_logs')) {
      localStorage.setItem('energy_logs', JSON.stringify([]));
    }

    // 初始化年份配置
    if (!localStorage.getItem('year_config')) {
      const currentYear = new Date().getFullYear();
      localStorage.setItem('year_config', JSON.stringify({ activeYear: currentYear }));
    }
  }

  // 会议室相关操作
  getRooms() {
    return JSON.parse(localStorage.getItem('meeting_rooms') || '[]');
  }

  getRoomById(roomId) {
    const rooms = this.getRooms();
    return rooms.find(room => room.room_id === roomId);
  }

  addRoom(room) {
    const rooms = this.getRooms();
    const newRoom = {
      ...room,
      room_id: Math.max(...rooms.map(r => r.room_id), 0) + 1
    };
    rooms.push(newRoom);
    localStorage.setItem('meeting_rooms', JSON.stringify(rooms));
    return newRoom;
  }

  updateRoom(roomId, updates) {
    const rooms = this.getRooms();
    const index = rooms.findIndex(room => room.room_id === roomId);
    if (index !== -1) {
      rooms[index] = { ...rooms[index], ...updates };
      localStorage.setItem('meeting_rooms', JSON.stringify(rooms));
      return rooms[index];
    }
    return null;
  }

  deleteRoom(roomId) {
    const rooms = this.getRooms();
    const filteredRooms = rooms.filter(room => room.room_id !== roomId);
    localStorage.setItem('meeting_rooms', JSON.stringify(filteredRooms));
    return true;
  }

  // 预订相关操作
  getBookings() {
    return JSON.parse(localStorage.getItem('bookings') || '[]');
  }

  getBookingsByUser(userId) {
    const bookings = this.getBookings();
    return bookings.filter(booking => booking.organizer === userId);
  }

  getBookingsByYear(year) {
    const bookings = this.getBookings();
    return bookings.filter(booking => {
      const bookingYear = new Date(booking.start_time).getFullYear();
      return bookingYear === year;
    });
  }

  addBooking(booking) {
    const bookings = this.getBookings();
    const newBooking = {
      ...booking,
      booking_id: Math.max(...bookings.map(b => b.booking_id), 0) + 1,
      status: '待审批'
    };
    bookings.push(newBooking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    return newBooking;
  }

  updateBookingStatus(bookingId, status) {
    const bookings = this.getBookings();
    const index = bookings.findIndex(booking => booking.booking_id === bookingId);
    if (index !== -1) {
      bookings[index].status = status;
      localStorage.setItem('bookings', JSON.stringify(bookings));
      return bookings[index];
    }
    return null;
  }

  // 能耗记录相关操作
  getEnergyLogs() {
    return JSON.parse(localStorage.getItem('energy_logs') || '[]');
  }

  getEnergyLogsByYear(year) {
    const logs = this.getEnergyLogs();
    return logs.filter(log => {
      const logYear = new Date(log.date).getFullYear();
      return logYear === year;
    });
  }

  addEnergyLog(log) {
    const logs = this.getEnergyLogs();
    const newLog = {
      ...log,
      log_id: Math.max(...logs.map(l => l.log_id), 0) + 1
    };
    logs.push(newLog);
    localStorage.setItem('energy_logs', JSON.stringify(logs));
    return newLog;
  }

  // 年份配置相关操作
  getYearConfig() {
    return JSON.parse(localStorage.getItem('year_config') || '{}');
  }

  setActiveYear(year) {
    const config = this.getYearConfig();
    config.activeYear = year;
    localStorage.setItem('year_config', JSON.stringify(config));
  }

  // 冲突检测
  checkBookingConflict(roomId, startTime, endTime) {
    const bookings = this.getBookings();
    return bookings.some(booking => 
      booking.room_id === roomId &&
      booking.status !== '已拒绝' &&
      ((startTime >= booking.start_time && startTime < booking.end_time) ||
       (endTime > booking.start_time && endTime <= booking.end_time) ||
       (startTime <= booking.start_time && endTime >= booking.end_time))
    );
  }

  // 获取可用会议室
  getAvailableRooms(startTime, endTime, minCapacity = 1, requiredEquipment = []) {
    const rooms = this.getRooms();
    return rooms.filter(room => {
      const hasConflict = this.checkBookingConflict(room.room_id, startTime, endTime);
      const meetsCapacity = room.capacity >= minCapacity;
      const hasEquipment = requiredEquipment.every(eq => room.equipment.includes(eq));
      return !hasConflict && meetsCapacity && hasEquipment;
    });
  }
}

export const dbService = new DatabaseService();
