import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo">🎵 演唱会评价</Link>
        
        <nav className="nav">
          <Link to="/" className="nav-link">首页</Link>
          {user ? (
            <>
              <Link to="/create-review" className="nav-link">写评价</Link>
              <Link to="/profile" className="nav-link">个人中心</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="nav-link">后台管理</Link>
              )}
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                退出
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">登录</Link>
              <Link to="/register" className="btn btn-primary btn-sm">注册</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
