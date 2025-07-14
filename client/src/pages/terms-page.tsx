import { ArrowLeft, FileText, Shield, AlertTriangle, Scale, Users, Monitor, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

export default function TermsPage() {
  const [, navigate] = useLocation();

  const sections = [
    {
      id: "chap-nhan",
      title: "Chấp nhận điều khoản",
      icon: Scale,
      content: [
        "Bằng việc truy cập và sử dụng Phim Xuyên Đêm, bạn đồng ý tuân thủ các điều khoản này",
        "Nếu không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng dịch vụ",
        "Chúng tôi có quyền thay đổi điều khoản bất kỳ lúc nào với thông báo trước",
        "Việc tiếp tục sử dụng sau khi có thay đổi đồng nghĩa với việc chấp nhận điều khoản mới"
      ]
    },
    {
      id: "dich-vu",
      title: "Mô tả dịch vụ",
      icon: Monitor,
      content: [
        "Phim Xuyên Đêm cung cấp dịch vụ xem phim trực tuyến miễn phí",
        "Nội dung phim được tổng hợp từ các nguồn công khai trên internet",
        "Chúng tôi không lưu trữ tệp phim trên server của mình",
        "Dịch vụ có thể thay đổi hoặc ngừng hoạt động mà không báo trước",
        "Chất lượng và tính khả dụng của nội dung có thể thay đổi"
      ]
    },
    {
      id: "tai-khoan",
      title: "Tài khoản người dùng",
      icon: Users,
      content: [
        "Bạn có trách nhiệm bảo mật thông tin đăng nhập của mình",
        "Không được chia sẻ tài khoản với người khác",
        "Thông báo ngay nếu phát hiện tài khoản bị xâm nhập",
        "Cung cấp thông tin chính xác khi đăng ký",
        "Chỉ tạo một tài khoản cho mỗi người dùng"
      ]
    },
    {
      id: "su-dung",
      title: "Quy tắc sử dụng",
      icon: Shield,
      content: [
        "Không được sử dụng dịch vụ cho mục đích thương mại",
        "Cấm tải xuống, sao chép hoặc phân phối nội dung",
        "Không được can thiệp vào hoạt động của hệ thống",
        "Cấm spam, gửi nội dung độc hại hoặc vi phạm pháp luật",
        "Tôn trọng quyền sở hữu trí tuệ của các tác phẩm",
        "Không được sử dụng bot hoặc công cụ tự động"
      ]
    },
    {
      id: "noi-dung",
      title: "Nội dung và bản quyền",
      icon: FileText,
      content: [
        "Tất cả nội dung phim thuộc quyền sở hữu của các nhà sản xuất",
        "Chúng tôi chỉ cung cấp liên kết đến các nguồn phim công khai",
        "Không chịu trách nhiệm về tính chính xác của thông tin phim",
        "Tôn trọng và tuân thủ các yêu cầu gỡ bỏ nội dung từ chủ sở hữu",
        "Người dùng có trách nhiệm tuân thủ luật bản quyền địa phương"
      ]
    },
    {
      id: "trach-nhiem",
      title: "Giới hạn trách nhiệm",
      icon: AlertTriangle,
      content: [
        "Dịch vụ được cung cấp 'như hiện tại' không có bảo đảm",
        "Không chịu trách nhiệm về thiệt hại trực tiếp hoặc gián tiếp",
        "Không đảm bảo dịch vụ hoạt động liên tục không gián đoạn",
        "Không chịu trách nhiệm về nội dung từ nguồn bên thứ ba",
        "Người dùng tự chịu rủi ro khi sử dụng dịch vụ"
      ]
    },
    {
      id: "vi-pham",
      title: "Xử lý vi phạm",
      icon: Crown,
      content: [
        "Cảnh báo lần đầu cho các vi phạm nhẹ",
        "Tạm khóa tài khoản 7-30 ngày tùy mức độ vi phạm",
        "Khóa vĩnh viễn tài khoản cho vi phạm nghiêm trọng",
        "Xóa ngay lập tức nội dung vi phạm bản quyền",
        "Báo cáo cho cơ quan chức năng nếu có hoạt động bất hợp pháp"
      ]
    },
    {
      id: "thay-doi",
      title: "Thay đổi điều khoản",
      icon: FileText,
      content: [
        "Chúng tôi có quyền sửa đổi điều khoản này bất kỳ lúc nào",
        "Thông báo về các thay đổi quan trọng qua website",
        "Thay đổi có hiệu lực sau 7 ngày kể từ khi thông báo",
        "Khuyến khích kiểm tra điều khoản định kỳ",
        "Liên hệ nếu có thắc mắc về thay đổi"
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
            <h1 className="text-xl font-bold text-white">Điều khoản sử dụng</h1>
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
                <Scale className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Điều khoản sử dụng dịch vụ
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  Những điều khoản này quy định việc sử dụng website Phim Xuyên Đêm. 
                  Vui lòng đọc kỹ trước khi sử dụng dịch vụ của chúng tôi.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    Hiệu lực ngay
                  </Badge>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                    Áp dụng toàn cầu
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    Có thể thay đổi
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Sections */}
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

        {/* Important Notice */}
        <Card className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-xl border border-red-500/20">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Lưu ý quan trọng
                </h3>
                <p className="text-white/80 leading-relaxed mb-4">
                  Phim Xuyên Đêm là dịch vụ giải trí miễn phí. Chúng tôi không lưu trữ 
                  nội dung phim trên server mà chỉ cung cấp liên kết đến các nguồn công khai. 
                  Người dùng có trách nhiệm tuân thủ luật pháp địa phương về bản quyền.
                </p>
                <div className="space-y-2 text-white/70">
                  <p><strong>Email hỗ trợ:</strong> support@phimxuyendem.com</p>
                  <p><strong>Telegram:</strong> @phimxuyendem</p>
                  <p><strong>Thời gian phản hồi:</strong> Trong vòng 48 giờ</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <div className="flex flex-wrap gap-4 justify-center pt-4">
          <Button 
            onClick={() => navigate('/privacy')}
            variant="outline"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            Chính sách bảo mật
          </Button>
          <Button 
            onClick={() => navigate('/faq')}
            variant="outline"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            Câu hỏi thường gặp
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