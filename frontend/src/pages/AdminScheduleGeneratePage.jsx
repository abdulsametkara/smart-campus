import React, { useState, useEffect } from 'react';
import { sectionsService } from '../services/academicService';
import LoadingSpinner from '../components/LoadingSpinner';
import NotificationService from '../services/notificationService';
import './AdminAcademicPage.css';

const AdminScheduleGeneratePage = () => {
  // Mevcut ve gelecek dönemler listesi
  const availableSemesters = [
    { value: '2024-FALL', label: '2024-2025 Güz Dönemi' },
    { value: '2025-SPRING', label: '2024-2025 Bahar Dönemi' },
    { value: '2025-FALL', label: '2025-2026 Güz Dönemi' },
    { value: '2026-SPRING', label: '2025-2026 Bahar Dönemi' },
    { value: '2026-FALL', label: '2026-2027 Güz Dönemi' },
    { value: '2027-SPRING', label: '2026-2027 Bahar Dönemi' }
  ];

  const [semester, setSemester] = useState('2025-SPRING');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [availableSemestersFromDB, setAvailableSemestersFromDB] = useState([]);
  const [options, setOptions] = useState({
    overwriteExisting: true,
    preferredTimeSlot: 'any' // 'morning', 'afternoon', 'any'
  });

  // Veritabanından mevcut dönemleri çek (isteğe bağlı)
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        // Tüm sections'ları çek ve unique semester'ları al
        const sections = await sectionsService.getAll({ limit: 1000 });
        const sectionsArray = sections.sections || sections || [];
        const uniqueSemesters = [...new Set(sectionsArray.map(s => s.semester).filter(Boolean))];
        
        if (uniqueSemesters.length > 0) {
          // Dönemleri formatla ve sırala
          const formattedSemesters = uniqueSemesters
            .map(sem => {
              const [year, term] = sem.split('-');
              const termLabel = term === 'SPRING' ? 'Bahar' : term === 'FALL' ? 'Güz' : term;
              return {
                value: sem,
                label: `${year}-${parseInt(year) + 1} ${termLabel} Dönemi (${sem})`
              };
            })
            .sort((a, b) => b.value.localeCompare(a.value)); // En yeni önce
          
          setAvailableSemestersFromDB(formattedSemesters);
        }
      } catch (err) {
        console.error('Error fetching semesters:', err);
        // Hata durumunda statik listeyi kullan
      }
    };
    
    fetchSemesters();
  }, []);

  const handleGenerate = async () => {
    try {
      const confirm = await NotificationService.confirm(
        'Ders Programını Oluştur',
        'Seçilen dönem için tüm derslerin programı otomatik olarak hesaplanacak. Mevcut program (varsa) üzerine yazılabilir. Devam etmek istiyor musunuz?',
        {
          confirmButtonText: 'Evet, Başlat',
          cancelButtonText: 'Vazgeç'
        }
      );

      if (!confirm.isConfirmed) return;

      setLoading(true);
      // Backend'e options gönder
      const result = await sectionsService.generateSchedule(semester, {
        overwriteExisting: options.overwriteExisting,
        preferredTimeSlot: options.preferredTimeSlot
      });
      setLastResult(result);

      if (result.success) {
        NotificationService.success('Program Oluşturuldu', result.message || 'Ders programı başarıyla oluşturuldu.');
      } else {
        NotificationService.error('Program Oluşturulamadı', result.message || 'Uygun bir program üretilemedi.');
      }
    } catch (error) {
      console.error('Generate schedule error:', error);
      NotificationService.error('Hata', error.response?.data?.message || 'Program oluşturulurken beklenmeyen bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportICal = async () => {
    try {
      setLoading(true);
      const blob = await sectionsService.exportICal(semester);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `schedule-${semester}.ics`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      NotificationService.success('Başarılı', `iCal dosyası indirildi: schedule-${semester}.ics`);
    } catch (err) {
      console.error('Export failed', err);
      NotificationService.error('Hata', err.response?.data?.message || 'iCal dosyası oluşturulurken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page academic-page">
      <div className="page-header">
        <h1>Program Oluşturma</h1>
        <p className="page-subtitle">
          Derslerin dönemlik programını otomatik olarak oluşturan yönetici arayüzü.
        </p>
      </div>

      <div className="filters-card">
        <h3>Dönem ve Ayarlar</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Dönem</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="form-select"
            >
              {availableSemestersFromDB.length > 0 ? (
                // Veritabanından gelen dönemler
                availableSemestersFromDB.map((sem) => (
                  <option key={sem.value} value={sem.value}>
                    {sem.label}
                  </option>
                ))
              ) : (
                // Statik dönem listesi (fallback)
                availableSemesters.map((sem) => (
                  <option key={sem.value} value={sem.value}>
                    {sem.label}
                  </option>
                ))
              )}
            </select>
            <small className="helper-text">
              {availableSemestersFromDB.length > 0 
                ? 'Veritabanındaki mevcut dönemler listeleniyor.'
                : 'Standart dönem listesi gösteriliyor. Program oluşturmak için bir dönem seçin.'}
            </small>
          </div>

          <div className="filter-group">
            <label>Mevcut Programı</label>
            <select
              value={options.overwriteExisting ? 'overwrite' : 'append'}
              onChange={(e) => setOptions(prev => ({ ...prev, overwriteExisting: e.target.value === 'overwrite' }))}
              className="form-select"
            >
              <option value="overwrite">Üzerine Yaz (Mevcut programı sil)</option>
              <option value="append">Ekle (Mevcut programı koru)</option>
            </select>
            <small className="helper-text">
              Mevcut programı silip yeniden oluştur veya mevcut programa ekle.
            </small>
          </div>

          <div className="filter-group">
            <label>Tercih Edilen Zaman Aralığı</label>
            <select
              value={options.preferredTimeSlot}
              onChange={(e) => setOptions(prev => ({ ...prev, preferredTimeSlot: e.target.value }))}
              className="form-select"
            >
              <option value="any">Herhangi Bir Zaman</option>
              <option value="morning">Sabah (09:00-12:00)</option>
              <option value="afternoon">Öğleden Sonra (13:00-17:00)</option>
            </select>
            <small className="helper-text">
              Sistem bu zaman aralığını tercih edecek (garanti değil).
            </small>
          </div>
        </div>
      </div>

      <div className="header-actions" style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Hesaplanıyor...' : '⚡ Programı Oluştur'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleExportICal}
          disabled={loading}
        >
          📅 iCal Olarak Dışa Aktar
        </button>
      </div>

      {loading && (
        <div style={{ marginTop: '2rem' }}>
          <LoadingSpinner message="Program oluşturuluyor, lütfen bekleyin..." />
        </div>
      )}

      {lastResult && (
        <div className="filters-card" style={{ marginTop: '2rem' }}>
          <h3>Son Çalıştırma Özeti</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="stat-card" style={{ padding: '1rem', background: lastResult.success ? '#d1fae5' : '#fee2e2', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Durum</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: lastResult.success ? '#065f46' : '#991b1b' }}>
                {lastResult.success ? '✅ Başarılı' : '❌ Başarısız'}
              </div>
            </div>
            
            {typeof lastResult.assignmentCount !== 'undefined' && (
              <div className="stat-card" style={{ padding: '1rem', background: '#dbeafe', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Atanan Ders</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e40af' }}>
                  {lastResult.assignmentCount}
                </div>
              </div>
            )}
            
            {typeof lastResult.totalSections !== 'undefined' && (
              <div className="stat-card" style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Toplam Ders</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#374151' }}>
                  {lastResult.totalSections}
                </div>
              </div>
            )}
            
            {typeof lastResult.unassignedCount !== 'undefined' && lastResult.unassignedCount > 0 && (
              <div className="stat-card" style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Atanamayan</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#92400e' }}>
                  {lastResult.unassignedCount}
                </div>
              </div>
            )}
          </div>
          
          {lastResult.message && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
              <strong>Mesaj:</strong> {lastResult.message}
            </div>
          )}
          
          {lastResult.success && (
            <div style={{ marginTop: '1rem' }}>
              <a href="/schedule" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                📅 Oluşturulan Programı Görüntüle
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminScheduleGeneratePage;


