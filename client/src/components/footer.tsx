import { Logo } from "./logo";
import { Link } from "wouter";
import {
  Send,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  LucideIcon,
} from "lucide-react";

const socialLinks: { icon: LucideIcon; href: string; label: string }[] = [
  { icon: Send, href: "https://t.me/phimxuyendem", label: "Gửi phản hồi" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "Youtube" },
  { icon: Instagram, href: "#", label: "Instagram" },
];

const footerLinks: { label: string; href: string }[] = [
  { label: "Hỏi-Đáp", href: "/faq" },
  { label: "Chính sách bảo mật", href: "/privacy" },
  { label: "Điều khoản sử dụng", href: "/terms" },
  { label: "Giới thiệu", href: "/about" },
  { label: "Hướng dẫn thêm App iOS", href: "/huong-dan-them-app" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-t from-background to-background/90 pt-12 pb-8 px-6 md:px-10 text-sm text-muted-foreground">
      <div className="max-w-7xl mx-auto">

        {/* Logo + slogan */}
        <div className="text-center mb-10">
          <Logo size="large" />
          <p className="mt-2 text-base text-muted-foreground">Phim Hay Không Ngủ</p>
        </div>

        {/* Social icons */}
        <div className="flex justify-center gap-5 mb-8">
          {socialLinks.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full border border-gray-700 bg-gray-800 hover:bg-primary flex items-center justify-center text-white transition-transform duration-300 hover:scale-110 shadow-sm"
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>

        {/* Footer links */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-6">
          {footerLinks.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="hover:text-primary hover:underline underline-offset-4 transition duration-200"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Mô tả & copyright */}
        <div className="max-w-3xl mx-auto text-center leading-relaxed px-4 text-muted-foreground">
          <p className="mb-3">
            <strong className="text-foreground">PhimXuyenDem – Phim Hay Không Ngủ</strong>: Nền tảng xem phim trực tuyến chất lượng cao miễn phí. Vietsub, thuyết minh, HD đến 4K. Đa dạng thể loại, cập nhật nhanh, nội dung chất.
          </p>
          <p className="text-xs opacity-75">
            © {year} <span className="text-gradient-blue-purple font-bold">TYNO</span>. Tất cả các quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}