import { useState, useEffect } from 'react';
import { fetchViewingStreak } from '@/lib/api-viewing-streak';

// Milestone styles for different streak levels
export const MILESTONE_STYLES = {
  3: {
    color: "#4CAF50", // Xanh lá nhạt
    animation: "pulse",
    label: "Chăm chỉ"
  },
  7: {
    color: "#2196F3", // Xanh dương
    animation: "bounce",
    label: "Kiên định"
  },
  10: {
    color: "#9C27B0", // Tím
    animation: "flip",
    label: "Siêu fan"
  },
  20: {
    color: "#FF9800", // Cam
    animation: "rubberBand",
    label: "Chuyên gia"
  },
  30: {
    color: "#F44336", // Đỏ
    animation: "tada",
    label: "Đam mê"
  },
  60: {
    color: "#E91E63", // Hồng
    animation: "jello",
    label: "Vượt trội"
  },
  100: {
    color: "#FF5722", // Đỏ cam
    animation: "heartBeat",
    label: "Siêu nhân"
  },
  120: {
    color: "#673AB7", // Tím đậm
    animation: "shakeY",
    label: "Không thể tin được"
  },
  150: {
    color: "#3F51B5", // Xanh dương đậm
    animation: "flash",
    label: "Thần thoại"
  },
  200: {
    color: "linear-gradient(45deg, #FFD700, #FF5722, #E91E63, #9C27B0, #3F51B5)", // Gradient
    animation: "shakeX",
    label: "Huyền thoại"
  }
};

export interface ViewingStreak {
  currentStreak: number;
  longestStreak: number;
  lastViewDate: string;
  achievedMilestones: number[];
  nextMilestone: number;
  daysUntilNextMilestone: number;
  milestoneStyle: {
    color: string;
    animation: string;
    label: string;
  };
}

/**
 * Hook để lấy và xử lý dữ liệu chuỗi xem phim
 */
export default function useViewingStreak(userId?: number) {
  // Mặc định, sử dụng dữ liệu giả để phát triển giao diện
  // Trong thực tế, dữ liệu này sẽ được lấy từ API
  const defaultStreak: ViewingStreak = {
    currentStreak: 0,
    longestStreak: 0,
    lastViewDate: new Date().toISOString(),
    achievedMilestones: [],
    nextMilestone: 3,
    daysUntilNextMilestone: 3,
    milestoneStyle: MILESTONE_STYLES[3]
  };

  const [showMilestoneBadge, setShowMilestoneBadge] = useState(false);
  const [recentMilestone, setRecentMilestone] = useState(0);

  // Lấy dữ liệu chuỗi xem phim từ API
  const [streak, setStreak] = useState<ViewingStreak>(defaultStreak);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchStreakData = async () => {
    try {
      setIsLoading(true);
      console.log('Đang gọi API lấy dữ liệu chuỗi xem phim...');
      
      // Sử dụng hàm API chính thức đã được định nghĩa
      const data = await fetchViewingStreak();
      
      if (data) {
        // Tính next milestone và days until next milestone nếu API không trả về
        const nextMilestoneValue = data.nextMilestone || getNextMilestone(data.currentStreak);
        const daysUntilNextValue = data.daysUntilNextMilestone || 
          getDaysUntilNextMilestone(data.currentStreak, nextMilestoneValue);
        
        // Nếu API không trả về milestoneStyle, tự tính dựa trên current streak
        const milestoneStyleValue = data.milestoneStyle || getMilestoneStyle(data.currentStreak);
        
        // Đảm bảo achievedMilestones luôn là một mảng
        const achievedMilestonesValue = data.achievedMilestones || [];
        
        setStreak({
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0,
          lastViewDate: data.lastViewDate || new Date().toISOString(),
          achievedMilestones: achievedMilestonesValue,
          nextMilestone: nextMilestoneValue,
          daysUntilNextMilestone: daysUntilNextValue,
          milestoneStyle: milestoneStyleValue
        });
        
        // Kiểm tra xem người dùng đã đạt mốc mới chưa
        if (data.newMilestone) {
          setRecentMilestone(data.newMilestone);
          setShowMilestoneBadge(true);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu chuỗi xem phim:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Hàm refetch để gọi lại API khi cần
  const refetch = async () => {
    await fetchStreakData();
    return streak;
  };

  // Xử lý các mốc chuỗi
  const getMilestoneStyle = (currentStreak: number) => {
    // Tìm mốc phù hợp nhất cho chuỗi hiện tại
    const milestoneKey = Object.keys(MILESTONE_STYLES)
      .map(Number)
      .filter(m => m <= currentStreak)
      .sort((a, b) => b - a)[0] || 3;
        
    return MILESTONE_STYLES[milestoneKey as keyof typeof MILESTONE_STYLES];
  };
  
  // Tính mốc tiếp theo
  const getNextMilestone = (currentStreak: number) => {
    const milestones = Object.keys(MILESTONE_STYLES).map(Number).sort((a, b) => a - b);
    return milestones.find(m => m > currentStreak) || milestones[milestones.length - 1];
  };
  
  // Tính số ngày cho đến mốc tiếp theo
  const getDaysUntilNextMilestone = (currentStreak: number, nextMilestone: number) => {
    return Math.max(0, nextMilestone - currentStreak);
  };

  // Xử lý hiển thị badge khi đạt mốc mới
  const checkForMilestone = (currentStreak: number, achievedMilestones: number[]) => {
    // Nếu chuỗi hiện tại là một trong các mốc và chưa đạt trước đó
    const milestones = Object.keys(MILESTONE_STYLES).map(Number);
    const isMilestone = milestones.includes(currentStreak);
    
    if (isMilestone && !achievedMilestones.includes(currentStreak)) {
      setRecentMilestone(currentStreak);
      setShowMilestoneBadge(true);
      return true;
    }
    
    return false;
  };

  // Đóng badge khi người dùng nhấn nút đóng
  const closeMilestoneBadge = () => {
    setShowMilestoneBadge(false);
  };

  // Lấy dữ liệu chuỗi xem phim khi component được mount
  useEffect(() => {
    fetchStreakData();
  }, []);

  // Kiểm tra mốc mới khi dữ liệu thay đổi
  useEffect(() => {
    // Kiểm tra xem người dùng đã đạt mốc mới chưa khi dữ liệu thay đổi
    if (streak) {
      checkForMilestone(streak.currentStreak, streak.achievedMilestones);
    }
  }, [streak]);

  return {
    streak,
    isLoading,
    refetch,
    showMilestoneBadge,
    recentMilestone,
    closeMilestoneBadge,
    getMilestoneStyle,
    getNextMilestone,
    getDaysUntilNextMilestone
  };
}