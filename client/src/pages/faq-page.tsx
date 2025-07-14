
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  Search,
  MessageCircle,
  Shield,
  Monitor,
  Download,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'Trang web có miễn phí không?',
    answer: 'Có, Phim Xuyên Đêm hoàn toàn miễn phí. Bạn có thể xem phim không giới hạn mà không cần thanh toán bất kỳ khoản phí nào.',
    category: 'Chung',
    tags: ['miễn phí', 'thanh toán']
  },
  {
    id: '2',
    question: 'Làm thế nào để đăng ký tài khoản?',
    answer: 'Bạn có thể đăng ký tài khoản bằng cách nhấp vào nút "Đăng nhập" ở góc phải trên cùng, sau đó chọn "Đăng ký". Chỉ cần nhập email, tên người dùng và mật khẩu để tạo tài khoản.',
    category: 'Tài khoản',
    tags: ['đăng ký', 'tài khoản', 'email']
  },
  {
    id: '3',
    question: 'Tại sao video không phát được?',
    answer: 'Có một số nguyên nhân: kiểm tra kết nối internet, thử tải lại trang, xóa cache trình duyệt, hoặc thử trình duyệt khác. Nếu vẫn không được, hãy báo cáo cho chúng tôi.',
    category: 'Kỹ thuật',
    tags: ['video', 'phát', 'lỗi', 'internet']
  },
  {
    id: '4',
    question: 'Làm thế nào để thêm phim vào danh sách yêu thích?',
    answer: 'Khi xem chi tiết phim hoặc đang xem phim, nhấp vào biểu tượng trái tim (♥) để thêm vào danh sách yêu thích. Bạn có thể xem lại danh sách này trong trang cá nhân.',
    category: 'Tính năng',
    tags: ['yêu thích', 'danh sách', 'trái tim']
  },
  {
    id: '5',
    question: 'Có thể xem phim offline không?',
    answer: 'Hiện tại chưa hỗ trợ tải phim để xem offline. Tất cả phim đều cần kết nối internet để xem. Chúng tôi đang nghiên cứu tính năng này cho tương lai.',
    category: 'Tính năng',
    tags: ['offline', 'tải xuống', 'internet']
  },
  {
    id: '6',
    question: 'Làm thế nào để báo cáo phim bị lỗi?',
    answer: 'Bạn có thể liên hệ với chúng tôi qua Telegram @phimxuyendem hoặc sử dụng tính năng bình luận dưới phim để báo cáo các vấn đề kỹ thuật.',
    category: 'Hỗ trợ',
    tags: ['báo cáo', 'lỗi', 'telegram', 'hỗ trợ']
  },
  {
    id: '7',
    question: 'Phim có phụ đề tiếng Việt không?',
    answer: 'Phần lớn phim đều có phụ đề tiếng Việt hoặc được lồng tiếng. Chúng tôi ưu tiên các phim có phụ đề/lồng tiếng chất lượng cao.',
    category: 'Nội dung',
    tags: ['phụ đề', 'tiếng việt', 'lồng tiếng']
  },
  {
    id: '8',
    question: 'Tần suất cập nhật phim mới như thế nào?',
    answer: 'Chúng tôi cập nhật phim mới hàng ngày, bao gồm phim lẻ mới ra mắt và các tập phim bộ mới nhất. Thường xuyên kiểm tra trang chủ để không bỏ lỡ phim hay.',
    category: 'Nội dung',
    tags: ['cập nhật', 'phim mới', 'hàng ngày']
  },
  {
    id: '9',
    question: 'Tại sao không thể đăng nhập?',
    answer: 'Kiểm tra lại email/tên đăng nhập và mật khẩu. Nếu quên mật khẩu, sử dụng tính năng "Quên mật khẩu". Đảm bảo không có lỗi chính tả và caps lock đã tắt.',
    category: 'Tài khoản',
    tags: ['đăng nhập', 'mật khẩu', 'quên mật khẩu']
  },
  {
    id: '10',
    question: 'Có thể yêu cầu thêm phim không?',
    answer: 'Có, bạn có thể gửi yêu cầu phim qua Telegram @phimxuyendem. Chúng tôi sẽ cố gắng tìm và cập nhật những phim được yêu cầu nhiều.',
    category: 'Nội dung',
    tags: ['yêu cầu phim', 'telegram', 'thêm phim']
  },
  {
    id: '11',
    question: 'Làm thế nào để cài đặt ứng dụng trên điện thoại?',
    answer: 'Với iPhone/iPad: Mở Safari, truy cập trang web, nhấn nút Share, chọn "Add to Home Screen". Với Android: Mở Chrome, truy cập trang web, nhấn menu (...), chọn "Add to Home screen".',
    category: 'Kỹ thuật',
    tags: ['ứng dụng', 'điện thoại', 'cài đặt', 'PWA']
  },
  {
    id: '12',
    question: 'Chất lượng video như thế nào?',
    answer: 'Chúng tôi cung cấp nhiều chất lượng video từ 480p đến 1080p tùy thuộc vào nguồn phim. Chất lượng sẽ tự động điều chỉnh theo tốc độ internet của bạn.',
    category: 'Kỹ thuật',
    tags: ['chất lượng', 'video', '1080p', '480p']
  }
];

const categories = ['Tất cả', 'Chung', 'Tài khoản', 'Kỹ thuật', 'Tính năng', 'Nội dung', 'Hỗ trợ'];

const categoryIcons = {
  'Chung': HelpCircle,
  'Tài khoản': Shield,
  'Kỹ thuật': Monitor,
  'Tính năng': Download,
  'Nội dung': MessageCircle,
  'Hỗ trợ': MessageCircle
};

export default function FAQPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

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
            <h1 className="text-xl font-bold text-white">Câu hỏi thường gặp</h1>
            <p className="text-sm text-white/70">Tìm câu trả lời cho các thắc mắc của bạn</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-8">
        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Search */}
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm câu hỏi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = categoryIcons[category as keyof typeof categoryIcons];
                  return (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={`${
                        selectedCategory === category
                          ? 'bg-primary hover:bg-primary/90'
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      {Icon && <Icon className="h-3 w-3 mr-1" />}
                      {category}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ Items */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {filteredFAQ.length === 0 ? (
            <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
              <CardContent className="p-12 text-center">
                <HelpCircle className="h-16 w-16 text-white/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Không tìm thấy câu hỏi nào
                </h3>
                <p className="text-white/60">
                  Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredFAQ.map((item) => {
              const isExpanded = expandedItems.has(item.id);
              const Icon = categoryIcons[item.category as keyof typeof categoryIcons] || HelpCircle;
              
              return (
                <motion.div key={item.id} variants={itemVariants}>
                  <Card className="bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-black/50 transition-colors">
                    <CardContent className="p-0">
                      <Button
                        variant="ghost"
                        onClick={() => toggleExpanded(item.id)}
                        className="w-full p-6 h-auto justify-between hover:bg-white/5 rounded-lg"
                      >
                        <div className="flex items-start gap-4 text-left">
                          <div className="p-2 rounded-lg bg-primary/20 mt-1">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-medium text-base mb-2">
                              {item.question}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-white/10 text-white/70 text-xs">
                                {item.category}
                              </Badge>
                              {item.tags.slice(0, 2).map((tag) => (
                                <Badge 
                                  key={tag} 
                                  variant="outline" 
                                  className="border-white/20 text-white/60 text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-white/50 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-white/50 flex-shrink-0" />
                        )}
                      </Button>
                      
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Separator className="bg-white/10" />
                          <div className="p-6 pt-4">
                            <p className="text-white/80 leading-relaxed">
                              {item.answer}
                            </p>
                            {item.tags.length > 2 && (
                              <div className="flex items-center gap-2 mt-4">
                                <span className="text-white/50 text-sm">Tags:</span>
                                {item.tags.slice(2).map((tag) => (
                                  <Badge 
                                    key={tag} 
                                    variant="outline" 
                                    className="border-white/20 text-white/60 text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-xl border border-white/10">
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Không tìm thấy câu trả lời?
              </h3>
              <p className="text-white/70 mb-6">
                Liên hệ với chúng tôi để được hỗ trợ trực tiếp
              </p>
              <Button
                onClick={() => window.open('https://t.me/phimxuyendem', '_blank')}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4 mr-2" />
                Liên hệ qua Telegram
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
