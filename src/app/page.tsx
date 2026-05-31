'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Calendar, 
  TrendingUp, 
  Leaf, 
  PenTool, 
  Printer, 
  Plus, 
  Edit2, 
  Trash2, 
  Sparkles,
  Save, 
  Upload,
  BookOpen,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Loader2,
  X,
  Palette,
  Sun,
  Moon
} from 'lucide-react';

import { ReportMetadata, ObservationRecord } from '@/lib/types';
import Sketchpad from '@/components/Sketchpad';
import GrowthChart from '@/components/GrowthChart';

export default function HomeDashboard() {
  // State variables
  const [metadata, setMetadata] = useState<ReportMetadata | null>(null);
  const [records, setRecords] = useState<ObservationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'timeline' | 'chart' | 'eco' | 'reflection'>('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  
  // Modal / Dialog States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<ObservationRecord> | null>(null);
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  
  // Sketchpad specific states for "Breeding House"
  const [isHouseSketchpadOpen, setIsHouseSketchpadOpen] = useState(false);
  // Sketchpad specific states for active observation record
  const [isRecordSketchpadOpen, setIsRecordSketchpadOpen] = useState(false);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  const houseFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize theme and fetch data
  useEffect(() => {
    // Media prefers color scheme
    const darkModePref = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const localTheme = localStorage.getItem('theme');
    const isDark = localTheme === 'dark' || (!localTheme && darkModePref);
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);

    // Fetch API Data
    async function initFetch() {
      try {
        const [metaRes, recordsRes] = await Promise.all([
          fetch('/api/report'),
          fetch('/api/records')
        ]);
        
        if (metaRes.ok && recordsRes.ok) {
          const metaData = await metaRes.json();
          const recordsData = await recordsRes.json();
          setMetadata(metaData);
          setRecords(recordsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initFetch();
  }, []);

  // Theme Toggler
  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');
  };

  // Save Report Metadata to Server
  const saveMetadata = async (updatedMeta: ReportMetadata) => {
    setIsSavingMeta(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMeta),
      });
      if (res.ok) {
        const data = await res.json();
        setMetadata(data.metadata);
      }
    } catch (error) {
      console.error('Error saving metadata:', error);
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!metadata) return;
    const { name, value } = e.target;
    
    // Handle nested objects
    if (name.startsWith('adaptation.')) {
      const field = name.split('.')[1];
      const updated = {
        ...metadata,
        adaptation: {
          ...metadata.adaptation,
          [field]: value
        }
      };
      setMetadata(updated);
      saveMetadata(updated);
    } else if (name.startsWith('humanImpact.')) {
      const field = name.split('.')[1];
      const updated = {
        ...metadata,
        humanImpact: {
          ...metadata.humanImpact,
          [field]: value
        }
      };
      setMetadata(updated);
      saveMetadata(updated);
    } else {
      const updated = {
        ...metadata,
        [name]: value
      };
      setMetadata(updated);
      saveMetadata(updated);
    }
  };

  // Handle Metadata Submissions explicitly if needed
  const handleMetaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (metadata) saveMetadata(metadata);
  };

  // Print PDF Trigger
  const handlePrint = () => {
    window.print();
  };

  // Upload/Save "Breeding House" Media
  const handleHouseMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !metadata) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('prefix', 'house');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const updated = {
          ...metadata,
          breedingHouseMediaType: 'photo' as const,
          breedingHouseMediaUrl: data.url
        };
        setMetadata(updated);
        saveMetadata(updated);
      }
    } catch (error) {
      console.error('House photo upload failed:', error);
    }
  };

  const saveHouseSketch = async (base64Data: string) => {
    if (!metadata) return;
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data, prefix: 'house-sketch' }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = {
          ...metadata,
          breedingHouseMediaType: 'sketch' as const,
          breedingHouseMediaUrl: data.url
        };
        setMetadata(updated);
        await saveMetadata(updated);
        setIsHouseSketchpadOpen(false);
      }
    } catch (error) {
      console.error('House sketch upload failed:', error);
    }
  };

  // Record CRUD helpers
  const closeRecordModal = () => {
    if (!editingRecord) {
      setIsRecordModalOpen(false);
      return;
    }

    const isDirty = 
      (editingRecord.appearanceDescription?.trim() !== '') || 
      (editingRecord.problemFound?.trim() !== '') || 
      (editingRecord.solution?.trim() !== '');

    if (isDirty) {
      const keepDraft = confirm('您有正在輸入的內容，是否保留草稿？\n\n- 點擊「確定」：保留草稿（下次開啓時可自動還原繼續編輯）\n- 點擊「取消」：不保留草稿（將會清除已輸入內容）');
      if (!keepDraft) {
        localStorage.removeItem('observation_record_draft');
      }
    } else {
      localStorage.removeItem('observation_record_draft');
    }

    setIsRecordModalOpen(false);
    setEditingRecord(null);
    setIsRecordSketchpadOpen(false);
  };

  const openAddRecordModal = () => {
    const defaultRecord = {
      date: new Date().toISOString().split('T')[0],
      dayNumber: records.length > 0 ? Math.max(...records.map(r => r.dayNumber)) + 3 : 1,
      length: records.length > 0 ? Math.max(...records.map(r => r.length)) : 2,
      color: '',
      foodConsumption: '正常',
      feedingDate: new Date().toISOString().split('T')[0],
      appearanceDescription: '',
      problemFound: '',
      solution: '',
      mediaType: 'none' as const,
      mediaUrl: ''
    };

    const savedDraft = localStorage.getItem('observation_record_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (!draft.id) {
          if (confirm('偵測到您有未完成的新增觀察記錄草稿，是否要還原並繼續輸入？')) {
            setEditingRecord(draft);
            setIsRecordModalOpen(true);
            return;
          } else {
            localStorage.removeItem('observation_record_draft');
          }
        }
      } catch (err) {
        console.error('Error parsing draft:', err);
      }
    }

    setEditingRecord(defaultRecord);
    setIsRecordModalOpen(true);
  };

  const openEditRecordModal = (record: ObservationRecord) => {
    const savedDraft = localStorage.getItem('observation_record_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.id === record.id) {
          if (confirm('偵測到您對這筆記錄有未儲存的編輯草稿，是否要還原繼續編輯？')) {
            setEditingRecord(draft);
            setIsRecordModalOpen(true);
            return;
          } else {
            localStorage.removeItem('observation_record_draft');
          }
        }
      } catch (err) {
        console.error('Error parsing draft:', err);
      }
    }

    setEditingRecord(record);
    setIsRecordModalOpen(true);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('您確定要刪除這筆觀察記錄嗎？')) return;
    try {
      const res = await fetch(`/api/records?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
      }
    } catch (error) {
      console.error('Delete record failed:', error);
    }
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setIsSavingRecord(true);

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRecord),
      });

      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
        localStorage.removeItem('observation_record_draft');
        setIsRecordModalOpen(false);
        setEditingRecord(null);
      }
    } catch (error) {
      console.error('Save record failed:', error);
    } finally {
      setIsSavingRecord(false);
    }
  };

  const handleRecordModalFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingRecord) return;
    const { name, value } = e.target;
    const updated = {
      ...editingRecord,
      [name]: name === 'dayNumber' || name === 'length' ? Number(value) : value
    };
    setEditingRecord(updated);
    localStorage.setItem('observation_record_draft', JSON.stringify(updated));
  };

  // Upload/Save Record specific photos or drawings
  const handleRecordPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingRecord) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('prefix', 'record');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const updated = {
          ...editingRecord,
          mediaType: 'photo' as const,
          mediaUrl: data.url
        };
        setEditingRecord(updated);
        localStorage.setItem('observation_record_draft', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Record photo upload failed:', error);
    }
  };

  const saveRecordSketch = async (base64Data: string) => {
    if (!editingRecord) return;
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data, prefix: 'record-sketch' }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = {
          ...editingRecord,
          mediaType: 'sketch' as const,
          mediaUrl: data.url
        };
        setEditingRecord(updated);
        localStorage.setItem('observation_record_draft', JSON.stringify(updated));
        setIsRecordSketchpadOpen(false);
      }
    } catch (error) {
      console.error('Record sketch upload failed:', error);
    }
  };

  // Validation checking minimum 5 observations
  const completedObservationsCount = records.length;
  const isGoalReached = completedObservationsCount >= 5;

  if (isLoading || !metadata) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
        <Loader2 className="animate-spin text-primary" size={48} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        <p style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>載入專案資料中，請稍候...</p>
        <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }



  return (
    <>
      <div className="app-container">
      {/* Dark mode & Print triggers */}
      <button 
        onClick={toggleTheme} 
        className="theme-toggle-btn"
        aria-label="Toggle Dark Mode"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Header section */}
      <header className="header-section">
        <span className="header-badge">SCHOOL FIELD WORK PROJECT</span>
        <h1 className="header-title">🐛 昆蟲觀察記錄表</h1>
        <p className="header-subtitle">
          這是一個重新設計的昆蟲寶寶成長記錄報告。點擊各個分頁填寫，您可以自由新增每日觀察，並線上繪圖或上傳照片。完成後點選右上角列印，即可自動排版為紙本作業格式！
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <button onClick={handlePrint} className="btn btn-secondary">
            <Printer size={18} /> 匯出與列印 (A4 PDF)
          </button>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(43, 138, 62, 0.05)', padding: '0.4rem 1rem', borderRadius: '100px', border: '1px dashed rgba(43, 138, 62, 0.2)' }}>
            💡 <strong>列印提示：</strong>請在系統列印視窗中<strong>取消勾選「頁首與頁尾」</strong>（Headers and footers）即可完全移除最上方的日期與最下方的網址/頁碼標籤。
          </div>
        </div>

        {/* Metadata form */}
        <form onSubmit={handleMetaSubmit} className="meta-grid">
          <div className="meta-item">
            <label className="meta-label">年級</label>
            <input 
              name="grade"
              value={metadata.grade} 
              onChange={handleMetadataChange}
              className="meta-value"
              placeholder="四" 
            />
          </div>
          <div className="meta-item">
            <label className="meta-label">班級</label>
            <input 
              name="classNumber"
              value={metadata.classNumber} 
              onChange={handleMetadataChange}
              className="meta-value"
              placeholder="2" 
            />
          </div>
          <div className="meta-item">
            <label className="meta-label">座號</label>
            <input 
              name="seatNumber"
              value={metadata.seatNumber} 
              onChange={handleMetadataChange}
              className="meta-value"
              placeholder="18" 
            />
          </div>
          <div className="meta-item">
            <label className="meta-label">學生姓名</label>
            <input 
              name="studentName"
              value={metadata.studentName} 
              onChange={handleMetadataChange}
              className="meta-value"
              placeholder="姓名" 
            />
          </div>
          <div className="meta-item">
            <label className="meta-label">昆蟲科別</label>
            <input 
              name="insectFamily"
              value={metadata.insectFamily} 
              onChange={handleMetadataChange}
              className="meta-value"
              placeholder="例如：鱗翅目蠶蛾科" 
            />
          </div>
          <div className="meta-item">
            <label className="meta-label">昆蟲名稱</label>
            <input 
              name="insectName"
              value={metadata.insectName} 
              onChange={handleMetadataChange}
              className="meta-value"
              placeholder="例如：蠶寶寶" 
            />
          </div>
        </form>
      </header>

      {/* Tabs navigation */}
      <nav className="tabs-nav">
        <button 
          onClick={() => setActiveTab('home')} 
          className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
        >
          <Home size={18} /> 壹、飼養準備
        </button>
        <button 
          onClick={() => setActiveTab('timeline')} 
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
        >
          <Calendar size={18} /> 貳、成長日記 ({completedObservationsCount}次)
        </button>
        <button 
          onClick={() => setActiveTab('chart')} 
          className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
        >
          <TrendingUp size={18} /> 📈 生長分析圖表
        </button>
        <button 
          onClick={() => setActiveTab('eco')} 
          className={`tab-btn ${activeTab === 'eco' ? 'active' : ''}`}
        >
          <Leaf size={18} /> 🍃 適應與生態影響
        </button>
        <button 
          onClick={() => setActiveTab('reflection')} 
          className={`tab-btn ${activeTab === 'reflection' ? 'active' : ''}`}
        >
          <PenTool size={18} /> 參、觀察心得
        </button>
      </nav>

      {/* TABS VIEWPORTS */}
      
      {/* 1. HOME / PREPARATION */}
      {activeTab === 'home' && (
        <div className="tab-content-panel">
          <div className="card prep-grid">
            {/* Left Col: Setup detail inputs */}
            <div>
              <h2 style={{ color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={22} /> 壹、飼養前的準備工作
              </h2>
              
              <div className="form-group">
                <label className="form-label">為昆蟲寶寶設計的「家」 (文字說明)</label>
                <textarea 
                  name="breedingHouse"
                  value={metadata.breedingHouse}
                  onChange={handleMetadataChange}
                  className="form-control"
                  placeholder="請描述您如何為昆蟲寶寶設計一個安全舒適的飼養盒環境..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">食物名稱</label>
                <input 
                  name="foodName"
                  value={metadata.foodName}
                  onChange={handleMetadataChange}
                  className="form-control"
                  placeholder="例如：新鮮桑葉"
                />
              </div>

              <div className="form-group">
                <label className="form-label">放置的地點</label>
                <input 
                  name="location"
                  value={metadata.location}
                  onChange={handleMetadataChange}
                  className="form-control"
                  placeholder="例如：書房通風且陰涼的地方"
                />
              </div>
            </div>

            {/* Right Col: Media display (drawing/photo) */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label className="form-label">飼養盒的設計圖或實體照片</label>
              
              <div className="image-selector-tabs">
                <button 
                  type="button"
                  className={`image-selector-tab ${metadata.breedingHouseMediaType === 'none' ? 'active' : ''}`}
                  onClick={() => {
                    const updated = { ...metadata, breedingHouseMediaType: 'none' as const, breedingHouseMediaUrl: '' };
                    setMetadata(updated);
                    saveMetadata(updated);
                  }}
                >
                  無圖檔
                </button>
                <button 
                  type="button"
                  className="image-selector-tab"
                  onClick={() => setIsHouseSketchpadOpen(true)}
                >
                  ✍️ 開啟線上畫圖板
                </button>
                <button 
                  type="button"
                  className={`image-selector-tab ${metadata.breedingHouseMediaType === 'photo' ? 'active' : ''}`}
                  onClick={() => houseFileInputRef.current?.click()}
                >
                  📷 上傳照片
                </button>
              </div>

              <input 
                type="file" 
                ref={houseFileInputRef} 
                onChange={handleHouseMediaUpload} 
                accept="image/*"
                style={{ display: 'none' }} 
              />

              {isHouseSketchpadOpen ? (
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem', backgroundColor: '#fff' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#111', marginBottom: '0.5rem' }}>為昆蟲寶寶畫一個家：</p>
                  <Sketchpad 
                    initialImageUrl={metadata.breedingHouseMediaUrl || undefined}
                    onSave={saveHouseSketch} 
                    onCancel={() => setIsHouseSketchpadOpen(false)} 
                  />
                </div>
              ) : (
                <div 
                  className="display-box prep-house-box"
                  onClick={() => {
                    if (metadata.breedingHouseMediaUrl) return;
                    houseFileInputRef.current?.click();
                  }}
                >
                  {metadata.breedingHouseMediaUrl ? (
                    <>
                      <img src={metadata.breedingHouseMediaUrl} alt="飼養盒設計" />
                      <div className="upload-overlay">
                        點擊重新上傳照片或點選上方重新繪圖
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      <ImageIcon size={36} style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                      <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>尚無家園圖示</p>
                      <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>可選用線上畫圖板繪製或上傳照片</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. OBSERVATION DIARY / TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="tab-content-panel">
          <div className="timeline-section-header">
            <div>
              <h2 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>貳、昆蟲寶寶的成長記錄</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>請定期觀察並填寫您的日記，記錄其外觀、食量、蜕皮等變化。</p>
            </div>

            {/* Goal Tracker */}
            <div className={`progress-banner ${isGoalReached ? 'progress-banner-success' : ''}`}>
              {isGoalReached ? (
                <>
                  <CheckCircle size={18} /> 已達成至少 5 次觀察門檻！({completedObservationsCount}/5)
                </>
              ) : (
                <>
                  <AlertTriangle size={18} /> 至少需觀察 5 次 (目前: {completedObservationsCount}/5)
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <button onClick={openAddRecordModal} className="btn btn-primary">
              <Plus size={18} /> 新增觀察記錄
            </button>
          </div>

          {records.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3>尚無觀察記錄</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>點選上方按鈕，開始填寫您的第一筆昆蟲寶寶成長日記吧！</p>
            </div>
          ) : (
            <div className="timeline-container">
              <div className="timeline-line"></div>
              
              {records.map((record) => {
                const hasProblem = record.problemFound || record.solution;
                return (
                  <div className="timeline-item" key={record.id}>
                    <div className="timeline-badge"></div>
                    <div className="timeline-card">
                      <div className="timeline-meta">
                        <span className="timeline-date">{record.date}</span>
                        <span className="timeline-day">第 {record.dayNumber} 天</span>
                      </div>

                      <div className="timeline-grid">
                        <div className="timeline-info-item">
                          <span className="info-label">長度</span>
                          <p className="info-value">{record.length} mm</p>
                        </div>
                        <div className="timeline-info-item">
                          <span className="info-label">顏色</span>
                          <p className="info-value">{record.color || '無資訊'}</p>
                        </div>
                        <div className="timeline-info-item">
                          <span className="info-label">餵食日期</span>
                          <p className="info-value">{record.feedingDate || '無'}</p>
                        </div>
                        <div className="timeline-info-item">
                          <span className="info-label">昆蟲食量</span>
                          <p className="info-value">{record.foodConsumption}</p>
                        </div>

                        <div className="timeline-desc">
                          <span className="info-label">外形描述與觀察記錄</span>
                          <p style={{ marginTop: '0.25rem' }}>{record.appearanceDescription || '未填寫描述。'}</p>
                        </div>

                        {hasProblem && (
                          <div className="timeline-alert">
                            <div className="alert-title">⚠️ 發現問題與解決：</div>
                            <div className="alert-value">
                              <strong>問題：</strong>{record.problemFound || '無'}<br />
                              <strong>解決：</strong>{record.solution || '無'}
                            </div>
                          </div>
                        )}

                        {record.mediaUrl && (
                          <div className="timeline-media">
                            <img src={record.mediaUrl} alt={`第 ${record.dayNumber} 天觀察`} />
                          </div>
                        )}
                      </div>

                      {/* Action edit/delete */}
                      <div className="timeline-actions">
                        <button 
                          onClick={() => openEditRecordModal(record)} 
                          className="btn btn-secondary btn-sm"
                        >
                          <Edit2 size={14} /> 編輯
                        </button>
                        <button 
                          onClick={() => handleDeleteRecord(record.id)} 
                          className="btn btn-danger btn-sm"
                        >
                          <Trash2 size={14} /> 刪除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. GROWTH GRAPH ANALYSIS */}
      {activeTab === 'chart' && (
        <div className="tab-content-panel">
          <div className="card chart-card">
            <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={22} /> 昆蟲體長增長曲線圖
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              下圖為昆蟲寶寶體長 (mm) 隨著飼養天數的增長軌跡。科學圖表有助於客觀分析昆蟲各齡期的生長速度。
            </p>
            {records.length < 2 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)' }}>
                <TrendingUp size={36} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <p>需要至少 2 筆觀察記錄才能繪製生長曲線圖。</p>
              </div>
            ) : (
              <div style={{ height: '260px' }}>
                <GrowthChart records={records} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. ENVIRONMENT ADAPTABILITY & IMPACTS */}
      {activeTab === 'eco' && (
        <div className="tab-content-panel">
          <div className="eco-grid">
            {/* Adaptability Mechanisms fill-in-the-blanks */}
            <div className="fill-card">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--primary)' }}>
                <Sparkles size={22} /> 昆蟲適應環境的機制
              </h2>
              
              <div className="fill-sentence">
                此昆蟲適應環境的機制：<br />
                我的昆蟲在<strong>構造或功能</strong>上具有：
                <textarea 
                  name="adaptation.structure"
                  value={metadata.adaptation.structure}
                  onChange={handleMetadataChange}
                  placeholder="例如：腹部具有多對偽足，且頭部下方有發達的吐絲器..."
                />
              </div>

              <div className="fill-sentence">
                牠可以利用這些特徵做出什麼<strong>行為/適應</strong>：
                <textarea 
                  name="adaptation.action"
                  value={metadata.adaptation.action}
                  onChange={handleMetadataChange}
                  placeholder="例如：爬行時利用偽足緊緊抓牢桑葉，並在熟蠶時吐絲作繭..."
                />
              </div>

              <div className="fill-sentence">
                從而達到什麼樣的<strong>生存適應環境功能</strong>：
                <textarea 
                  name="adaptation.func"
                  value={metadata.adaptation.func}
                  onChange={handleMetadataChange}
                  placeholder="例如：保護自己免受天敵和惡劣天氣的侵害，並防止爬行時掉落摔傷..."
                />
              </div>
            </div>

            {/* Human activities impact */}
            <div className="fill-card fill-card-accent">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--accent)' }}>
                <AlertTriangle size={22} /> 人類開發對此昆蟲產生的影響
              </h2>

              <div className="fill-sentence">
                人類的開發及利用資源，對此昆蟲產生的<strong>好或不好的影響</strong>：
                <textarea 
                  name="humanImpact.impact"
                  value={metadata.humanImpact.impact}
                  onChange={handleMetadataChange}
                  placeholder="請分析人類活動（如城市綠化、農藥噴灑、絲綢利用等）對該昆蟲產生的利與弊..."
                />
              </div>

              <div className="fill-sentence">
                對此，我們能做些什麼來幫助牠們，提出<strong>改善方法</strong>：
                <textarea 
                  name="humanImpact.improvement"
                  value={metadata.humanImpact.improvement}
                  onChange={handleMetadataChange}
                  placeholder="請提出有助於環境保護與昆蟲共存的具體改善行動..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. REFLECTIONS */}
      {activeTab === 'reflection' && (
        <div className="tab-content-panel">
          <div className="card reflection-card">
            <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={22} /> 參、觀察心得與收穫
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              請寫下您在這次飼養昆蟲期間的感想，您觀察到了什麼生命的奇妙之處？過程中遇到了哪些挑戰？
            </p>
            <div className="form-group">
              <textarea 
                name="reflection"
                value={metadata.reflection}
                onChange={handleMetadataChange}
                className="form-control"
                style={{ minHeight: '240px' }}
                placeholder="寫下您對昆蟲生命週期的體悟、飼養的心情起伏，以及學到的科學探究方法..."
              />
            </div>
          </div>
        </div>
      )}


      {/* OBSERVATION RECORD DIALOG MODAL */}
      {isRecordModalOpen && editingRecord && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                {editingRecord.id ? <Edit2 size={20} /> : <Plus size={20} />}
                {editingRecord.id ? '編輯觀察記錄' : '新增觀察記錄'}
              </h3>
              <button 
                type="button" 
                onClick={closeRecordModal} 
                className="action-btn"
                style={{ border: 'none', background: 'transparent' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">觀察日期</label>
                    <input 
                      type="date"
                      name="date"
                      value={editingRecord.date}
                      onChange={handleRecordModalFieldChange}
                      required
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">飼養天數 (第幾天)</label>
                    <input 
                      type="number"
                      name="dayNumber"
                      value={editingRecord.dayNumber}
                      onChange={handleRecordModalFieldChange}
                      required
                      min="1"
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">昆蟲體長 (mm)</label>
                    <input 
                      type="number"
                      name="length"
                      value={editingRecord.length}
                      onChange={handleRecordModalFieldChange}
                      required
                      min="0"
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">顏色特徵</label>
                    <input 
                      type="text"
                      name="color"
                      value={editingRecord.color}
                      onChange={handleRecordModalFieldChange}
                      placeholder="例如：灰白色"
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">餵食日期</label>
                    <input 
                      type="date"
                      name="feedingDate"
                      value={editingRecord.feedingDate}
                      onChange={handleRecordModalFieldChange}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">昆蟲食量</label>
                    <select 
                      name="foodConsumption"
                      value={editingRecord.foodConsumption}
                      onChange={handleRecordModalFieldChange}
                      className="form-control"
                    >
                      <option value="無">無</option>
                      <option value="極少">極少</option>
                      <option value="正常">正常</option>
                      <option value="食量大">食量大</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">外形描述與生活記錄</label>
                  <textarea 
                    name="appearanceDescription"
                    value={editingRecord.appearanceDescription}
                    onChange={handleRecordModalFieldChange}
                    className="form-control"
                    placeholder="請描述昆蟲的身體構造變化、動作細節、或是特別的行為..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">發現問題 (選填)</label>
                    <textarea 
                      name="problemFound"
                      value={editingRecord.problemFound}
                      onChange={handleRecordModalFieldChange}
                      className="form-control"
                      placeholder="今天在飼養上有遇到什麼令人擔心的問題嗎？"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">解決方法 (選填)</label>
                    <textarea 
                      name="solution"
                      value={editingRecord.solution}
                      onChange={handleRecordModalFieldChange}
                      className="form-control"
                      placeholder="您採取了什麼行動來解決上述的問題？"
                    />
                  </div>
                </div>

                {/* Media options */}
                <div className="form-group">
                  <label className="form-label">添加觀察外形變化 (畫圖或照片)</label>
                  
                  <div className="image-selector-tabs" style={{ marginBottom: '0.75rem' }}>
                    <button 
                      type="button"
                      className={`image-selector-tab ${editingRecord.mediaType === 'none' ? 'active' : ''}`}
                      onClick={() => {
                        const updated = { ...editingRecord, mediaType: 'none' as const, mediaUrl: '' };
                        setEditingRecord(updated);
                        localStorage.setItem('observation_record_draft', JSON.stringify(updated));
                      }}
                    >
                      無圖檔
                    </button>
                    <button 
                      type="button"
                      className={`image-selector-tab ${isRecordSketchpadOpen ? 'active' : ''}`}
                      onClick={() => setIsRecordSketchpadOpen(true)}
                    >
                      ✍️ 開啟線上畫圖板
                    </button>
                    <button 
                      type="button"
                      className={`image-selector-tab ${editingRecord.mediaType === 'photo' ? 'active' : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      📷 上傳照片
                    </button>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleRecordPhotoUpload} 
                    accept="image/*"
                    style={{ display: 'none' }} 
                  />

                  {isRecordSketchpadOpen ? (
                    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem', backgroundColor: '#fff' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#111', marginBottom: '0.5rem' }}>在下方空白處畫出昆蟲的變化：</p>
                      <Sketchpad 
                        initialImageUrl={editingRecord.mediaUrl || undefined}
                        onSave={saveRecordSketch} 
                        onCancel={() => setIsRecordSketchpadOpen(false)} 
                      />
                    </div>
                  ) : (
                    editingRecord.mediaUrl && (
                      <div className="display-box" style={{ height: '180px' }} onClick={() => fileInputRef.current?.click()}>
                        <img src={editingRecord.mediaUrl} alt="預覽" />
                        <div className="upload-overlay">點擊更換照片</div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={closeRecordModal} 
                  className="btn btn-secondary"
                  disabled={isSavingRecord}
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSavingRecord || isRecordSketchpadOpen}
                >
                  {isSavingRecord ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> 儲存中...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> 儲存記錄
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* ========================================================================= */}
      {/* NATIVE HIGH-FIDELITY A4 PDF/PRINT TEMPLATE (HIDDEN FOR SCREEN VIEWS)      */}
      {/* ========================================================================= */}
      <div id="print-template" className="print-only-layout">
        
        {/* Continuous Flow Print Layout */}
        <div className="print-page">
          {/* Homework Header Info */}
          <div className="print-header">
            <div className="print-header-top">
              <span className="print-underline-header">&nbsp;{metadata.grade || '四'}&nbsp;</span> 年級 <span className="print-underline-header">&nbsp;{metadata.classNumber || '　'}&nbsp;</span> 班 <span className="print-underline-header">&nbsp;{metadata.seatNumber || '　'}&nbsp;</span> 號 &nbsp;&nbsp;&nbsp;&nbsp; 學生姓名：<span className="print-underline-header">&nbsp;{metadata.studentName || '　　　'}&nbsp;</span>
            </div>
            <div className="print-header-title">
              昆蟲家族－( <span className="print-underline-large">&nbsp;{metadata.insectName || '　　　　　'}&nbsp;</span> )的觀察記錄表
            </div>
          </div>

          {/* Part 1: Preparation Work L-Shape Grid Table */}
          <div className="print-section">
            <div className="print-section-title">壹、飼養前的準備工作</div>
            <table className="print-prep-table">
              <tbody>
                <tr>
                  <td className="prep-col-house" rowSpan={2}>
                    <div className="print-prep-label">(一) 為昆蟲寶寶所設計的「家」(拍照畫圖或文字敘述)</div>
                    <div className="print-prep-house-content">
                      {metadata.breedingHouseMediaUrl ? (
                        <img src={metadata.breedingHouseMediaUrl} className="print-house-img" alt="家" />
                      ) : (
                        <div className="print-empty-box">〔 拍照、畫圖或在此處書寫家園敘述 〕</div>
                      )}
                      <p className="print-house-text">{metadata.breedingHouse}</p>
                    </div>
                  </td>
                  <td className="prep-col-detail">
                    <div className="print-prep-label">(二) 食物名稱：</div>
                    <p className="print-prep-text">{metadata.foodName || '〔 未填寫 〕'}</p>
                  </td>
                </tr>
                <tr>
                  <td className="prep-col-detail">
                    <div className="print-prep-label">(三) 放置的地點：</div>
                    <p className="print-prep-text">{metadata.location || '〔 未填寫 〕'}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Part 2: Observation Records Table (Flows Continuously) */}
          <div className="print-section">
            <div className="print-section-title">貳、昆蟲寶寶的成長記錄</div>
            <table className="print-table">
              <thead>
                <tr>
                  <th className="col-date">觀察日期</th>
                  <th className="col-record">觀察記錄</th>
                  <th className="col-photo">昆蟲外形的變化<br />(拍照或畫圖)</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? (
                  records.map(r => renderPrintRecordRow(r))
                ) : (
                  <tr className="print-record-tr-empty">
                    <td colSpan={3} style={{ textAlign: 'center', height: '180px', color: '#888' }}>
                      （ 尚無觀察記錄 ）
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Adaptation Mechanism & Ecological Human Impact Table */}
          <div className="print-section" style={{ marginTop: '1.5rem' }}>
            <table className="print-eco-table">
              <tbody>
                <tr>
                  <td className="eco-col-label">此昆蟲適應環境的機制</td>
                  <td className="eco-col-content">
                    <div className="print-line-row">
                      構造或功能具有：<span className="print-underline-text">{metadata.adaptation.structure || '　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　'}</span>
                    </div>
                    <div className="print-line-row">
                      可以：<span className="print-underline-text">{metadata.adaptation.action || '　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　'}</span>
                    </div>
                    <div className="print-line-row">
                      達到適應環境的功能。
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="eco-col-label">人類的開發及利用資源，對此昆蟲產生的影響</td>
                  <td className="eco-col-content">
                    <div className="print-line-row">
                      好或不好的影響：<span className="print-underline-text">{metadata.humanImpact.impact || '　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　'}</span>
                    </div>
                    <div className="print-line-row">
                      改善方法：<span className="print-underline-text">{metadata.humanImpact.improvement || '　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　'}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Part 3: Reflections */}
          <div className="print-section" style={{ marginTop: '1.5rem' }}>
            <div className="print-section-title">參、觀察心得</div>
            <div className="print-reflection-box">
              {metadata.reflection || '〔 尚未寫下任何觀察心得 〕'}
            </div>
          </div>
        </div>

      </div>
    </>
  );

  // Helper inside dashboard component to render printable records
  function renderPrintRecordRow(r: ObservationRecord) {
    return (
      <tr key={r.id} className="print-record-tr">
        <td className="col-date-val">
          <div className="vertical-date">
            <div className="print-date-label">日期</div>
            <div className="print-date-text">{r.date.replace('2026-', '')}</div>
            <div className="print-day-text">第 {r.dayNumber} 天</div>
          </div>
        </td>
        <td className="col-record-val">
          <table className="print-sub-record-table">
            <tbody>
              <tr>
                <td style={{ width: '50%', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>
                  <strong>長度：</strong><span className="print-text-line">{r.length} mm</span>
                </td>
                <td style={{ width: '50%', borderBottom: '1px solid #000' }}>
                  <strong>顏色：</strong><span className="print-text-line">{r.color || '無'}</span>
                </td>
              </tr>
              <tr>
                <td style={{ width: '50%', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>
                  <strong>昆蟲食量：</strong><span className="print-text-line">{r.foodConsumption}</span>
                </td>
                <td style={{ width: '50%', borderBottom: '1px solid #000' }}>
                  <strong>餵食日期：</strong><span className="print-text-line">{r.feedingDate || '無'}</span>
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ borderBottom: '1px solid #000' }}>
                  <div className="print-block-field">
                    <strong>外形描述：</strong>
                    <div className="print-text-block">{r.appearanceDescription || '無'}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <div className="print-problem-row">
                    <div style={{ width: '50%', borderRight: '1px solid #000', paddingRight: '0.25rem' }}>
                      <strong>發現問題：</strong>
                      <div className="print-text-block-sm">{r.problemFound || '無'}</div>
                    </div>
                    <div style={{ width: '50%', paddingLeft: '0.25rem' }}>
                      <strong>解決方法：</strong>
                      <div className="print-text-block-sm">{r.solution || '無'}</div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
        <td className="col-photo-val">
          {r.mediaUrl ? (
            <img src={r.mediaUrl} className="print-record-img" alt="外形變化" />
          ) : (
            <div className="print-photo-placeholder">
              〔 畫圖或貼照片 〕
            </div>
          )}
        </td>
      </tr>
    );
  }
}

