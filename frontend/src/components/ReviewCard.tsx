import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ReviewWithDetails } from '../types';
import { reviewAPI, uploadAPI } from '../api';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [hasPendingEdit, setHasPendingEdit] = useState(false);

  const [editSoundScore, setEditSoundScore] = useState(review.sound_score);
  const [editStageScore, setEditStageScore] = useState(review.stage_score);
  const [editAtmosphereScore, setEditAtmosphereScore] = useState(review.atmosphere_score);
  const [editValueScore, setEditValueScore] = useState(review.value_score);
  const [editContent, setEditContent] = useState(review.content);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editVideos, setEditVideos] = useState<string[]>([]);
  const [editUploading, setEditUploading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);

  const isOwner = user && user.id === review.user_id;

  useEffect(() => {
    if (isOwner) {
      reviewAPI.getPendingEdit(review.id).then(res => {
        setHasPendingEdit(!!res.data.pending_edit);
      }).catch(() => {});
    }
  }, [isOwner, review.id]);

  useEffect(() => {
    if (showEditModal) {
      setEditSoundScore(review.sound_score);
      setEditStageScore(review.stage_score);
      setEditAtmosphereScore(review.atmosphere_score);
      setEditValueScore(review.value_score);
      setEditContent(review.content);
      setEditImages(JSON.parse(review.images || '[]'));
      setEditVideos(JSON.parse(review.videos || '[]'));
      setEditError('');
      setEditSuccess(false);
    }
  }, [showEditModal, review]);

  const editOverallScore = ((editSoundScore + editStageScore + editAtmosphereScore + editValueScore) / 4).toFixed(1);

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

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setEditUploading(true);
    setEditError('');

    try {
      const res = await uploadAPI.uploadImage(Array.from(files));
      const imageUrls = res.data.files.map(f => f.url);
      setEditImages(prev => [...prev, ...imageUrls]);
    } catch (err: any) {
      setEditError(err.response?.data?.error || '图片上传失败');
    } finally {
      setEditUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleEditVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setEditUploading(true);
    setEditError('');

    try {
      const res = await uploadAPI.uploadVideo(Array.from(files));
      const videoUrls = res.data.files.map(f => f.url);
      setEditVideos(prev => [...prev, ...videoUrls]);
    } catch (err: any) {
      setEditError(err.response?.data?.error || '视频上传失败');
    } finally {
      setEditUploading(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const removeEditImage = (index: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeEditVideo = (index: number) => {
    setEditVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess(false);

    if (!editContent.trim()) {
      setEditError('请填写评价内容');
      return;
    }

    setEditSubmitting(true);

    try {
      await reviewAPI.update(review.id, {
        sound_score: editSoundScore,
        stage_score: editStageScore,
        atmosphere_score: editAtmosphereScore,
        value_score: editValueScore,
        content: editContent.trim(),
        images: editImages,
        videos: editVideos
      });

      setEditSuccess(true);
      setHasPendingEdit(true);
      setTimeout(() => {
        setShowEditModal(false);
        onUpdate?.();
      }, 2500);
    } catch (err: any) {
      setEditError(err.response?.data?.error || '提交失败');
    } finally {
      setEditSubmitting(false);
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

      {isOwner && hasPendingEdit && (
        <div className="alert" style={{ background: '#fff8e6', color: '#9a6700', border: '1px solid #ffe58f', margin: '12px 0', fontSize: '13px' }}>
          ⏳ 你提交的编辑版本正在审核中，审核通过后将更新展示。
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
        {isOwner && (
          <button
            className={`action-btn ${hasPendingEdit ? 'disabled' : ''}`}
            onClick={() => !hasPendingEdit && setShowEditModal(true)}
            disabled={hasPendingEdit}
            title={hasPendingEdit ? '已有编辑版本正在审核中' : '编辑评价'}
          >
            ✏️ {hasPendingEdit ? '审核中' : '编辑'}
          </button>
        )}
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

      {showEditModal && (
        <div className="modal-overlay" onClick={() => !editSubmitting && setShowEditModal(false)}>
          <div className="modal-content edit-modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">✏️ 编辑评价</h3>

            <div className="edit-concert-info">
              <span style={{ fontSize: '14px', color: '#666' }}>演唱会：</span>
              <span style={{ fontWeight: '600' }}>{review.artist} - {review.venue}</span>
            </div>

            <div className="alert" style={{ background: '#e6f7ff', color: '#0050b3', border: '1px solid #91d5ff', fontSize: '13px' }}>
              💡 编辑后将生成新的审核版本，审核通过前原评价保持不变。
            </div>

            {editError && <div className="alert alert-error">{editError}</div>}
            {editSuccess && (
              <div className="alert alert-success">
                编辑版本已提交，正在等待审核！审核通过后将更新展示。
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>综合评分: <span style={{ color: '#667eea', fontSize: '24px', fontWeight: '700' }}>{editOverallScore}</span></label>
              </div>

              <div className="form-group">
                <label>音响效果: {editSoundScore}分</label>
                <div className="score-slider">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={editSoundScore}
                    onChange={e => setEditSoundScore(Number(e.target.value))}
                  />
                  <span className="score-value">{editSoundScore}</span>
                </div>
              </div>

              <div className="form-group">
                <label>舞台设计: {editStageScore}分</label>
                <div className="score-slider">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={editStageScore}
                    onChange={e => setEditStageScore(Number(e.target.value))}
                  />
                  <span className="score-value">{editStageScore}</span>
                </div>
              </div>

              <div className="form-group">
                <label>现场气氛: {editAtmosphereScore}分</label>
                <div className="score-slider">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={editAtmosphereScore}
                    onChange={e => setEditAtmosphereScore(Number(e.target.value))}
                  />
                  <span className="score-value">{editAtmosphereScore}</span>
                </div>
              </div>

              <div className="form-group">
                <label>票价值不值: {editValueScore}分</label>
                <div className="score-slider">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={editValueScore}
                    onChange={e => setEditValueScore(Number(e.target.value))}
                  />
                  <span className="score-value">{editValueScore}</span>
                </div>
              </div>

              <div className="form-group">
                <label>评价内容 *</label>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={6}
                  placeholder="分享你的演唱会体验，描述现场的感受、精彩瞬间、印象深刻的表演等..."
                  required
                />
              </div>

              <div className="form-group">
                <label>上传照片 (最多9张)</label>
                <div
                  className="upload-area"
                  onClick={() => imageInputRef.current?.click()}
                >
                  {editUploading ? '上传中...' : '📷 点击上传现场照片'}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleEditImageUpload}
                />
                {editImages.length > 0 && (
                  <div className="upload-preview">
                    {editImages.map((img, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={img} alt="" />
                        <button
                          type="button"
                          onClick={() => removeEditImage(i)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>上传视频 (最多3个)</label>
                <div
                  className="upload-area"
                  onClick={() => videoInputRef.current?.click()}
                >
                  {editUploading ? '上传中...' : '🎬 点击上传现场视频'}
                </div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleEditVideoUpload}
                />
                {editVideos.length > 0 && (
                  <div className="upload-preview">
                    {editVideos.map((video, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <video src={video} />
                        <button
                          type="button"
                          onClick={() => removeEditVideo(i)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={editSubmitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSubmitting || editUploading}
                >
                  {editSubmitting ? '提交中...' : '提交审核'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
