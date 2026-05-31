import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "昆蟲觀察記錄表 - 蠶寶寶的成長與生活記錄",
  description: "互動式中小學昆蟲觀察學習平台。支援觀察日誌新增、HTML5 線上畫圖板、體長增長曲線圖表分析，並提供符合教育局規範之 A4 紙本/PDF 匯出格式。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}

