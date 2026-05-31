# 🐛 昆蟲觀察記錄表系統 (Insect Observation Report System)

這是一個為國小學生（以 **四年級愛班 郭宥宜** 養殖蠶寶寶為背景）精心設計的**互動式昆蟲觀察記錄表與 A4 物理列印排版系統**。

本系統採用最新的前端與後端架構，支持線上填寫日記、手寫繪圖、照片上傳、生長曲線分析，並能**像素級還原物理紙本作業 A4 PDF 排版**，讓線上的學習記錄能無縫輸出成漂亮的紙本作業繳交！

---

## ✨ 核心特色功能 (Key Features)

1. **🏠 壹、飼養準備與生態適應**
   * 線上填寫飼養基本資訊（年級、班級、座號、姓名、昆蟲名稱、食物及放置地點）。
   * **適應環境與生態影響評估**：引導孩子用童趣的語氣寫下昆蟲適應環境的構造、行為，以及人類開發對生態的利弊與改善方案。

2. **🎨 線上畫圖板與照片上傳雙抓手**
   * **HTML5 Canvas 畫圖板**：專為孩子設計的線上畫圖工具，支援自訂畫筆大小、多色調色盤、橡皮擦以及無限步驟的復原（Undo）歷史。
   * **照片上傳**：可選擇直接上傳拍好的蠶寶寶與飼養盒實體相片，無縫嵌入報告中。

3. **📅 貳、成長日記與漸進式時間軸 (Timeline)**
   * 動態 Timeline 展示蠶寶寶從**卵期（5/8）**、**孵化（5/16 蟻蠶）**、**蛻皮眠期**到 **3齡蠶幼蟲（5/30）** 的成長歷程。
   * 支援自由新增、編輯與刪除每日觀察記錄（含日期、天數、體長、體色、食量與發現問題解決對策）。

4. **📈 生長曲線科學分析圖表**
   * 整合 **Chart.js** 數據視覺化，自動根據各觀測點的「體長 (mm)」與「飼養天數」繪製連續的生長趨勢曲線，培養孩子的科學數據分析思維。

5. **🖨️ 像素級 A4 物理紙本列印引擎**
   * 內建專用 `@media print` 樣式引擎。在瀏覽器中點擊「匯出與列印 (A4 PDF)」即可將網頁完美隱藏，僅輸出符合學校作業規格的實體紙本。
   * **標楷體 (BiauKai) 全局渲染**：強制使用學校作業規範的標楷體字型。
   * **學號與標題放大至 16pt**，字型大小完全符合傳統排版。
   * **無縫接續排版**：徹底清除所有分頁冗餘空白，觀察記錄表格緊隨在準備工作下方，緊湊、流暢且美觀。
   * **圖片自動貼齊黑邊格線**：相片或手繪圖在列印時會完美填滿方格並貼齊邊緣，沒有任何白邊。

6. **💾 打字防丟失自動儲存系統**
   * 新增或編輯記錄時，每次按鍵都會即時自動備份至瀏覽器的 `localStorage`，防止因瀏覽器不小心關閉或重新整理而導致數小時心血白費。

7. **🛡️ 雙軌資料防護防線 (Dual-Write Backup)**
   * 後端資料庫在讀寫 `src/data/db.json` 的同時，會自動同步鏡像備份至 `src/data/db.backup.json`，實現雙軌容災，徹底杜絕數據丟失。

---

## 🛠️ 技術棧 (Technology Stack)

* **前端框架 (Frontend)**: React 19 + Next.js 16 (App Router)
* **後端架構 (Backend)**: Next.js Route Handlers (API Routes) in Native TypeScript
* **程式語言 (Language)**: TypeScript (前端與後端 100% Native TS)
* **樣式系統 (CSS)**: Vanilla CSS (原生 CSS，無載入 Tailwind，極致掌控與載入速度)
* **資料庫 (Database)**: 輕量化伺服器端 JSON 資料庫 (`db.json`)，支持永久保存變更
* **版本控制 (VCS)**: Git 完整管理與追蹤

---

## 📂 專案結構說明 (Project Directory)

```
insect-observation-report/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── records/route.ts  # 觀察記錄增刪查改 API
│   │   │   ├── report/route.ts   # 學生元數據讀寫 API
│   │   │   └── upload/route.ts   # 畫布與檔案上傳 API
│   │   ├── globals.css           # 全局 Vanilla CSS 樣式與列印引擎
│   │   ├── layout.tsx            # Next.js 頁面骨架
│   │   └── page.tsx              # 儀表板、時間軸與列印模板
│   ├── components/
│   │   ├── Sketchpad.tsx         # HTML5 Canvas 畫圖板組件
│   │   └── GrowthChart.tsx       # Chart.js 生長曲線組件
│   ├── data/
│   │   ├── db.json               # 主資料庫 (主存儲)
│   │   └── db.backup.json        # 自動雙軌鏡像備份資料庫
│   └── lib/
│       ├── db.ts                 # 資料庫異步讀寫與雙軌備份模組
│       └── types.ts              # TypeScript 全局類型合約定義
├── public/
│   └── uploads/                  # 相片與手繪 base64 保存目錄
├── package.json
└── tsconfig.json
```

---

## 🚀 快速開始 (Quick Start)

### 1. 安裝依賴
在專案根目錄下執行：
```bash
npm install
```

### 2. 啟動開發伺服器
運行本地 Next.js 伺服器：
```bash
npm run dev
```

### 3. 造訪網頁
打開瀏覽器，造訪 **`http://localhost:3000`**。
您可以開始在頁面上填寫觀察記錄、利用畫圖板為蠶寶寶畫一個新家、觀察體長增長圖表，或隨時按下 `Cmd + P` (Mac) 或 `Ctrl + P` (Windows) 預覽極致精美的 A4 作業列印排版。

---

## 📄 授權條款 (License)

本專案採用 [MIT License](LICENSE) 授權條款開放使用。
