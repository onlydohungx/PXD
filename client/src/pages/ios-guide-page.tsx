import { ArrowLeft, Smartphone, Plus, Home, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function IosGuidePage() {
  const [, navigate] = useLocation();

  const steps = [
    {
      title: "Bước 1: Mở Safari",
      description: "Truy cập phimxuyendem.com bằng trình duyệt Safari trên iPhone/iPad",
      image: "/images/ios-guide-1.jpeg",
      note: "Lưu ý: Chỉ Safari mới hỗ trợ tính năng Add to Home Screen"
    },
    {
      title: "Bước 2: Nhấn nút Share", 
      description: "Nhấn vào biểu tượng Share (mũi tên hướng lên) ở thanh công cụ dưới cùng",
      image: "/images/ios-guide-2.jpeg",
      note: "Biểu tượng Share nằm ở giữa thanh công cụ Safari"
    },
    {
      title: "Bước 3: Chọn Add to Home Screen",
      description: "Cuộn xuống và tìm tùy chọn 'Add to Home Screen' (Thêm vào Màn hình chính)",
      image: "/images/ios-guide-3.jpeg", 
      note: "Nếu không thấy, hãy cuộn xuống trong danh sách các tùy chọn"
    },
    {
      title: "Bước 4: Xác nhận thêm",
      description: "Nhập tên app (có thể giữ nguyên) và nhấn 'Add' để hoàn tất",
      image: "/images/ios-guide-4.jpeg",
      note: "App sẽ xuất hiện trên màn hình chính như một ứng dụng thật"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Hướng dẫn thêm App</h1>
            <p className="text-sm text-white/70">Thêm Phim Xuyên Đêm vào màn hình chính iOS</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Intro Section */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/20 rounded-full">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Trải nghiệm như App native
                </h2>
                <p className="text-white/80 leading-relaxed">
                  Thêm Phim Xuyên Đêm vào màn hình chính để truy cập nhanh chóng như một ứng dụng thật. 
                  Hoàn toàn miễn phí và không cần tải từ App Store!
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                    <Star className="h-3 w-3 mr-1" />
                    Không quảng cáo
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    <Plus className="h-3 w-3 mr-1" />
                    Miễn phí
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    <Home className="h-3 w-3 mr-1" />
                    Truy cập nhanh
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => (
            <Card key={index} className="bg-card/50 backdrop-blur border-white/10 overflow-hidden">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Content */}
                  <div className="p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    </div>
                    <p className="text-white/80 mb-4 leading-relaxed">
                      {step.description}
                    </p>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <p className="text-yellow-300 text-sm flex items-start gap-2">
                        <span className="text-yellow-400 font-semibold">💡</span>
                        {step.note}
                      </p>
                    </div>
                  </div>
                  
                  {/* Image */}
                  <div className="relative">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover md:object-contain bg-gray-900"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent md:hidden"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Success Section */}
        <Card className="mt-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Hoàn thành!</h3>
            <p className="text-white/80 mb-4">
              Bây giờ bạn có thể truy cập Phim Xuyên Đêm trực tiếp từ màn hình chính, 
              giống như một ứng dụng thật sự.
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              <Home className="h-4 w-4 mr-2" />
              Về trang chủ
            </Button>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="mt-8 bg-card/30 backdrop-blur border-white/10">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Câu hỏi thường gặp</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-white mb-1">Tại sao phải dùng Safari?</h4>
                <p className="text-white/70 text-sm">
                  Chỉ Safari mới hỗ trợ tính năng "Add to Home Screen" của iOS. 
                  Các trình duyệt khác như Chrome không có tính năng này.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">App có hoạt động offline không?</h4>
                <p className="text-white/70 text-sm">
                  App cần kết nối internet để xem phim, nhưng giao diện và một số tính năng 
                  cơ bản vẫn hoạt động khi offline.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Làm sao để xóa app?</h4>
                <p className="text-white/70 text-sm">
                  Giữ lâu icon trên màn hình chính và chọn "Remove App" giống như xóa app thường.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
