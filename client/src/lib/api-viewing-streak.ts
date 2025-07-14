import { ViewingStreak } from '../hooks/useViewingStreak';

/**
 * Giả lập của API chuỗi xem phim (Tính năng đã bị gỡ bỏ)
 * Trả về dữ liệu mặc định với thông báo tính năng đang phát triển
 */
export async function fetchViewingStreak(): Promise<ViewingStreak> {
  console.log('Tính năng chuỗi xem phim đang được phát triển.');
  
  // Trả về dữ liệu mặc định
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastViewDate: new Date().toISOString(),
    achievedMilestones: [],
    nextMilestone: 3,
    daysUntilNextMilestone: 3,
    milestoneStyle: {
      color: "#4CAF50",
      animation: "pulse",
      label: "Tính năng đang phát triển"
    }
  };
}