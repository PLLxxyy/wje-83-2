import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import Header from '../components/Header';
import ReviewCard from '../components/ReviewCard';
import { reviewAPI } from '../api';
import { ReviewWithDetails } from '../types';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [likesReceived, setLikesReceived] = useState(0);
  const [favoritesReceived, setFavoritesReceived] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const res = await reviewAPI.getByUser(user.id, {
        page,
        limit: 10
      });
      setReviews(prev => page === 1 ? res.data.reviews : [...prev, ...res.data.reviews]);
      setTotal(res.data.total);
      setLikesReceived(res.data.likes_received);
      setFavoritesReceived(res.data.favorites_received);
    } catch (err) {
      console.error('加载我的评价失败', err);
    } finally {
      setLoading(false);
    }
  }, [user, page]);

  useEffect(() => {
    if (user) {
      loadReviews();
    }
  }, [loadReviews]);

  const handleLoadMore = () => {
    if (reviews.length < total) {
      setPage(prev => prev + 1);
    }
  };

  const handleReviewUpdate = () => {
    setPage(1);
    setReviews([]);
  };

  if (authLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <Header />
      
      <div className="profile-header">
        <div className="container">
          <div className="profile-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              user.username.charAt(0).toUpperCase()
            )}
          </div>
          <h1 className="profile-name">{user.username}</h1>
          <p style={{ color: '#86868b' }}>{user.email}</p>
          
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="value">{total}</div>
              <div className="label">评价数</div>
            </div>
            <div className="profile-stat">
              <div className="value">{likesReceived}</div>
              <div className="label">收到的赞</div>
            </div>
            <div className="profile-stat">
              <div className="value">{favoritesReceived}</div>
              <div className="label">收到的收藏</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <section className="section">
          <h2 className="section-title">我的评价</h2>
          
          {reviews.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="icon">🎵</div>
              <p>你还没有写过评价，快去写第一条吧！</p>
            </div>
          ) : (
            <>
              <div className="reviews-grid">
                {reviews.map(review => (
                  <ReviewCard 
                    key={review.id} 
                    review={review}
                    onUpdate={handleReviewUpdate}
                  />
                ))}
              </div>

              {loading && (
                <div className="loading">
                  <div className="spinner"></div>
                </div>
              )}

              {reviews.length < total && !loading && (
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <button className="btn btn-outline" onClick={handleLoadMore}>
                    加载更多
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
