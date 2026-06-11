import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ReviewWithDetails } from '../types';
import { reviewAPI } from '../api';
import { useAuth } from '../context/AuthContext';

interface ReviewCardProps {
  review: ReviewWithDetails;
  onUpdate?: () => void;
}

export default function ReviewCard({ review, onUpdate }: ReviewCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await reviewAPI.like(review.id);
      onUpdate?.();
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await reviewAPI.favorite(review.id);
      onUpdate?.();
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      alert('请填写举报原因');
      return;
    }
    try {
      await reviewAPI.report(review.id, reportReason);
      alert('举报已提交');
      setShowReportModal(false);
      setReportReason('');
    } catch (err: any) {
      alert(err.response?.data?.error || '举报失败');
    }
  };

  const images = JSON.parse(review.images || '[]');
  const videos = JSON.parse(review.videos || '[]');

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="avatar">
          {review.user_avatar ? (
            <img src={review.user_avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            review.username.charAt(0).toUpperCase()
          )}
        </div>
        <div className="review-user-info">
          <div className="username">{review.username}</div>
          <div className="time">{new Date(review.created_at).toLocaleString('zh-CN')}</div>
        </div>
      </div>

      <Link to={`/concert/${review.concert_id}`}>
        <div className="review-concert">
          <div className="artist">{review.artist}</div>
          <div className="venue">{review.venue} · {new Date(review.concert_date).toLocaleDateString('zh-CN')}</div>
        </div>
      </Link>

      <div className="review-overall">
        <span className="overall-label">综合评分</span>
        <span className="overall-value">{review.overall_score.toFixed(1)}</span>
      </div>

      <div className="review-scores">
        <div className="score-item">
          <span className="label">音响效果</span>
          <span className="value">{review.sound_score}</span>
        </div>
        <div className="score-item">
          <span className="label">舞台设计</span>
          <span className="value">{review.stage_score}</span>
        </div>
        <div className="score-item">
          <span className="label">现场气氛</span>
          <span className="value">{review.atmosphere_score}</span>
        </div>
        <div className="score-item">
          <span className="label">票价值不值</span>
          <span className="value">{review.value_score}</span>
        </div>
      </div>

      <p className="review-content">{review.content}</p>

      {images.length > 0 && (
        <div className="review-media">
          {images.slice(0, 9).map((img: string, i: number) => (
            <img key={i} src={img} alt="" />
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="review-media">
          {videos.slice(0, 3).map((video: string, i: number) => (
            <video key={i} src={video} controls />
          ))}
        </div>
      )}

      <div className="review-actions">
        <button 
          className={`action-btn ${review.is_liked ? 'active' : ''}`}
          onClick={handleLike}
        >
          ❤️ {review.likes_count}
        </button>
        <button 
          className={`action-btn ${review.is_favorited ? 'active favorited' : ''}`}
          onClick={handleFavorite}
        >
          ⭐ {review.favorites_count}
        </button>
        <button className="action-btn" onClick={() => setShowReportModal(true)}>
          🚩 举报
        </button>
      </div>

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">举报评价</h3>
            <div className="form-group">
              <label>举报原因</label>
              <textarea 
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                rows={4}
                placeholder="请描述举报原因..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowReportModal(false)}>取消</button>
              <button className="btn btn-danger" onClick={handleReport}>提交举报</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
