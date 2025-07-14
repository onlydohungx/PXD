import { ArrowLeft, Heart, Users, Zap, Shield, Globe, Star, Smartphone, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Logo } from "@/components/logo";

export default function AboutPage() {
  const [, navigate] = useLocation();

  const features = [
    {
      icon: Film,
      title: "Kho phim khổng lồ",
      description: "Hàng nghìn bộ phim và series từ khắp nơi trên thế giới"
    },
    {
      icon: Zap,
      title: "Streaming nhanh",
      description: "Công nghệ streaming tiên tiến, tải nhanh không lag"
    },
    {
      icon: Shield,
      title: "An toàn & bảo mật",
      description: "Duyệt web an toàn, không virus, không quảng cáo độc hại"
    },
    {
      icon: Smartphone,
      title: "Đa nền tảng",
      description: "Xem mọi lúc, mọi nơi trên điện thoại, máy tính, tablet"
    },
    {
      icon: Globe,
      title: "Phụ đề đa ngôn ngữ",
      description: "Phụ đề tiếng Việt chất lượng cao, lồng tiếng chuyên nghiệp"
    },
    {
      icon: Heart,
      title: "Hoàn toàn miễn phí",
      description: "Không phí ẩn, không đăng ký bắt buộc, không quảng cáo phiền hà"
    }
  ];

  const stats = [
    { value: "50,000+", label: "Bộ phim" },
    { value: "500,000+", label: "Người dùng" },
    { value: "24/7", label: "Hoạt động" },
    { value: "99.9%", label: "Uptime" }
  ];

  const team = [
    {
      name: "Đội ngũ phát triển",
      role: "Lập trình & bảo trì hệ thống",
      description: "Đảm bảo website hoạt động ổn định, nhanh chóng và an toàn"
    },
    {
      name: "Đội ngũ nội dung",
      role: "Tuyển chọn & cập nhật phim",
      description: "Cập nhật phim mới hàng ngày, kiểm tra chất lượng nội dung"
    },
    {
      name: "Đội ngũ hỗ trợ",
      role: "Chăm sóc khách hàng",
      description: "Hỗ trợ người dùng 24/7, giải đáp thắc mắc và xử lý phản hồi"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-4 p-4 max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Giới thiệu</h1>
            <p className="text-sm text-white/70">Về Phim Xuyên Đêm</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-12">
        {/* Hero Section */}
        <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-xl border border-white/10 overflow-hidden">
          <CardContent className="p-12 text-center">
            <div className="mb-6">
              <Logo size="large" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-6">
              Phim Hay Không Ngủ
            </h2>
            <p className="text-xl text-white/80 leading-relaxed mb-8 max-w-4xl mx-auto">
              Phim Xuyên Đêm là nền tảng xem phim trực tuyến hàng đầu Việt Nam, 
              mang đến cho bạn những bộ phim chất lượng cao với trải nghiệm xem tuyệt vời nhất.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 text-sm px-4 py-2">
                <Star className="h-4 w-4 mr-1" />
                Miễn phí 100%
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-sm px-4 py-2">
                <Shield className="h-4 w-4 mr-1" />
                An toàn & bảo mật
              </Badge>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-sm px-4 py-2">
                <Zap className="h-4 w-4 mr-1" />
                Tốc độ cao
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-black/40 backdrop-blur-xl border border-white/10">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-white/70 font-medium">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Tại sao chọn Phim Xuyên Đêm?
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-black/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/20 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {feature.title}
                        </h4>
                        <p className="text-white/70 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Mission */}
        <Card className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-xl border border-indigo-500/20">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Sứ mệnh của chúng tôi
            </h3>
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-lg text-white/80 leading-relaxed mb-6">
                Chúng tôi tin rằng giải trí chất lượng cao phải được tiếp cận dễ dàng và miễn phí. 
                Sứ mệnh của Phim Xuyên Đêm là mang đến những trải nghiệm xem phim tuyệt vời nhất 
                cho mọi người, mọi lúc, mọi nơi.
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Chất lượng</h4>
                  <p className="text-white/70 text-sm">
                    Cung cấp nội dung chất lượng cao với hình ảnh sắc nét, âm thanh trong trẻo
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Tiện lợi</h4>
                  <p className="text-white/70 text-sm">
                    Giao diện thân thiện, dễ sử dụng, tương thích mọi thiết bị
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Cộng đồng</h4>
                  <p className="text-white/70 text-sm">
                    Xây dựng cộng đồng yêu phim, chia sẻ đam mê điện ảnh
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-white text-center">
            Đội ngũ phát triển
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <Card key={index} className="bg-black/40 backdrop-blur-xl border border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{member.name}</CardTitle>
                  <p className="text-primary font-medium">{member.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70 leading-relaxed">
                    {member.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact */}
        <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-xl border border-green-500/20">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">
              Kết nối với chúng tôi
            </h3>
            <p className="text-white/80 leading-relaxed mb-6 max-w-2xl mx-auto">
              Chúng tôi luôn lắng nghe ý kiến phản hồi từ người dùng để cải thiện dịch vụ. 
              Hãy chia sẻ trải nghiệm và góp ý của bạn!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => window.open('https://t.me/phimxuyendem', '_blank')}
                className="bg-primary hover:bg-primary/90"
              >
                Telegram Community
              </Button>
              <Button 
                onClick={() => navigate('/faq')}
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                Câu hỏi thường gặp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <div className="flex flex-wrap gap-4 justify-center pt-4">
          <Button 
            onClick={() => navigate('/terms')}
            variant="outline"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            Điều khoản sử dụng
          </Button>
          <Button 
            onClick={() => navigate('/privacy')}
            variant="outline"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            Chính sách bảo mật
          </Button>
          <Button 
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}