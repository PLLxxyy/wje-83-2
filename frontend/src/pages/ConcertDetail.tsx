import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ReviewCard from '../components/ReviewCard';
import { concertAPI, reviewAPI } from '../api';
import { ConcertWithStats, ReviewWithDetails } from '../types';
import { useAuth } from '../context/AuthContext';

export default function ConcertDetail() {
  const { id } = useParams<{ id: string }>();
  const [concert, setConcert] = useState<ConcertWithStats | null>(null);
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadConcert = async () => {
    try {
      const res = await concertAPI.getById(Number(id));
      setConcert(res.data.concert);
    } catch (err) {
      console.error('加载演唱会信息失败', err);
    }
  };

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewAPI.getByConcert(Number(id), {
        page,
        limit: 10
      });
      setReviews(prev => page === 1 ? res.data.reviews : [...prev, ...res.data.reviews]);
      setTotal(res.data.total);
    } catch (err) {
      console.error('加载评价失败', err);
    } finally {
      setLoading(false);
    }
  }, [id, page]);

  useEffect(() => {
    loadConcert();
  }, [id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleLoadMore = () => {
    if (reviews.length < total) {
      setPage(prev => prev + 1);
    }
  };

  const handleWriteReview = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/create-review?concertId=${id}`);
  };

  const handleReviewUpdate = () => {
    setPage(1);
    setReviews([]);
    loadConcert();
  };

  if (!concert) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      
      <div className="concert-header">
        <div className="container concert-header-content">
          <div className="concert-poster">
            {concert.poster ? (
              <img src={concert.poster} alt={concert.artist} />
            ) : (
              '🎤'
            )}
          </div>
          <div className="concert-info">
            <h1>{concert.artist}</h1>
            <p className="sub-info">
              📍 {concert.venue} · {concert.city} · 📅 {new Date(concert.date).toLocaleDateString('zh-CN')}
            </p>
            <button className="btn btn-primary" onClick={handleWriteReview}>
              ✍️ 写评价
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="concert-stats" style={{ background: '#fff', marginTop: '-40px', position: 'relative', zIndex: 10 }}>
          <div className="overall-score">
            <span className="value">{concert.avg_overall?.toFixed(1) || '暂无'}</span>
            <span className="label">综合评分 · {concert.review_count} 条评价</span>
          </div>
          <div className="dimension-scores">
            <div className="dimension-score">
              <div className="value">{concert.avg_sound?.toFixed(1) || '-'}</div>
              <div className="label">音响效果</div>
            </div>
            <div className="dimension-score">
              <div className="value">{concert.avg_stage?.toFixed(1) || '-'}</div>
              <div className="label">舞台设计</div>
            </div>
            <div className="dimension-score">
              <div className="value">{concert.avg_atmosphere?.toFixed(1) || '-'}</div>
              <div className="label">现场气氛</div>
            </div>
            <div className="dimension-score">
              <div className="value">{concert.avg_value?.toFixed(1) || '-'}</div>
              <div className="label">票价值不值</div>
            </div>
          </div>
        </div>

        <section className="section">
          <h2 className="section-title">全部评价 ({total})</h2>
          
          {reviews.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="icon">🎵</div>
              <p>还没有评价，快来写第一条评价吧！</p>
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleWriteReview}>
                写评价
              </button>
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
