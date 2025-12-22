import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import reservationService from '../services/reservationService';
import { classroomsService } from '../services/academicService';
import LoadingSpinner from '../components/LoadingSpinner';
import NotificationService from '../services/notificationService';
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
        NotificationService.error('Hata', 'Sınıf listesi yüklenemedi.');
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
        NotificationService.error('Hata', 'Rezervasyonlar yüklenemedi.');
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
      NotificationService.error('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (form.start_time >= form.end_time) {
      NotificationService.error('Hata', 'Başlangıç saati bitiş saatinden önce olmalıdır.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await reservationService.create(form);
      NotificationService.success('Başarılı', 'Rezervasyon talebiniz oluşturuldu. Onay bekliyor.');
      
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
      NotificationService.error('Hata', errorMessage);
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
                  const height = (endHour - startHour) * 60 + (endMin - startMin);
                  return (
                    <div
                      key={res.id}
                      className={`schedule-item reservation-item status-${res.status}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`
                      }}
                      title={`${res.purpose || 'Rezervasyon'} - ${res.user?.full_name || 'Kullanıcı'} - ${res.status === 'approved' ? 'Onaylandı' : res.status === 'pending' ? 'Beklemede' : 'Reddedildi'}`}
                    >
                      <div className="schedule-item-name">{res.purpose || 'Rezervasyon'}</div>
                      <div className="schedule-item-time">
                        {res.start_time.substring(0, 5)} - {res.end_time.substring(0, 5)}
                      </div>
                      <div className="schedule-item-room">
                        {res.user?.name || res.user?.full_name || 'Kullanıcı'}
                      </div>
                      {res.status === 'pending' && res.user_id === user?.id && (
                        <div style={{ marginTop: '0.25rem', fontSize: '0.65rem', opacity: 0.9 }}>
                          ⏳ Beklemede
                        </div>
                      )}
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
    </div>
  );
};

export default ClassroomReservationsPage;


