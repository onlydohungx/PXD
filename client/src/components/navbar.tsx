import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "./logo";
import { useAuth } from "@/hooks/use-auth";
import useMobile from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  Search,
  Menu,
  User,
  LogOut,
  Heart,
  Clock,
  ShieldCheck,
  Home,
  Film,
  Tv,
  Sparkles,
  X,
  ListFilter,
  Flag,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import { AuthForms } from "./auth-forms";

export function Navbar() {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // State theo dõi vị trí cuộn và hiển thị navbar
  const [isScrolled, setIsScrolled] = useState(false);

  // Theo dõi sự kiện cuộn
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 20);
    };

    // Thêm event listener
    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/");
      }
    });
  };

  const navLinks = [
    { name: "Trang chủ", path: "/", id: "home", icon: <Home className="h-4 w-4" /> },
    { name: "Phim lẻ", path: "/movies", id: "movies", icon: <Film className="h-4 w-4" /> },
    { name: "Phim bộ", path: "/series", id: "series", icon: <Tv className="h-4 w-4" /> },
    { name: "Phim mới", path: "/movies?sort=new", id: "new-movies", icon: <Sparkles className="h-4 w-4" /> },
  ];
  
  // Links for categories dropdown
  const filterLinks = [
    { name: "Thể loại", path: "/the-loai", id: "categories", icon: <ListFilter className="h-4 w-4" /> },
    { name: "Quốc gia", path: "/quoc-gia", id: "countries", icon: <Flag className="h-4 w-4" /> },
    { name: "Năm", path: "/nam", id: "years", icon: <CalendarDays className="h-4 w-4" /> },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 w-full transition-all duration-300 ${isScrolled ? 'glass-nav shadow-lg' : 'bg-transparent'}`}>
      {/* Auth Modal */}
      {showAuthModal && !user && (
        <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
          <DialogOverlay className="bg-background/80 backdrop-blur-sm" />
          <DialogContent className="sm:max-w-md border-primary/20 bg-gradient-to-br from-card/95 to-background/95 backdrop-blur-md shadow-xl ring-1 ring-primary/10">
            <DialogTitle className="text-xl font-bold text-center mb-1">
              Đăng nhập / Đăng ký
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground mb-6">
              Đăng nhập để trải nghiệm đầy đủ các tính năng
            </DialogDescription>
            <button 
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-white transition"
              onClick={() => setShowAuthModal(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <AuthForms onSuccess={() => {
              setShowAuthModal(false);
              navigate("/");
            }} />
          </DialogContent>
        </Dialog>
      )}

      {/* Desktop Navigation */}
      {!isMobile && (
        <nav className={`px-8 py-4 flex items-center justify-between transition-all duration-500 w-full
          ${isScrolled 
            ? 'navbar-scrolled' 
            : 'navbar-gradient'}`}>
          <div className="flex items-center">
            <Link href="/" className="mr-10">
              <Logo size="medium" />
            </Link>
            <div className="flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.path}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 group navbar-link button-glow ${
                    location === link.path 
                      ? "text-primary bg-gradient-to-r from-primary/15 to-secondary/15 font-medium shadow-md border border-primary/20" 
                      : "text-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:text-primary hover:shadow-lg hover:scale-105"
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
              
              {/* Filter dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 text-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:text-primary hover:shadow-lg hover:scale-105 group navbar-link button-glow">
                    <ListFilter className="h-4 w-4 group-hover:text-primary transition-colors" />
                    Lọc phim
                    <ChevronDown className="h-3.5 w-3.5 ml-1 group-hover:rotate-180 transition-transform duration-300" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gradient-to-br from-card/95 to-background/95 backdrop-blur-md border-primary/20 shadow-xl ring-1 ring-primary/10">
                  {filterLinks.map((link) => (
                    <DropdownMenuItem asChild key={link.id}>
                      <Link
                        href={link.path}
                        className={`flex items-center px-3 py-2 w-full ${
                          location.startsWith(link.path) 
                            ? "bg-primary/10 text-primary font-medium" 
                            : ""
                        }`}
                      >
                        <div className="mr-2">{link.icon}</div>
                        <span>{link.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Tìm kiếm phim..."
                className="pl-10 pr-4 bg-gradient-to-r from-muted/70 to-muted/50 border-muted/50 text-foreground rounded-full focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-300 hover:bg-muted/80 focus:shadow-lg"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length >= 2) {
                    // Sử dụng debounce để tránh quá nhiều request
                    if (searchTimeoutRef.current) {
                      clearTimeout(searchTimeoutRef.current);
                    }
                    searchTimeoutRef.current = setTimeout(() => {
                      navigate(`/search?q=${encodeURIComponent(e.target.value.trim())}`);
                    }, 500);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    e.preventDefault();
                    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-10 h-10 rounded-full p-0 bg-gradient-to-r from-primary/90 to-secondary/90 hover:from-primary hover:to-secondary hover:shadow-xl hover:scale-110 transition-all duration-300 ring-2 ring-white/10 hover:ring-white/20 button-glow"
                  >
                    <Avatar className="h-9 w-9 border-2 border-white/20">
                      <AvatarFallback className="bg-transparent text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 p-2 bg-gradient-to-br from-card/95 to-background/95 backdrop-blur-md border-primary/20 shadow-xl ring-1 ring-primary/10">
                  <div className="flex items-center justify-start p-2 pb-4">
                    <Avatar className="h-10 w-10 border-2 border-primary/30">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col ml-3">
                      <p className="font-semibold">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email || "Không có email"}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  <div className="py-2">
                    <DropdownMenuItem asChild className="py-2 cursor-pointer focus:bg-muted/50">
                      <Link href="/profile" className="flex items-center">
                        <div className="mr-3 p-1.5 rounded-md bg-primary/10 text-primary">
                          <User className="h-4 w-4" />
                        </div>
                        <span>Tài khoản của tôi</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild className="py-2 cursor-pointer focus:bg-muted/50">
                      <Link href="/profile?tab=history" className="flex items-center">
                        <div className="mr-3 p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                          <Clock className="h-4 w-4" />
                        </div>
                        <span>Lịch sử xem</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild className="py-2 cursor-pointer focus:bg-muted/50">
                      <Link href="/profile?tab=favorites" className="flex items-center">
                        <div className="mr-3 p-1.5 rounded-md bg-pink-500/10 text-pink-500">
                          <Heart className="h-4 w-4" />
                        </div>
                        <span>Phim yêu thích</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {user.role === "admin" && (
                      <DropdownMenuItem asChild className="py-2 cursor-pointer focus:bg-muted/50">
                        <Link href="/admin" className="flex items-center">
                          <div className="mr-3 p-1.5 rounded-md bg-green-500/10 text-green-500">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                          <span>Quản trị hệ thống</span>
                          <Badge className="ml-2 bg-green-500/20 text-green-500 border-none text-[10px] py-0">Admin</Badge>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </div>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="py-2 cursor-pointer focus:bg-red-500/10 text-red-500 flex items-center mt-2" 
                    onClick={handleLogout}
                  >
                    <div className="mr-3 p-1.5 rounded-md bg-red-500/10 text-red-500">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div>
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300 rounded-full ring-2 ring-white/10 hover:ring-white/20 button-glow"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </Button>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Mobile Navigation */}
      {isMobile && (
        <>
          <nav className={`px-5 py-4 pt-[calc(env(safe-area-inset-top)+1rem)] flex items-center justify-between transition-all duration-500 w-full
            ${isScrolled 
              ? 'navbar-scrolled' 
              : 'navbar-gradient'}`}>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-gradient-to-r hover:from-primary/20 hover:to-secondary/20 hover:text-primary hover:shadow-lg transition-all duration-300 rounded-xl">
                  <Menu className="h-5 w-5 transition-transform duration-300 hover:scale-110" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80vw] max-w-xs border-r border-primary/30 bg-gradient-to-b from-card/95 via-primary/5 to-background/95 backdrop-blur-xl p-0 shadow-2xl ring-1 ring-primary/10">
                <SheetHeader className="p-5 border-b border-primary/20 bg-gradient-to-r from-primary/8 via-secondary/8 to-primary/8">
                  <SheetTitle className="flex justify-center">
                    <Logo size="small" />
                  </SheetTitle>
                </SheetHeader>
                
                <div className="py-3 px-2">
                  {user && (
                    <div className="flex items-center p-3 mb-2 border-b border-muted/10">
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
                  
                  <div className="space-y-1 p-2">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.id}>
                        <Link
                          href={link.path}
                          className={`flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-medium transition-all duration-300 group ${
                            location === link.path 
                              ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary shadow-lg border border-primary/30" 
                              : "hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:text-primary hover:shadow-md"
                          }`}
                        >
                          {link.icon}
                          {link.name}
                        </Link>
                      </SheetClose>
                    ))}
                    
                    {/* Filter links section */}
                    <div className="mt-4 pt-4 border-t border-muted/10">
                      <div className="px-3 py-2 text-sm text-muted-foreground font-medium">
                        Lọc phim theo:
                      </div>
                      {filterLinks.map((link) => (
                        <SheetClose asChild key={link.id}>
                          <Link
                            href={link.path}
                            className={`flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-medium transition-colors ${
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
                  
                  <div className="absolute bottom-0 left-0 right-0 border-t border-muted/10 p-4">
                    {user ? (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full gap-2" 
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </Button>
                    ) : (
                      <SheetClose asChild>
                        <Button 
                          className="w-full gap-2 bg-gradient-to-r from-primary to-secondary hover:shadow-md"
                          onClick={() => setShowAuthModal(true)}
                        >
                          <User className="h-4 w-4" />
                          Đăng nhập / Đăng ký
                        </Button>
                      </SheetClose>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            <Link href="/" className="flex-1 flex justify-center">
              <Logo size="small" variant="full" />
            </Link>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="p-2 text-foreground hover:text-primary rounded-full transition-colors"
                aria-label="Tìm kiếm"
              >
                <Search className="h-5 w-5" />
              </button>
              
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-gradient-to-r from-primary/80 to-secondary/80"
                  asChild
                >
                  <Link href="/profile">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-transparent text-white text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </Button>
              )}
            </div>
          </nav>
          
          {/* Mobile Search Overlay */}
          {showMobileSearch && (
            <div className="p-3 border-t border-primary/20 bg-gradient-to-r from-background/95 via-primary/5 to-background/95 backdrop-blur-xl">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Tìm kiếm phim..."
                  autoFocus
                  className="pl-10 pr-12 py-2 bg-gradient-to-r from-muted/70 to-muted/50 border-muted/50 text-foreground rounded-full focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-300 hover:bg-muted/80 focus:shadow-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 rounded-full p-1 hover:bg-muted transition-colors"
                  onClick={() => setShowMobileSearch(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </header>
  );
}
