import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ReviewCard from '../components/ReviewCard';
import { concertAPI, reviewAPI } from '../api';
import { ConcertWithStats, ReviewWithDetails } from '../types';

export default function Home() {
  const [hotConcerts, setHotConcerts] = useState<ConcertWithStats[]>([]);
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [venues, setVenues] = useState<string[]>([]);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadHotConcerts = async () => {
    try {
      const res = await concertAPI.getHot(8);
      setHotConcerts(res.data.concerts);
    } catch (err) {
      console.error('加载热门演唱会失败', err);
    }
  };

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewAPI.getList({
        artist: selectedArtist || undefined,
        venue: selectedVenue || undefined,
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
  }, [selectedArtist, selectedVenue, page]);

  const loadFilters = async () => {
    try {
      const [artistsRes, venuesRes] = await Promise.all([
        concertAPI.getArtists(),
        concertAPI.getVenues()
      ]);
      setArtists(artistsRes.data.artists);
      setVenues(venuesRes.data.venues);
    } catch (err) {
      console.error('加载筛选条件失败', err);
    }
  };

  useEffect(() => {
    loadHotConcerts();
    loadFilters();
  }, []);

  useEffect(() => {
    setPage(1);
    setReviews([]);
  }, [selectedArtist, selectedVenue]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleLoadMore = () => {
    if (reviews.length < total) {
      setPage(prev => prev + 1);
    }
  };

  const handleReviewUpdate = () => {
    setPage(1);
    setReviews([]);
    loadHotConcerts();
  };

  return (
    <div>
      <Header />
      
      <div className="container">
        <section className="section">
          <h2 className="section-title">🔥 热门演唱会</h2>
          <div className="hot-concerts">
            {hotConcerts.map(concert => (
              <div 
                key={concert.id} 
                className="hot-card"
                onClick={() => navigate(`/concert/${concert.id}`)}
              >
                <div className="poster">
                  {concert.poster ? (
                    <img src={concert.poster} alt={concert.artist} />
                  ) : (
                    '🎤'
                  )}
                </div>
                <div className="info">
                  <div className="artist">{concert.artist}</div>
                  <div className="venue">{concert.venue} · {concert.city}</div>
                  <div className="stats">
                    <div className="score">⭐ {concert.avg_overall?.toFixed(1) || '暂无'}</div>
                    <div className="weekly">{concert.weekly_reviews} 条新评价</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">📝 最新评价</h2>
          
          <div className="filters">
            <div className="filter-group">
              <label>艺人:</label>
              <select 
                value={selectedArtist}
                onChange={e => setSelectedArtist(e.target.value)}
              >
                <option value="">全部艺人</option>
                {artists.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>场馆:</label>
              <select
                value={selectedVenue}
                onChange={e => setSelectedVenue(e.target.value)}
              >
                <option value="">全部场馆</option>
                {venues.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {reviews.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="icon">🎵</div>
              <p>暂无评价，快来写第一条评价吧！</p>
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
