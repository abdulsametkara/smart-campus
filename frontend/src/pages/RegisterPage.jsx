import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';

const schema = yup.object({
  full_name: yup.string().min(2, 'En az 2 karakter').required('Ad soyad gerekli'),
  email: yup.string().email('Geçersiz email').required('Email gerekli'),
  password: yup
    .string()
    .min(8, 'En az 8 karakter')
    .matches(/[A-Z]/, 'Bir büyük harf içermeli')
    .matches(/[0-9]/, 'Bir rakam içermeli')
    .required('Şifre gerekli'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Şifreler eşleşmiyor')
    .required('Şifre tekrarı gerekli'),
  role: yup.string().oneOf(['student', 'faculty']).required('Rol seçimi gerekli'),
  student_number: yup.string().when('role', {
    is: 'student',
    then: (schema) => schema.required('Öğrenci numarası gerekli'),
    otherwise: (schema) => schema.notRequired(),
  }),
  employee_number: yup.string().when('role', {
    is: 'faculty',
    then: (schema) => schema.required('Personel numarası gerekli'),
    otherwise: (schema) => schema.notRequired(),
  }),
  department_id: yup.number().required('Bölüm seçimi gerekli').typeError('Bölüm seçimi gerekli'),
  terms: yup.boolean().oneOf([true], 'Kullanım koşullarını kabul etmelisiniz'),
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [departments, setDepartments] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ 
    resolver: yupResolver(schema), 
    defaultValues: { role: 'student', terms: false } 
  });

  const selectedRole = useWatch({ control, name: 'role' });

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await api.get('/departments');
        setDepartments(res.data || []);
      } catch {
        setDepartments([
          { id: 1, name: 'Bilgisayar Mühendisliği', code: 'CENG' },
          { id: 2, name: 'Elektrik-Elektronik Mühendisliği', code: 'EEE' },
          { id: 3, name: 'Makine Mühendisliği', code: 'ME' },
          { id: 4, name: 'İşletme', code: 'BA' },
        ]);
      }
    };
    loadDepartments();
  }, []);

  const onSubmit = async (values) => {
    setError('');
    setSuccess('');
    try {
      const payload = {
        full_name: values.full_name,
        email: values.email,
        password: values.password,
        role: values.role,
        department_id: values.department_id,
      };
      if (values.role === 'student') {
        payload.student_number = values.student_number;
      } else {
        payload.employee_number = values.employee_number;
      }
      await api.post('/auth/register', payload);
      setSuccess('Kayıt başarılı! Email adresinize doğrulama linki gönderildi.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Kayıt başarısız');
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-header">
          <p className="eyebrow">Campy</p>
          <h2>Kayıt Ol</h2>
          <p>Hesap oluştur ve kampüs sistemine katıl.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-field">
            <label htmlFor="full_name">Ad Soyad</label>
            <input id="full_name" type="text" placeholder="Adınız Soyadınız" {...register('full_name')} />
            {errors.full_name && <small>{errors.full_name.message}</small>}
          </div>

          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="ornek@universite.edu.tr" {...register('email')} />
            {errors.email && <small>{errors.email.message}</small>}
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="password">Şifre</label>
              <input id="password" type="password" placeholder="En az 8 karakter" {...register('password')} />
              {errors.password && <small>{errors.password.message}</small>}
            </div>
            <div className="form-field">
              <label htmlFor="confirmPassword">Şifre Tekrar</label>
              <input id="confirmPassword" type="password" placeholder="Şifreyi tekrar girin" {...register('confirmPassword')} />
              {errors.confirmPassword && <small>{errors.confirmPassword.message}</small>}
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="role">Kullanıcı Tipi</label>
              <select id="role" {...register('role')}>
                <option value="student">Öğrenci</option>
                <option value="faculty">Akademisyen</option>
              </select>
              {errors.role && <small>{errors.role.message}</small>}
            </div>
            <div className="form-field">
              <label htmlFor="department_id">Bölüm</label>
              <select id="department_id" {...register('department_id')}>
                <option value="">Bölüm seçin</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {errors.department_id && <small>{errors.department_id.message}</small>}
            </div>
          </div>

          {selectedRole === 'student' && (
            <div className="form-field">
              <label htmlFor="student_number">Öğrenci Numarası</label>
              <input id="student_number" type="text" placeholder="202012345" {...register('student_number')} />
              {errors.student_number && <small>{errors.student_number.message}</small>}
            </div>
          )}

          {selectedRole === 'faculty' && (
            <div className="form-field">
              <label htmlFor="employee_number">Personel Numarası</label>
              <input id="employee_number" type="text" placeholder="EMP001" {...register('employee_number')} />
              {errors.employee_number && <small>{errors.employee_number.message}</small>}
            </div>
          )}

          <div className="form-field checkbox-field">
            <label className="checkbox-label">
              <input type="checkbox" {...register('terms')} />
              <span>Kullanım koşullarını ve gizlilik politikasını kabul ediyorum</span>
            </label>
            {errors.terms && <small>{errors.terms.message}</small>}
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          
          <button className="btn" type="submit" disabled={isSubmitting} style={{ width: '100%' }}>
            {isSubmitting ? 'Kaydediliyor...' : 'Kayıt Ol'}
          </button>
        </form>
        <div className="inline-links">
          <Link to="/login">Zaten hesabın var mı? Giriş yap</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
