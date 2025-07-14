import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { fetchFavorites, updateUserProfile, removeFromFavorites } from "@/lib/api";
import { fetchWatchHistory, removeFromWatchHistory } from "@/lib/api-watch-history";
import { queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ContinueWatchingCard } from "@/components/continue-watching-card";
import { 
  User, 
  Heart, 
  History, 
  Edit2, 
  Save, 
  Mail, 
  Calendar, 
  Play, 
  Trash2, 
  Star, 
  Clock,
  Film,
  Settings,
  Crown,
  Trophy,
  Flame,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { User as UserType } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProfileFormData {
  email: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  
  const user = authUser as UserType;
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  
  // Form setup
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ProfileFormData>({
    defaultValues: {
      email: user?.email || ""
    }
  });
  
  // Get tab from URL query params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get("tab");
    if (tab && ["profile", "history", "favorites"].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);
  
  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    window.history.replaceState({}, "", url);
  }, [activeTab]);

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      reset({ email: user.email || "" });
    }
  }, [user, reset]);
  
  // Update user mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => updateUserProfile(data),
    onSuccess: () => {
      toast({
        title: "Thông tin đã được cập nhật",
        description: "Thông tin cá nhân của bạn đã được lưu thành công",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi cập nhật",
        description: error.message || "Đã xảy ra lỗi khi cập nhật thông tin",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };
  
  // Fetch watch history
  const { 
    data: historyData, 
    isLoading: isHistoryLoading 
  } = useQuery({
    queryKey: ['/api/user/watch-history'],
    queryFn: fetchWatchHistory,
    enabled: activeTab === 'history'
  });
  
  // Fetch favorites
  const { 
    data: favoritesData, 
    isLoading: isFavoritesLoading,
    refetch: refetchFavorites
  } = useQuery({
    queryKey: ['/api/user/favorites'],
    queryFn: fetchFavorites,
    enabled: activeTab === 'favorites'
  });
  
  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: (movieSlug: string) => removeFromFavorites(movieSlug),
    onSuccess: () => {
      toast({
        title: "Đã xóa khỏi yêu thích",
        description: "Phim đã được xóa khỏi danh sách yêu thích của bạn",
      });
      refetchFavorites();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Đã xảy ra lỗi khi xóa khỏi yêu thích",
        variant: "destructive",
      });
    },
  });
  
  // Remove from watch history mutation
  const removeHistoryMutation = useMutation({
    mutationFn: (movieSlug: string) => removeFromWatchHistory(movieSlug),
    onSuccess: () => {
      toast({
        title: "Đã xóa khỏi lịch sử",
        description: "Phim đã được xóa khỏi lịch sử xem của bạn",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/watch-history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Đã xảy ra lỗi khi xóa khỏi lịch sử",
        variant: "destructive",
      });
    },
  });

  const handleRemoveFromFavorites = (movieSlug: string) => {
    removeFavoriteMutation.mutate(movieSlug);
  };

  const handleRemoveFromHistory = (movieSlug: string) => {
    removeHistoryMutation.mutate(movieSlug);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-400">Bạn cần đăng nhập để xem trang này</p>
        </div>
      </div>
    );
  }

  // Get user stats
  const historyCount = Array.isArray(historyData) ? historyData.length : 0;
  const favoritesCount = Array.isArray(favoritesData) ? favoritesData.length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 container mx-auto px-4 py-8"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="mb-8">
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden">
            <div className="relative">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20" />
              
              <CardContent className="relative p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-white/20 shadow-2xl">
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-bold">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2">
                      <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                        {user.role === 'admin' ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      </Badge>
                    </div>
                  </div>

                  {/* User info */}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {user.username}
                    </h1>
                    <p className="text-slate-300 mb-4 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </p>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <History className="w-4 h-4" />
                        <span>{historyCount} phim đã xem</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Heart className="w-4 h-4" />
                        <span>{favoritesCount} yêu thích</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4" />
                        <span>Tham gia {new Date(user.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="border-white/20 hover:bg-white/10"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-black/30 backdrop-blur-sm border border-white/10 mb-8">
              <TabsTrigger 
                value="profile" 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                <Settings className="w-4 h-4 mr-2" />
                Thông tin
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                <History className="w-4 h-4 mr-2" />
                Lịch sử xem
              </TabsTrigger>
              <TabsTrigger 
                value="favorites"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                <Heart className="w-4 h-4 mr-2" />
                Yêu thích
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Thông tin cá nhân
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Quản lý thông tin tài khoản của bạn
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Username - readonly */}
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-white">Tên đăng nhập</Label>
                          <Input
                            id="username"
                            value={user.username}
                            disabled
                            className="bg-black/20 border-white/10 text-white"
                          />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            {...register("email", { 
                              required: "Email là bắt buộc",
                              pattern: {
                                value: /^\S+@\S+$/i,
                                message: "Email không hợp lệ"
                              }
                            })}
                            disabled={!isEditing}
                            className="bg-black/20 border-white/10 text-white disabled:opacity-60"
                          />
                          {errors.email && (
                            <p className="text-red-400 text-sm">{errors.email.message}</p>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false);
                              reset();
                            }}
                            className="border-white/20 hover:bg-white/10"
                          >
                            Hủy
                          </Button>
                        </div>
                      )}
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Watch History Tab */}
            <TabsContent value="history">
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Lịch sử xem phim
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {historyCount} phim đã xem gần đây
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isHistoryLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="aspect-[2/3] bg-white/10 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : historyData && historyData.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {historyData.map((item: any) => (
                          <div key={item.movieSlug} className="relative group">
                            <ContinueWatchingCard
                              movieSlug={item.movieSlug}
                              title={item.movieDetails?.name || item.name || item.movieSlug}
                              poster={item.movieDetails?.poster_url || item.movieDetails?.thumb_url || item.poster_url || item.thumb_url}
                              year={item.movieDetails?.year?.toString() || item.year?.toString()}
                              quality={item.movieDetails?.quality || item.quality}
                              episodeIndex={item.episodeIndex}
                              progress={item.progress}
                              currentTime={item.currentTime}
                              duration={item.duration}
                            />
                            {/* Remove button */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-8 h-8 p-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-black/90 backdrop-blur-xl border border-white/10">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">Xác nhận xóa</AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-300">
                                    Bạn có chắc chắn muốn xóa phim này khỏi lịch sử xem?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-white/20 hover:bg-white/10">
                                    Hủy
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => handleRemoveFromHistory(item.movieSlug)}
                                  >
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Film className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Chưa có lịch sử xem</h3>
                        <p className="text-slate-400">Bắt đầu xem phim để tạo lịch sử xem của bạn</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites">
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Phim yêu thích
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {favoritesCount} phim trong danh sách yêu thích
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isFavoritesLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="aspect-[2/3] bg-white/10 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : favoritesData && favoritesData.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {favoritesData.map((item: any) => (
                          <div key={item.movieSlug} className="relative group">
                            <div className="aspect-[2/3] bg-black/20 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300">
                              <img
                                src={item.poster_url || item.thumb_url || 'https://via.placeholder.com/300x450?text=No+Image'}
                                alt={item.name || item.movieSlug}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const imgElement = e.target as HTMLImageElement;
                                  if (imgElement.src !== 'https://via.placeholder.com/300x450?text=No+Image') {
                                    imgElement.src = 'https://via.placeholder.com/300x450?text=No+Image';
                                  }
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                  <h3 className="text-white font-medium text-sm line-clamp-2">
                                    {item.name || item.movieSlug}
                                  </h3>
                                  {item.year && (
                                    <p className="text-slate-300 text-xs mt-1">{item.year}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Remove button */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-8 h-8 p-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-black/90 backdrop-blur-xl border border-white/10">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">Xác nhận xóa</AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-300">
                                    Bạn có chắc chắn muốn xóa phim này khỏi danh sách yêu thích?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-white/20 hover:bg-white/10">
                                    Hủy
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => handleRemoveFromFavorites(item.movieSlug)}
                                  >
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Heart className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Chưa có phim yêu thích</h3>
                        <p className="text-slate-400">Thêm phim vào danh sách yêu thích để xem lại sau</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
}