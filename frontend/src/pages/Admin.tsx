import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { adminAPI } from '../api';
import { ArtistStats, Report, ReviewWithDetails } from '../types';
import { useAuth } from '../context/AuthContext';

type Tab = 'dashboard' | 'reviews' | 'reports';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  if (authLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="logo">🎵 管理后台</div>
        <nav className="admin-nav">
          <button 
            className={`admin-nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 数据看板
          </button>
          <button 
            className={`admin-nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            ✍️ 评价审核
          </button>
          <button 
            className={`admin-nav-link ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            🚩 投诉处理
          </button>
          <Link to="/" className="admin-nav-link" style={{ marginTop: 'auto' }}>
            🏠 返回首页
          </Link>
        </nav>
      </aside>

      <main className="admin-content">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'reviews' && <AdminReviews />}
        {activeTab === 'reports' && <AdminReports />}
      </main>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [artistStats, setArtistStats] = useState<ArtistStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overviewRes, artistRes] = await Promise.all([
        adminAPI.getOverviewStats(),
        adminAPI.getArtistStats()
      ]);
      setStats(overviewRes.data);
      setArtistStats(artistRes.data.stats);
    } catch (err) {
      console.error('加载统计数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const maxReviews = Math.max(...artistStats.map(s => s.review_count), 1);

  return (
    <div>
      <div className="admin-header">
        <h1>📊 数据看板</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">总用户数</div>
          <div className="value">{stats?.total_users || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">总演唱会数</div>
          <div className="value">{stats?.total_concerts || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">总评价数</div>
          <div className="value">{stats?.total_reviews || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">待审核评价</div>
          <div className="value" style={{ color: '#ff9500' }}>{stats?.pending_reviews || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">待处理投诉</div>
          <div className="value" style={{ color: '#ff3b30' }}>{stats?.pending_reports || 0}</div>
        </div>
      </div>

      <h2 style={{ marginBottom: '20px' }}>艺人评价统计</h2>
      <div className="artist-stats-chart">
        {artistStats.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📊</div>
            <p>暂无统计数据</p>
          </div>
        ) : (
          artistStats.map((stat, index) => (
            <div key={index} className="chart-bar">
              <div className="artist-name">{stat.artist}</div>
              <div className="bar-container">
                <div 
                  className="bar-fill" 
                  style={{ width: `${(stat.review_count / maxReviews) * 100}%` }}
                />
              </div>
              <div className="bar-value">
                {stat.review_count} 条 · {stat.avg_overall?.toFixed(1)}分
              </div>
            </div>
          ))
        )}
      </div>

      <h2 style={{ marginBottom: '20px', marginTop: '40px' }}>各维度平均分</h2>
      <div className="artist-stats-chart">
        <table className="table" style={{ marginTop: 0 }}>
          <thead>
            <tr>
              <th>艺人</th>
              <th>评价数</th>
              <th>综合分</th>
              <th>音响</th>
              <th>舞台</th>
              <th>气氛</th>
              <th>票价</th>
            </tr>
          </thead>
          <tbody>
            {artistStats.map((stat, index) => (
              <tr key={index}>
                <td><strong>{stat.artist}</strong></td>
                <td>{stat.review_count}</td>
                <td style={{ color: '#667eea', fontWeight: '700' }}>{stat.avg_overall?.toFixed(1) || '-'}</td>
                <td>{stat.avg_sound?.toFixed(1) || '-'}</td>
                <td>{stat.avg_stage?.toFixed(1) || '-'}</td>
                <td>{stat.avg_atmosphere?.toFixed(1) || '-'}</td>
                <td>{stat.avg_value?.toFixed(1) || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginBottom: '20px', marginTop: '40px' }}>最近评价</h2>
      <div className="artist-stats-chart">
        {stats?.recent_reviews?.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📝</div>
            <p>暂无评价</p>
          </div>
        ) : (
          <table className="table" style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th>用户</th>
                <th>演唱会</th>
                <th>评分</th>
                <th>内容</th>
                <th>时间</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_reviews?.map((review: ReviewWithDetails) => (
                <tr key={review.id}>
                  <td>{review.username}</td>
                  <td>{review.artist}</td>
                  <td style={{ color: '#667eea', fontWeight: '700' }}>{review.overall_score.toFixed(1)}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {review.content}
                  </td>
                  <td>{new Date(review.created_at).toLocaleString('zh-CN')}</td>
                  <td>
                    <span className={`status-badge status-${review.status}`}>
                      {review.status === 'approved' ? '已通过' : review.status === 'rejected' ? '已拒绝' : '待审核'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [page]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getPendingReviews({ page, limit: 10 });
      setReviews(res.data.reviews);
      setTotal(res.data.total);
    } catch (err) {
      console.error('加载待审核评价失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await adminAPI.approveReview(id);
      loadReviews();
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('确定要拒绝这条评价吗？')) return;
    try {
      await adminAPI.rejectReview(id);
      loadReviews();
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h1>✍️ 评价审核</h1>
        <span style={{ color: '#86868b' }}>待审核: {total} 条</span>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="empty-state">
          <div className="icon">✅</div>
          <p>所有评价都已审核完成！</p>
        </div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>用户</th>
                <th>演唱会</th>
                <th>评分</th>
                <th>内容</th>
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <tr key={review.id}>
                  <td>{review.username}</td>
                  <td>
                    <div><strong>{(review as any).artist}</strong></div>
                    <div style={{ fontSize: '12px', color: '#86868b' }}>{(review as any).venue}</div>
                  </td>
                  <td style={{ color: '#667eea', fontWeight: '700' }}>{review.overall_score.toFixed(1)}</td>
                  <td style={{ maxWidth: '300px' }}>{review.content}</td>
                  <td>{new Date(review.created_at).toLocaleString('zh-CN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(review.id)}
                      >
                        通过
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(review.id)}
                      >
                        拒绝
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {total > 10 && (
            <div className="pagination">
              {Array.from({ length: Math.ceil(total / 10) }, (_, i) => (
                <button
                  key={i}
                  className={`page-btn ${page === i + 1 ? 'active' : ''}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'dismissed'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [page, filter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getReports({ status: filter, page, limit: 10 });
      setReports(res.data.reports);
      setTotal(res.data.total);
    } catch (err) {
      console.error('加载投诉列表失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: number, removeReview: boolean) => {
    const confirmMsg = removeReview 
      ? '确定要解决此投诉并删除相关评价吗？'
      : '确定要解决此投诉吗？';
    if (!confirm(confirmMsg)) return;
    
    try {
      await adminAPI.resolveReport(id, removeReview ? 'remove_review' : undefined);
      loadReports();
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleDismiss = async (id: number) => {
    if (!confirm('确定要驳回此投诉吗？')) return;
    try {
      await adminAPI.dismissReport(id);
      loadReports();
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h1>🚩 投诉处理</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['pending', 'resolved', 'dismissed'] as const).map(status => (
            <button
              key={status}
              className={`btn ${filter === status ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => { setFilter(status); setPage(1); }}
            >
              {status === 'pending' ? '待处理' : status === 'resolved' ? '已解决' : '已驳回'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🚫</div>
          <p>暂无{filter === 'pending' ? '待处理' : filter === 'resolved' ? '已解决' : '已驳回'}的投诉</p>
        </div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>举报人</th>
                <th>被举报评价</th>
                <th>举报原因</th>
                <th>举报时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report.id}>
                  <td>{report.reporter_name}</td>
                  <td>
                    <div><strong>{report.artist}</strong></div>
                    <div style={{ fontSize: '12px', color: '#86868b' }}>
                      用户: {report.reviewer_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#86868b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {report.review_content}
                    </div>
                  </td>
                  <td style={{ maxWidth: '200px' }}>{report.reason}</td>
                  <td>{new Date(report.created_at).toLocaleString('zh-CN')}</td>
                  <td>
                    <span className={`status-badge status-${report.status}`}>
                      {report.status === 'pending' ? '待处理' : report.status === 'resolved' ? '已解决' : '已驳回'}
                    </span>
                  </td>
                  <td>
                    {report.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleResolve(report.id, false)}
                        >
                          标记解决
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleResolve(report.id, true)}
                        >
                          删除评价
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDismiss(report.id)}
                        >
                          驳回
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {total > 10 && (
            <div className="pagination">
              {Array.from({ length: Math.ceil(total / 10) }, (_, i) => (
                <button
                  key={i}
                  className={`page-btn ${page === i + 1 ? 'active' : ''}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
