import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../ToastContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', passwordConfirm: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function clientValidate() {
    if (!form.name.trim()) return '이름을 입력해주세요.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return '올바른 이메일 형식이 아닙니다.';
    if (form.password.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
    if (form.password !== form.passwordConfirm) return '비밀번호가 일치하지 않습니다.';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const clientError = clientValidate();
    if (clientError) {
      setError(clientError);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await register(form);
      showToast('회원가입이 완료되었습니다. 로그인해주세요.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-logo">DayGrid</h1>
        <p className="auth-subtitle">회원가입하고 나만의 캘린더를 시작하세요</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            이름
            <input value={form.name} onChange={update('name')} required maxLength={50} />
          </label>
          <label>
            이메일
            <input type="email" value={form.email} onChange={update('email')} required autoComplete="email" />
          </label>
          <label>
            비밀번호 (최소 8자)
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <label>
            비밀번호 확인
            <input
              type="password"
              value={form.passwordConfirm}
              onChange={update('passwordConfirm')}
              required
              autoComplete="new-password"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="auth-switch">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}
