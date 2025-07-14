import { ArrowLeft, Shield, Eye, Lock, Database, Settings, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

export default function PrivacyPage() {
  const [, navigate] = useLocation();

  const sections = [
    {
      id: "thu-thap",
      title: "Thông tin chúng tôi thu thập",
      icon: Database,
      content: [
        "Thông tin tài khoản: Tên người dùng, email, mật khẩu được mã hóa",
        "Lịch sử xem phim: Phim đã xem, thời gian xem, tiến độ xem",
        "Danh sách yêu thích: Các phim bạn đã thêm vào danh sách yêu thích",
        "Thông tin kỹ thuật: Địa chỉ IP, loại trình duyệt, thiết bị truy cập",
        "Cookies và dữ liệu phiên: Để duy trì phiên đăng nhập và cải thiện trải nghiệm"
      ]
    },
    {
      id: "su-dung",
      title: "Cách chúng tôi sử dụng thông tin",
      icon: Settings,
      content: [
        "Cung cấp dịch vụ xem phim và quản lý tài khoản",
        "Cá nhân hóa nội dung và đề xuất phim phù hợp",
        "Cải thiện chất lượng dịch vụ và trải nghiệm người dùng",
        "Bảo mật tài khoản và phát hiện hoạt động bất thường",
        "Liên hệ hỗ trợ kỹ thuật khi cần thiết",
        "Thống kê sử dụng để phát triển tính năng mới"
      ]
    },
    {
      id: "chia-se",
      title: "Chia sẻ thông tin với bên thứ ba",
      icon: Users,
      content: [
        "Chúng tôi KHÔNG bán thông tin cá nhân cho bên thứ ba",
        "Chỉ chia sẻ khi có yêu cầu pháp lý từ cơ quan có thẩm quyền",
        "Sử dụng dịch vụ phân tích ẩn danh để cải thiện website",
        "Đối tác cung cấp nội dung phim (tuân thủ thỏa thuận bảo mật)",
        "Nhà cung cấp dịch vụ hosting và bảo mật dữ liệu"
      ]
    },
    {
      id: "bao-mat",
      title: "Bảo mật dữ liệu",
      icon: Lock,
      content: [
        "Mã hóa mật khẩu bằng thuật toán bcrypt",
        "Sử dụng HTTPS cho tất cả kết nối",
        "Lưu trữ dữ liệu trên server bảo mật với PostgreSQL",
        "Sao lưu dữ liệu định kỳ và mã hóa",
        "Giám sát bảo mật 24/7 để phát hiện xâm nhập",
        "Cập nhật bảo mật thường xuyên"
      ]
    },
    {
      id: "quyen-nguoi-dung",
      title: "Quyền của người dùng",
      icon: Eye,
      content: [
        "Quyền truy cập: Xem thông tin cá nhân chúng tôi lưu trữ",
        "Quyền chỉnh sửa: Cập nhật thông tin tài khoản bất kỳ lúc nào",
        "Quyền xóa: Yêu cầu xóa tài khoản và toàn bộ dữ liệu",
        "Quyền hạn chế: Yêu cầu ngừng xử lý một số dữ liệu",
        "Quyền khiếu nại: Báo cáo vi phạm quyền riêng tư",
        "Quyền rút lại đồng ý: Hủy đồng ý xử lý dữ liệu bất kỳ lúc nào"
      ]
    },
    {
      id: "cookies",
      title: "Chính sách Cookies",
      icon: Settings,
      content: [
        "Cookies cần thiết: Duy trì phiên đăng nhập và bảo mật",
        "Cookies tùy chọn: Ghi nhớ cài đặt và sở thích người dùng",
        "Cookies phân tích: Thu thập thống kê sử dụng ẩn danh",
        "Bạn có thể quản lý cookies trong cài đặt trình duyệt",
        "Vô hiệu hóa cookies có thể ảnh hưởng chức năng website"
      ]
    },
    {
      id: "tre-em",
      title: "Bảo vệ trẻ em",
      icon: Shield,
      content: [
        "Dịch vụ dành cho người từ 13 tuổi trở lên",
        "Không cố ý thu thập thông tin trẻ em dưới 13 tuổi",
        "Cha mẹ có thể yêu cầu xóa thông tin con em mình",
        "Có tính năng kiểm soát nội dung theo độ tuổi",
        "Khuyến khích cha mẹ giám sát hoạt động trực tuyến của con em"
      ]
    },
    {
      id: "luu-tru",
      title: "Thời gian lưu trữ",
      icon: Database,
      content: [
        "Thông tin tài khoản: Cho đến khi người dùng yêu cầu xóa",
        "Lịch sử xem phim: 2 năm kể từ lần truy cập cuối",
        "Logs hệ thống: 30 ngày cho mục đích bảo mật",
        "Dữ liệu phân tích: 12 tháng (dạng ẩn danh)",
        "Backup dữ liệu: 90 ngày cho khôi phục khẩn cấp"
      ]
    }
  ];

  const lastUpdated = "01/12/2024";

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
            <h1 className="text-xl font-bold text-white">Chính sách bảo mật</h1>
            <p className="text-sm text-white/70">Cập nhật lần cuối: {lastUpdated}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-8">
        {/* Introduction */}
        <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-xl border border-white/10">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/20 rounded-full">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Cam kết bảo vệ quyền riêng tư
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  Phim Xuyên Đêm cam kết bảo vệ thông tin cá nhân và quyền riêng tư của người dùng. 
                  Chính sách này giải thích cách chúng tôi thu thập, sử dụng, bảo vệ và chia sẻ thông tin của bạn.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                    Tuân thủ GDPR
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    Mã hóa dữ liệu
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    Không bán dữ liệu
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} className="bg-black/40 backdrop-blur-xl border border-white/10">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-white">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-lg">{section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-3">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3 text-white/80">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Information */}
        <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl border border-orange-500/20">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-500/20 rounded-full">
                <AlertTriangle className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Liên hệ về quyền riêng tư
                </h3>
                <p className="text-white/80 leading-relaxed mb-4">
                  Nếu bạn có câu hỏi về chính sách bảo mật hoặc muốn thực hiện quyền của mình, 
                  vui lòng liên hệ với chúng tôi:
                </p>
                <div className="space-y-2 text-white/70">
                  <p><strong>Email:</strong> privacy@phimxuyendem.com</p>
                  <p><strong>Telegram:</strong> @phimxuyendem</p>
                  <p><strong>Thời gian phản hồi:</strong> Trong vòng 72 giờ</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Thay đổi chính sách
            </h3>
            <p className="text-white/80 leading-relaxed mb-4">
              Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Khi có thay đổi quan trọng, 
              chúng tôi sẽ thông báo qua:
            </p>
            <ul className="space-y-2 text-white/70">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                Thông báo trên website
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                Email đến người dùng đã đăng ký
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                Cập nhật ngày sửa đổi cuối cùng
              </li>
            </ul>
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
            onClick={() => navigate('/contact')}
            variant="outline"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            Liên hệ
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