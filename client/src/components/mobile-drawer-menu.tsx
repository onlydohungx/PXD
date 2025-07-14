import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetClose, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  Film,
  Tv,
  Sparkles,
  Compass,
  Flag,
  CalendarDays,
  User,
  Clock,
  Heart,
  ShieldCheck,
  Menu,
  Settings,
  LogOut,
  Filter,
  Bell
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileDrawerMenuProps {
  onClose?: () => void;
}

export function MobileDrawerMenu({ onClose }: MobileDrawerMenuProps) {
  const [location] = useLocation();
  const { user, isAuthenticated, logoutMutation } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setIsOpen(false);
        if (onClose) onClose();
      }
    });
  };

  // Navigation links
  const mainNavLinks = [
    { name: "Trang chủ", path: "/", icon: <Home className="h-4 w-4" /> },
    { name: "Phim lẻ", path: "/movies", icon: <Film className="h-4 w-4" /> },
    { name: "Phim bộ", path: "/series", icon: <Tv className="h-4 w-4" /> },
    { name: "Phim mới", path: "/movies?sort=new", icon: <Sparkles className="h-4 w-4" /> },
  ];

  const filterLinks = [
    { name: "Khám phá", path: "/filter", icon: <Compass className="h-4 w-4" /> },
    { name: "Thể loại", path: "/the-loai", icon: <Filter className="h-4 w-4" /> },
    { name: "Quốc gia", path: "/quoc-gia", icon: <Flag className="h-4 w-4" /> },
    { name: "Năm phát hành", path: "/nam", icon: <CalendarDays className="h-4 w-4" /> },
  ];

  const userLinks = isAuthenticated ? [
    { name: "Tài khoản của tôi", path: "/profile", icon: <User className="h-4 w-4" />, color: "text-primary bg-primary/10" },
    { name: "Lịch sử xem", path: "/profile?tab=history", icon: <Clock className="h-4 w-4" />, color: "text-blue-500 bg-blue-500/10" },
    { name: "Phim yêu thích", path: "/profile?tab=favorites", icon: <Heart className="h-4 w-4" />, color: "text-pink-500 bg-pink-500/10" },
    ...(user?.role === "admin" ? [{ name: "Quản trị hệ thống", path: "/admin", icon: <ShieldCheck className="h-4 w-4" />, color: "text-green-500 bg-green-500/10", badge: "Admin" }] : []),
  ] : [];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted/30 hover:text-primary">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-[80vw] max-w-xs border-r border-muted/50 bg-card/95 backdrop-blur-md p-0">
        <SheetHeader className="p-5 border-b border-muted/20">
          <SheetTitle className="flex justify-center">
            <Logo size="small" />
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="py-2">
            {/* User info if logged in */}
            {isAuthenticated && user && (
              <div className="flex items-center p-4 mb-2 border-b border-muted/10">
                <Avatar className="h-9 w-9 mr-3 border-2 border-primary/30">
                  <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {user.email || "Không có email"}
                  </p>
                </div>
              </div>
            )}
            
            {/* Main navigation section */}
            <div className="px-2 py-1">
              <div className="py-2">
                {mainNavLinks.map((link) => (
                  <SheetClose asChild key={link.path}>
                    <Link
                      href={link.path}
                      className={`flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-medium transition-colors ${
                        location === link.path 
                          ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary" 
                          : "hover:bg-muted/30"
                      }`}
                    >
                      {link.icon}
                      {link.name}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </div>
            
            {/* Filter section */}
            <div className="mt-2 pt-2 border-t border-muted/10 px-2">
              <p className="px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Lọc phim
              </p>
              <div className="py-1">
                {filterLinks.map((link) => (
                  <SheetClose asChild key={link.path}>
                    <Link
                      href={link.path}
                      className={`flex items-center gap-3 rounded-lg py-2 px-3 text-sm font-medium transition-colors ${
                        location.startsWith(link.path) 
                          ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary" 
                          : "hover:bg-muted/30"
                      }`}
                    >
                      {link.icon}
                      {link.name}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </div>
            
            {/* User section if logged in */}
            {isAuthenticated && userLinks.length > 0 && (
              <div className="mt-2 pt-2 border-t border-muted/10 px-2">
                <p className="px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Tài khoản
                </p>
                <div className="py-1">
                  {userLinks.map((link) => (
                    <SheetClose asChild key={link.path}>
                      <Link
                        href={link.path}
                        className={`flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-medium transition-colors hover:bg-muted/30`}
                      >
                        <div className={`p-1.5 rounded-md ${link.color}`}>
                          {link.icon}
                        </div>
                        <span>{link.name}</span>
                        {link.badge && (
                          <Badge className="ml-2 bg-green-500/20 text-green-500 border-none text-[10px] py-0">
                            {link.badge}
                          </Badge>
                        )}
                      </Link>
                    </SheetClose>
                  ))}
                  
                  {/* Logout button */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-medium transition-colors hover:bg-red-500/10 text-red-500"
                  >
                    <div className="p-1.5 rounded-md bg-red-500/10 text-red-500">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Login button if not logged in */}
            {!isAuthenticated && (
              <div className="mt-2 pt-2 border-t border-muted/10 px-4">
                <p className="py-2 text-xs text-muted-foreground">
                  Đăng nhập để sử dụng đầy đủ tính năng và lưu lịch sử xem phim
                </p>
                <SheetClose asChild>
                  <Link href="/auth">
                    <Button className="w-full gap-2 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 rounded-full mt-1">
                      <User className="h-4 w-4" />
                      <span>Đăng nhập / Đăng ký</span>
                    </Button>
                  </Link>
                </SheetClose>
              </div>
            )}
            
            {/* Footer links */}
            <div className="mt-4 pt-4 border-t border-muted/10 px-4 pb-8">
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <a href="/about" className="hover:text-foreground">Giới thiệu</a>
                <a href="/privacy" className="hover:text-foreground">Chính sách</a>
                <a href="/terms" className="hover:text-foreground">Điều khoản sử dụng</a>
                <a href="/contact" className="hover:text-foreground">Liên hệ</a>
                <a href="/faq" className="hover:text-foreground">FAQ</a>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                © 2025 Phim Xuyên Đêm. Tất cả nội dung thuộc về chủ sở hữu gốc.
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}