import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { concertAPI, reviewAPI, uploadAPI } from '../api';
import { ConcertWithStats } from '../types';
import { useAuth } from '../context/AuthContext';

export default function CreateReview() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [concerts, setConcerts] = useState<ConcertWithStats[]>([]);
  const [selectedConcert, setSelectedConcert] = useState(searchParams.get('concertId') || '');
  const [soundScore, setSoundScore] = useState(8);
  const [stageScore, setStageScore] = useState(8);
  const [atmosphereScore, setAtmosphereScore] = useState(8);
  const [valueScore, setValueScore] = useState(8);
  const [content, setContent] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const overallScore = ((soundScore + stageScore + atmosphereScore + valueScore) / 4).toFixed(1);

  useEffect(() => {
    loadConcerts();
  }, []);

  const loadConcerts = async () => {
    try {
      const res = await concertAPI.getList({ limit: 100 });
      setConcerts(res.data.concerts);
    } catch (err) {
      console.error('加载演唱会列表失败', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const res = await uploadAPI.uploadImage(Array.from(files));
      const imageUrls = res.data.files.map(f => f.url);
      setUploadedImages(prev => [...prev, ...imageUrls]);
    } catch (err: any) {
      setError(err.response?.data?.error || '图片上传失败');
    } finally {
      setUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const res = await uploadAPI.uploadVideo(Array.from(files));
      const videoUrls = res.data.files.map(f => f.url);
      setUploadedVideos(prev => [...prev, ...videoUrls]);
    } catch (err: any) {
      setError(err.response?.data?.error || '视频上传失败');
    } finally {
      setUploading(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!selectedConcert) {
      setError('请选择演唱会');
      return;
    }

    if (!content.trim()) {
      setError('请填写评价内容');
      return;
    }

    setSubmitting(true);

    try {
      await reviewAPI.create({
        concert_id: Number(selectedConcert),
        sound_score: soundScore,
        stage_score: stageScore,
        atmosphere_score: atmosphereScore,
        value_score: valueScore,
        content: content.trim(),
        images: uploadedImages,
        videos: uploadedVideos
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setUploadedVideos(prev => prev.filter((_, i) => i !== index));
  };

  if (authLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div>
      <Header />
      
      <div className="create-review-page">
        <h1>✍️ 写演唱会评价</h1>

        {error && <div className="alert alert-error">{error}</div>}
        {success && (
          <div className="alert alert-success">
            评价提交成功！正在等待审核，稍后将在首页展示。
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>选择演唱会 *</label>
            <select 
              value={selectedConcert}
              onChange={e => setSelectedConcert(e.target.value)}
              required
            >
              <option value="">请选择你看过的演唱会</option>
              {concerts.map(concert => (
                <option key={concert.id} value={concert.id}>
                  {concert.artist} - {concert.venue} ({concert.city})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>综合评分: <span style={{ color: '#667eea', fontSize: '24px', fontWeight: '700' }}>{overallScore}</span></label>
          </div>

          <div className="form-group">
            <label>音响效果: {soundScore}分</label>
            <div className="score-slider">
              <input
                type="range"
                min="1"
                max="10"
                value={soundScore}
                onChange={e => setSoundScore(Number(e.target.value))}
              />
              <span className="score-value">{soundScore}</span>
            </div>
          </div>

          <div className="form-group">
            <label>舞台设计: {stageScore}分</label>
            <div className="score-slider">
              <input
                type="range"
                min="1"
                max="10"
                value={stageScore}
                onChange={e => setStageScore(Number(e.target.value))}
              />
              <span className="score-value">{stageScore}</span>
            </div>
          </div>

          <div className="form-group">
            <label>现场气氛: {atmosphereScore}分</label>
            <div className="score-slider">
              <input
                type="range"
                min="1"
                max="10"
                value={atmosphereScore}
                onChange={e => setAtmosphereScore(Number(e.target.value))}
              />
              <span className="score-value">{atmosphereScore}</span>
            </div>
          </div>

          <div className="form-group">
            <label>票价值不值: {valueScore}分</label>
            <div className="score-slider">
              <input
                type="range"
                min="1"
                max="10"
                value={valueScore}
                onChange={e => setValueScore(Number(e.target.value))}
              />
              <span className="score-value">{valueScore}</span>
            </div>
          </div>

          <div className="form-group">
            <label>评价内容 *</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
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
              {uploading ? '上传中...' : '📷 点击上传现场照片'}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            {uploadedImages.length > 0 && (
              <div className="upload-preview">
                {uploadedImages.map((img, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={img} alt="" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
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
              {uploading ? '上传中...' : '🎬 点击上传现场视频'}
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleVideoUpload}
            />
            {uploadedVideos.length > 0 && (
              <div className="upload-preview">
                {uploadedVideos.map((video, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <video src={video} />
                    <button
                      type="button"
                      onClick={() => removeVideo(i)}
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

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '16px', fontSize: '18px' }}
            disabled={submitting || uploading}
          >
            {submitting ? '提交中...' : '提交评价'}
          </button>
        </form>
      </div>
    </div>
  );
}
