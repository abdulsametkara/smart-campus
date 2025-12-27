import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import reservationService from '../services/reservationService';
import { classroomsService } from '../services/academicService';
import LoadingSpinner from '../components/LoadingSpinner';
import Swal from 'sweetalert2';
import './SchedulePage.css';

const ClassroomReservationsPage = () => {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    classroom_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
    purpose: ''
  });
  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const cls = await classroomsService.getAll();
        const list = Array.isArray(cls) ? cls : (cls.classrooms || []);
        setClassrooms(list);
        if (list.length > 0) {
          setSelectedClassroom(String(list[0].id));
          setForm((prev) => ({ ...prev, classroom_id: list[0].id }));
        }
      } catch (err) {
        console.error('Error loading classrooms', err);
        Swal.fire('Hata', 'Sınıf listesi yüklenemedi.', 'error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedClassroom || !date) return;
    const fetchReservations = async () => {
      try {
        // Tarih formatını normalize et (YYYY-MM-DD)
        const normalizedDate = date.split('T')[0];
        const data = await reservationService.list({
          classroom_id: selectedClassroom,
          date: normalizedDate
        });
        setReservations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading reservations', err);
        Swal.fire('Hata', 'Rezervasyonlar yüklenemedi.', 'error');
      }
    };
    fetchReservations();
  }, [selectedClassroom, date]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Eğer tarih değiştiyse, date state'ini de güncelle
    if (name === 'date') {
      setDate(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.classroom_id || !form.date || !form.start_time || !form.end_time || !form.purpose) {
      Swal.fire('Hata', 'Lütfen tüm alanları doldurun.', 'error');
      return;
    }

    if (form.start_time >= form.end_time) {
      Swal.fire('Hata', 'Başlangıç saati bitiş saatinden önce olmalıdır.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const response = await reservationService.create(form);
      Swal.fire('Başarılı', 'Rezervasyon talebiniz oluşturuldu. Onay bekliyor.', 'success');

      // Form'u temizle (sadece purpose ve saatleri)
      setForm((prev) => ({
        ...prev,
        start_time: '09:00',
        end_time: '10:00',
        purpose: ''
      }));

      // Yeni oluşturulan rezervasyonu listeye ekle
      const newReservation = response.reservation || response;
      if (newReservation && newReservation.date) {
        // Tarih formatını normalize et
        const resDate = newReservation.date instanceof Date
          ? newReservation.date.toISOString().split('T')[0]
          : newReservation.date.split('T')[0];

        // Eğer yeni rezervasyon seçili tarih ve sınıf için ise, listeye ekle
        if (resDate === form.date && String(newReservation.classroom_id) === String(form.classroom_id)) {
          setReservations((prev) => {
            // Zaten varsa ekleme (duplicate kontrolü)
            const exists = prev.some(r => r.id === newReservation.id);
            if (exists) return prev;
            return [...prev, newReservation];
          });
        }
      }

      // Date state'ini form.date ile güncelle (timetable'ı güncellemek için)
      // Bu useEffect'i tetikleyecek ve rezervasyonlar otomatik yüklenecek
      if (date !== form.date) {
        setDate(form.date);
      } else {
        // Aynı tarih ise, rezervasyon listesini manuel olarak yenile
        try {
          const data = await reservationService.list({
            classroom_id: form.classroom_id,
            date: form.date
          });
          setReservations(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error('Error refreshing reservations:', err);
          // Hata olsa bile useEffect tekrar deneyecek
        }
      }
    } catch (err) {
      console.error('Create reservation error', err);
      const errorMessage = err.response?.data?.message || err.message || 'Rezervasyon talebi oluşturulamadı.';
      Swal.fire('Hata', errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="status-badge approved">Onaylandı</span>;
      case 'rejected':
        return <span className="status-badge rejected">Reddedildi</span>;
      default:
        return <span className="status-badge pending">Beklemede</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const showReservationDetails = (res) => {
    setSelectedReservation(res);
  };

  const closeModal = () => {
    setSelectedReservation(null);
  };

  if (loading) {
    return <LoadingSpinner message="Sınıf ve rezervasyon bilgileri yükleniyor..." />;
  }

  const selectedClassroomObj = classrooms.find((c) => String(c.id) === String(selectedClassroom));

  return (
    <div className="page schedule-page">
      <div className="page-header">
        <h1>Sınıf Rezervasyonları</h1>
        <p className="page-subtitle">
          Sınıf uygunluğunu görüntüleyin ve belirli saatler için rezervasyon talebi oluşturun.
        </p>
      </div>

      <div className="filters-card">
        <h3>Filtreler</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Sınıf</label>
            <select
              value={selectedClassroom}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedClassroom(value);
                setForm((prev) => ({ ...prev, classroom_id: value }));
              }}
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.building ? `- ${c.building}` : ''} {c.room_number ? `Oda ${c.room_number}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Tarih</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                const newDate = e.target.value;
                setDate(newDate);
                setForm((prev) => ({ ...prev, date: newDate }));
              }}
            />
          </div>
        </div>
      </div>

      <div className="timetable-container">
        <div className="timetable">
          <div className="time-column">
            <div className="time-header">
              {selectedClassroomObj ? selectedClassroomObj.name : 'Sınıf'}
            </div>
            {[...Array(10)].map((_, i) => {
              const hour = 8 + i;
              const label = `${hour.toString().padStart(2, '0')}:00`;
              return (
                <div key={label} className="time-slot">
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
          <div className="day-column">
            <div className="day-header">
              <span className="day-name">{date}</span>
            </div>
            <div className="day-slots">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="hour-slot" />
              ))}
              {reservations
                .filter((res) => {
                  // Onaylanmış rezervasyonlar: Herkes görebilir (sınıfın dolu olduğunu göstermek için)
                  // Bekleyen rezervasyonlar: Sadece kendi rezervasyonlarını görebilir
                  // Reddedilmiş rezervasyonlar: Gösterilmez
                  if (res.status === 'approved') {
                    // Onaylanmış rezervasyonlar herkes tarafından görülebilir
                  } else if (res.status === 'pending' && res.user_id === user?.id) {
                    // Bekleyen rezervasyonlar sadece sahibi tarafından görülebilir
                  } else {
                    // Diğer durumlar (rejected, cancelled, başkasının pending'i) gösterilmez
                    return false;
                  }

                  // Sadece seçili tarih ile eşleşen rezervasyonları göster
                  // Tarih formatını normalize et (YYYY-MM-DD)
                  let resDate = res.date;
                  if (resDate) {
                    // Eğer Date objesi ise string'e çevir
                    if (resDate instanceof Date) {
                      resDate = resDate.toISOString().split('T')[0];
                    } else if (typeof resDate === 'string') {
                      // Eğer string ise, T'den önceki kısmı al
                      resDate = resDate.split('T')[0];
                    }
                  }
                  // date state'i zaten YYYY-MM-DD formatında
                  return resDate === date;
                })
                .map((res) => {
                  const startHour = parseInt(res.start_time.split(':')[0], 10);
                  const startMin = parseInt(res.start_time.split(':')[1] || '0', 10);
                  const endHour = parseInt(res.end_time.split(':')[0], 10);
                  const endMin = parseInt(res.end_time.split(':')[1] || '0', 10);
                  const top = (startHour - 8) * 60 + startMin;
                  const height = Math.max((endHour - startHour) * 60 + (endMin - startMin), 45);
                  const isOwn = res.user_id === user?.id;
                  const statusColor = res.status === 'approved' ? '#10b981' : res.status === 'pending' ? '#f59e0b' : '#ef4444';
                  const statusBg = res.status === 'approved' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                    res.status === 'pending' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                      'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                  return (
                    <div
                      key={res.id}
                      className={`schedule-item reservation-item status-${res.status}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        cursor: 'pointer',
                        background: statusBg,
                        borderRadius: '10px',
                        border: `2px solid ${statusColor}`,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        overflow: 'hidden',
                        padding: '0.5rem'
                      }}
                      onClick={() => showReservationDetails(res)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05) translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.35)';
                        e.currentTarget.style.zIndex = '100';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1) translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                        e.currentTarget.style.zIndex = '10';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>
                          {res.status === 'approved' ? '✅' : res.status === 'pending' ? '⏳' : '❌'}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                          {res.purpose?.substring(0, 20) || 'Rezervasyon'}{res.purpose?.length > 20 ? '...' : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.95)', marginBottom: '0.15rem' }}>
                        🕐 {res.start_time.substring(0, 5)} - {res.end_time.substring(0, 5)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.85)' }}>
                        👤 {res.user?.full_name?.substring(0, 15) || 'Kullanıcı'}
                      </div>
                      {isOwn && (
                        <div style={{
                          position: 'absolute',
                          top: '3px',
                          right: '3px',
                          background: 'rgba(255,255,255,0.95)',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          ⭐
                        </div>
                      )}
                      <div style={{
                        position: 'absolute',
                        bottom: '3px',
                        right: '5px',
                        fontSize: '0.55rem',
                        color: 'rgba(255,255,255,0.7)',
                        fontStyle: 'italic'
                      }}>
                        Tıkla →
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Rezervasyon oluşturma formu sadece student ve faculty için */}
      {(user?.role === 'student' || user?.role === 'faculty') && (
        <div className="filters-card" style={{ marginTop: '2rem' }}>
          <h3>Yeni Rezervasyon Talebi</h3>
          <form onSubmit={handleSubmit} className="filters-grid">
            <div className="filter-group">
              <label>Sınıf</label>
              <select
                name="classroom_id"
                value={form.classroom_id}
                onChange={handleFormChange}
              >
                <option value="">Seçiniz</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Tarih</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleFormChange}
              />
            </div>
            <div className="filter-group">
              <label>Başlangıç Saati</label>
              <input
                type="time"
                name="start_time"
                value={form.start_time}
                onChange={handleFormChange}
              />
            </div>
            <div className="filter-group">
              <label>Bitiş Saati</label>
              <input
                type="time"
                name="end_time"
                value={form.end_time}
                onChange={handleFormChange}
              />
            </div>
            <div className="filter-group" style={{ gridColumn: '1 / -1' }}>
              <label>Amaç / Açıklama</label>
              <textarea
                name="purpose"
                value={form.purpose}
                onChange={handleFormChange}
                rows={2}
                placeholder="Örn: Proje sunumu, kulüp etkinliği..."
              />
            </div>
            <div className="filter-group" style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Gönderiliyor...' : 'Rezervasyon Talebi Oluştur'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin için bilgilendirme */}
      {user?.role === 'admin' && (
        <div className="alert alert-info" style={{ marginTop: '2rem' }}>
          <strong>Bilgi:</strong> Rezervasyon oluşturmak için öğrenci veya öğretim görevlisi olmanız gerekir.
          Rezervasyon onaylamak için <a href="/admin/reservations" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Rezervasyon Yönetimi</a> sayfasını kullanın.
        </div>
      )}

      {/* Reservation Detail Modal */}
      {selectedReservation && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
              animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                color: '#6b7280'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              ✕
            </button>

            {/* Header with Status */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: selectedReservation.status === 'approved' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                  selectedReservation.status === 'pending' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                    'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                fontSize: '2rem'
              }}>
                {selectedReservation.status === 'approved' ? '✅' : selectedReservation.status === 'pending' ? '⏳' : '❌'}
              </div>
              <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.4rem' }}>
                Rezervasyon Detayları
              </h2>
              <span style={{
                display: 'inline-block',
                marginTop: '0.5rem',
                padding: '0.35rem 1rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: selectedReservation.status === 'approved' ? '#dcfce7' :
                  selectedReservation.status === 'pending' ? '#fef3c7' : '#fee2e2',
                color: selectedReservation.status === 'approved' ? '#166534' :
                  selectedReservation.status === 'pending' ? '#92400e' : '#991b1b'
              }}>
                {selectedReservation.status === 'approved' ? 'Onaylandı' :
                  selectedReservation.status === 'pending' ? 'Onay Bekliyor' : 'Reddedildi'}
              </span>
            </div>

            {/* Details Grid */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>📝</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.15rem' }}>Amaç</div>
                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{selectedReservation.purpose || '-'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🏫</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.15rem' }}>Sınıf</div>
                    <div style={{ fontWeight: 600, color: '#1f2937' }}>
                      {selectedReservation.classroom?.name || `Sınıf #${selectedReservation.classroom_id}`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>📅</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.15rem' }}>Tarih</div>
                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{formatDate(selectedReservation.date)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🕐</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.15rem' }}>Saat</div>
                    <div style={{ fontWeight: 600, color: '#1f2937' }}>
                      {selectedReservation.start_time?.substring(0, 5)} - {selectedReservation.end_time?.substring(0, 5)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>👤</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.15rem' }}>Talep Eden</div>
                    <div style={{ fontWeight: 600, color: '#1f2937' }}>
                      {selectedReservation.user?.full_name || 'Bilinmiyor'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {selectedReservation.user?.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Own reservation indicator */}
            {selectedReservation.user_id === user?.id && (
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <span style={{ fontSize: '1.1rem' }}>⭐</span>
                <span style={{ fontWeight: 600, color: '#92400e' }}>Bu sizin rezervasyonunuz</span>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={closeModal}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
              }}
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(30px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
      `}</style>
    </div>
  );
};

export default ClassroomReservationsPage;


