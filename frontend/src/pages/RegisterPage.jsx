import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Swal from 'sweetalert2';
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

const PasswordStrengthMeter = ({ password }) => {
  if (!password) return null;

  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const colors = ['#e5e7eb', '#ef4444', '#f59e0b', '#10b981', '#059669'];
  const labels = ['Yok', 'Zayıf', 'Orta', 'Güçlü', 'Çok Güçlü'];
  const width = (strength / 4) * 100;

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ height: '4px', width: '100%', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${width}%`, background: colors[strength], transition: 'width 0.3s' }}></div>
      </div>
      <p style={{ fontSize: '0.75rem', color: colors[strength], marginTop: '0.25rem', textAlign: 'right' }}>
        {labels[strength]}
      </p>
    </div>
  );
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { role: 'student', terms: false }
  });

  const selectedRole = useWatch({ control, name: 'role' });
  const passwordValue = watch('password'); // Şifreyi anlık izle

  // ... (useEffect same as before)
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

      // SweetAlert Success
      Swal.fire({
        icon: 'success',
        title: 'Kayıt Başarılı! 🎉',
        text: 'Lütfen e-posta adresinize gönderilen linke tıklayarak hesabınızı doğrulayın.',
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Giriş Yap'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        }
      });

    } catch (err) {
      // SweetAlert Error
      Swal.fire({
        icon: 'error',
        title: 'Kayıt Başarısız 😔',
        text: err?.response?.data?.message || 'Bir hata oluştu.',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Tamam'
      });
    }
  };

  return (
    <div
      className="auth-page"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/images/recep-tayyip-erdogan-universitesi.webp)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="card auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-header">
          <h2 className="app-brand" style={{ display: 'inline-block', fontSize: '2.5rem', marginBottom: '1rem' }}>Campy</h2>
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
              <PasswordStrengthMeter password={passwordValue} />
              {errors.password && <small>{errors.password.message}</small>}
            </div>
            <div className="form-field">
              <label htmlFor="confirmPassword">Şifre Tekrar</label>
              <input id="confirmPassword" type="password" placeholder="Şifreyi tekrar girin" {...register('confirmPassword')} />
              {errors.confirmPassword && <small>{errors.confirmPassword.message}</small>}
            </div>
          </div>

          {/* ... Role/Department/Numbers same ... */}
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

          <div className="checkbox-wrapper">
            <label className="checkbox-label">
              <input type="checkbox" {...register('terms')} />
              <span>Kullanım koşullarını ve gizlilik politikasını kabul ediyorum</span>
            </label>
            {errors.terms && <small>{errors.terms.message}</small>}
          </div>


          <button className="btn" type="submit" disabled={isSubmitting} style={{ width: '100%' }}>
            {isSubmitting ? 'Kaydediliyor...' : 'Kayıt Ol'}
          </button>
        </form>
        <div className="inline-links" style={{ justifyContent: 'center' }}>
          <Link to="/login">Zaten hesabın var mı? Giriş yap</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
