import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const AdminLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

    const loadLogs = async (page = 1) => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/logs?page=${page}&limit=20`);
            if (res.data) {
                setLogs(res.data.data);
                setMeta(res.data.meta);
            }
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: 'Loglar yüklenirken bir sorun oluştu.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs(1);
    }, []);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            loadLogs(newPage);
        }
    };

    const getActionBadgeColor = (action) => {
        switch (action) {
            case 'LOGIN': return '#10b981'; // Green
            case 'LOGOUT': return '#6b7280'; // Gray
            case 'REGISTER': return '#3b82f6'; // Blue
            default: return '#8b5cf6'; // Purple
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Sistem Logları</h1>
                    <p className="page-subtitle">Kullanıcı aktivitelerini ve sistem olaylarını izleyin.</p>
                </div>
                <button className="btn" onClick={() => loadLogs(meta.page)}>
                    🔄 Yenile
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Zaman</th>
                                    <th>Kullanıcı</th>
                                    <th>Eylem</th>
                                    <th>IP Adresi</th>
                                    <th>Tarayıcı / Cihaz</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                            Henüz kayıtlı log bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => {
                                        // DEBUG LOG
                                        console.log('Log Item:', log);
                                        return (
                                            <tr key={log.id}>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    {new Date(log.created_at || log.createdAt).toLocaleString('tr-TR')}
                                                </td>
                                                <td>
                                                    <div className="user-cell">
                                                        <div>
                                                            <div className="user-name">{log.user?.full_name || 'Silinmiş Kullanıcı'}</div>
                                                            <div className="user-email">{log.user?.email || '-'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span
                                                        className="badge"
                                                        style={{
                                                            backgroundColor: getActionBadgeColor(log.action) + '20',
                                                            color: getActionBadgeColor(log.action),
                                                            border: `1px solid ${getActionBadgeColor(log.action)}40`
                                                        }}
                                                    >
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td style={{ fontFamily: 'monospace' }}>{log.ip_address || '-'}</td>
                                                <td style={{ fontSize: '0.8rem', maxWidth: '300px' }} title={log.user_agent}>
                                                    {log.user_agent ? (log.user_agent.length > 50 ? log.user_agent.substring(0, 50) + '...' : log.user_agent) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {meta.totalPages > 1 && (
                            <div className="pagination-wrapper" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                <button
                                    className="btn sm outline"
                                    onClick={() => handlePageChange(meta.page - 1)}
                                    disabled={meta.page === 1}
                                >
                                    ← Önceki
                                </button>
                                <span className="pagination-info" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    Sayfa {meta.page} / {meta.totalPages}
                                </span>
                                <button
                                    className="btn sm outline"
                                    onClick={() => handlePageChange(meta.page + 1)}
                                    disabled={meta.page === meta.totalPages}
                                >
                                    Sonraki →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminLogsPage;
