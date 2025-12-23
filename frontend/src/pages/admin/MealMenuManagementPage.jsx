import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotificationService from '../../services/notificationService';
import './MealMenuManagementPage.css';

const MealMenuManagementPage = () => {
  const { user } = useAuth();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [formData, setFormData] = useState({
    cafeteria_id: 1, // Default to first cafeteria
    date: new Date().toISOString().split('T')[0],
    meal_type: 'lunch',
    items: [''],
    nutrition: { calories: 0, protein: 0, carbs: 0 },
    price: 20.00,
    is_published: false
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      NotificationService.error('Yetki Hatası', 'Bu sayfaya sadece yöneticiler erişebilir.');
      return;
    }
    fetchMenus();
  }, [user]);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      // Get menus for next 30 days
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await api.get('/meals/menus/all', {
        params: { start: startDate, end: endDate }
      });

      setMenus(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching menus:', error);
      NotificationService.error('Hata', 'Menüler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleItemChange = (index, value) => {
    const newItems = [...formData.items];
    newItems[index] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, ''] }));
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleNutritionChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      nutrition: { ...prev.nutrition, [field]: parseFloat(value) || 0 }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        cafeteria_id: parseInt(formData.cafeteria_id),
        date: formData.date,
        meal_type: formData.meal_type,
        items_json: formData.items.filter(item => item.trim() !== ''),
        nutrition_json: {
          total: formData.nutrition,
          items: formData.items.filter(item => item.trim() !== '').map(item => ({
            name: item,
            calories: Math.round(formData.nutrition.calories / formData.items.filter(i => i.trim() !== '').length),
            protein: Math.round(formData.nutrition.protein / formData.items.filter(i => i.trim() !== '').length),
            carbs: Math.round(formData.nutrition.carbs / formData.items.filter(i => i.trim() !== '').length)
          }))
        },
        price: parseFloat(formData.price),
        is_published: formData.is_published
      };

      if (editingMenu) {
        // Update
        await api.put(`/meals/menus/${editingMenu.id}`, payload);
        NotificationService.success('Başarılı', 'Menü güncellendi.');
      } else {
        // Create
        await api.post('/meals/menus', payload);
        NotificationService.success('Başarılı', 'Menü oluşturuldu.');
      }

      setShowForm(false);
      setEditingMenu(null);
      resetForm();
      fetchMenus();
    } catch (error) {
      console.error('Error saving menu:', error);
      NotificationService.error('Hata', error.response?.data?.message || 'Menü kaydedilemedi.');
    }
  };

  const resetForm = () => {
    setFormData({
      cafeteria_id: 1,
      date: new Date().toISOString().split('T')[0],
      meal_type: 'lunch',
      items: [''],
      nutrition: { calories: 0, protein: 0, carbs: 0 },
      price: 20.00,
      is_published: false
    });
  };

  const handleEdit = (menu) => {
    setEditingMenu(menu);
    const items = menu.items_json ? (Array.isArray(menu.items_json) ? menu.items_json : JSON.parse(menu.items_json)) : [''];
    const nutrition = menu.nutrition_json ? (typeof menu.nutrition_json === 'object' ? menu.nutrition_json : JSON.parse(menu.nutrition_json)) : { total: { calories: 0, protein: 0, carbs: 0 } };

    setFormData({
      cafeteria_id: menu.cafeteria_id,
      date: menu.date,
      meal_type: menu.meal_type,
      items: items.length > 0 ? items : [''],
      nutrition: nutrition.total || nutrition || { calories: 0, protein: 0, carbs: 0 },
      price: parseFloat(menu.price) || 20.00,
      is_published: menu.is_published || false
    });
    setShowForm(true);
  };

  const handleDelete = async (menuId) => {
    const confirmed = await NotificationService.confirm(
      'Menüyü Sil',
      'Bu menüyü silmek istediğinizden emin misiniz? Aktif rezervasyonlar varsa silinemez.',
      { confirmButtonText: 'Evet, Sil', cancelButtonText: 'İptal' }
    );

    if (!confirmed.isConfirmed) return;

    try {
      await api.delete(`/meals/menus/${menuId}`);

      NotificationService.success('Başarılı', 'Menü silindi.');
      fetchMenus();
    } catch (error) {
      console.error('Error deleting menu:', error);
      NotificationService.error('Hata', error.response?.data?.message || 'Menü silinemedi.');
    }
  };

  const handleTogglePublish = async (menuId) => {
    try {
      await api.patch(`/meals/menus/${menuId}/publish`);

      NotificationService.success('Başarılı', 'Yayın durumu güncellendi.');
      fetchMenus();
    } catch (error) {
      console.error('Error toggling publish:', error);
      NotificationService.error('Hata', error.response?.data?.message || 'Yayın durumu değiştirilemedi.');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="page">
        <div className="alert alert-error">
          <strong>Yetki Hatası:</strong> Bu sayfaya sadece yöneticiler erişebilir.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner size="large" message="Menüler yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="page meal-menu-management-page">
      <div className="page-header">
        <h1>Yemek Menüsü Yönetimi</h1>
        <p className="page-subtitle">Menü oluşturun, düzenleyin ve yayınlayın</p>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingMenu(null); resetForm(); }}>
          + Yeni Menü Oluştur
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h2>{editingMenu ? 'Menü Düzenle' : 'Yeni Menü Oluştur'}</h2>
            <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingMenu(null); resetForm(); }}>
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Yemekhane ID</label>
                <input
                  type="number"
                  name="cafeteria_id"
                  value={formData.cafeteria_id}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tarih</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Öğün Tipi</label>
                <select name="meal_type" value={formData.meal_type} onChange={handleInputChange} required>
                  <option value="lunch">Öğle Yemeği</option>
                  <option value="dinner">Akşam Yemeği</option>
                </select>
              </div>
              <div className="form-group">
                <label>Fiyat (TL)</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Menü Öğeleri</label>
              {formData.items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                    placeholder="Örn: Çorba, Ana Yemek, Salata"
                    style={{ flex: 1 }}
                  />
                  {formData.items.length > 1 && (
                    <button type="button" className="btn btn-error btn-sm" onClick={() => removeItem(index)}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>
                + Öğe Ekle
              </button>
            </div>

            <div className="form-group">
              <label>Besin Değerleri (Toplam)</label>
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div>
                  <label>Kalori</label>
                  <input
                    type="number"
                    value={formData.nutrition.calories}
                    onChange={(e) => handleNutritionChange('calories', e.target.value)}
                  />
                </div>
                <div>
                  <label>Protein (g)</label>
                  <input
                    type="number"
                    value={formData.nutrition.protein}
                    onChange={(e) => handleNutritionChange('protein', e.target.value)}
                  />
                </div>
                <div>
                  <label>Karbonhidrat (g)</label>
                  <input
                    type="number"
                    value={formData.nutrition.carbs}
                    onChange={(e) => handleNutritionChange('carbs', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleInputChange}
                />
                Hemen Yayınla
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                {editingMenu ? 'Güncelle' : 'Oluştur'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingMenu(null); resetForm(); }}>
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="menus-list">
        {menus.length === 0 ? (
          <div className="empty-state-card">
            <p>Henüz menü bulunmuyor. Yeni menü oluşturun.</p>
          </div>
        ) : (
          menus.map((menu) => {
            const items = menu.items_json ? (Array.isArray(menu.items_json) ? menu.items_json : JSON.parse(menu.items_json)) : [];
            return (
              <div key={menu.id} className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>{new Date(menu.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
                      {menu.meal_type === 'lunch' ? 'Öğle Yemeği' : 'Akşam Yemeği'} • {menu.cafeteria?.name || 'Yemekhane'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge ${menu.is_published ? 'badge-success' : 'badge-warning'}`}>
                      {menu.is_published ? 'Yayında' : 'Taslak'}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Menü:</strong>
                    <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                      {items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Fiyat:</strong> {parseFloat(menu.price).toFixed(2)} TL
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(menu)}>
                      ✏️ Düzenle
                    </button>
                    <button
                      className={`btn btn-sm ${menu.is_published ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => handleTogglePublish(menu.id)}
                    >
                      {menu.is_published ? '📴 Yayından Kaldır' : '📢 Yayınla'}
                    </button>
                    <button className="btn btn-sm btn-error" onClick={() => handleDelete(menu.id)}>
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MealMenuManagementPage;
