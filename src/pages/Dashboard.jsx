import { useNavigate } from 'react-router-dom';
import { useCases } from '../context/CaseContext';
import { ChevronDown, Search, Plus, Trash2, X } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function Dashboard() {
    const { cases, addCase, deleteCase, searchCases, stats } = useCases();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    // Filter cases based on search and status
    const filteredCases = useMemo(() => {
        let result = searchQuery ? searchCases(searchQuery) : cases;

        if (statusFilter !== 'all') {
            result = result.filter(c => c.status === statusFilter);
        }

        return result;
    }, [cases, searchQuery, statusFilter, searchCases]);

    const handleCreateNewCase = () => {
        const newCase = addCase({
            title: 'คดีใหม่ (ยังไม่ตั้งชื่อ)',
            description: '',
        });
        navigate(`/cases/${newCase.id}`);
    };

    const handleOpenCase = (caseId) => {
        navigate(`/cases/${caseId}`);
    };

    const handleDeleteCase = (e, caseId) => {
        e.stopPropagation();
        setShowDeleteConfirm(caseId);
    };

    const confirmDelete = () => {
        if (showDeleteConfirm) {
            deleteCase(showDeleteConfirm);
            setShowDeleteConfirm(null);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            draft: { label: 'ร่าง', className: 'badge-draft' },
            in_review: { label: 'รอตรวจสอบ', className: 'badge-review' },
            approved: { label: 'อนุมัติ', className: 'badge-approved' },
            rejected: { label: 'ปฏิเสธ', className: 'badge-rejected' },
            archived: { label: 'เก็บถาวร', className: 'badge-archived' },
        };
        const s = statusMap[status] || { label: status, className: 'badge-draft' };
        return <span className={s.className}>{s.label}</span>;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const caseToDelete = cases.find(c => c.id === showDeleteConfirm);

    return (
        <section>
            {/* Stats */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem 1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.totalCases}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>คดีทั้งหมด</div>
                </div>
                <div style={{ padding: '1rem 1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.totalPeople}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>บุคคลที่เกี่ยวข้อง</div>
                </div>
                <div style={{ padding: '1rem 1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.totalDocuments}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>เอกสาร</div>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button className="btn btn-black" onClick={handleCreateNewCase}>
                        <Plus size={16} /> คดีใหม่
                    </button>

                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                        <input
                            type="text"
                            placeholder="ค้นหาเลขคดี, ชื่อคดี, ชื่อบุคคล..."
                            className="form-input"
                            style={{ width: '300px', marginBottom: 0, paddingLeft: '36px' }}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#999'
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <select
                        className="form-input"
                        style={{ width: 'auto', marginBottom: 0 }}
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">สถานะทั้งหมด</option>
                        <option value="draft">ร่าง</option>
                        <option value="in_review">รอตรวจสอบ</option>
                        <option value="approved">อนุมัติ</option>
                        <option value="rejected">ปฏิเสธ</option>
                        <option value="archived">เก็บถาวร</option>
                    </select>
                </div>

                <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    แสดง {filteredCases.length} จาก {cases.length} คดี
                </div>
            </div>

            {/* Table */}
            <table className="data-table">
                <thead>
                    <tr>
                        <th style={{ width: '150px' }}>เลขคดี</th>
                        <th>ชื่อคดี / รายละเอียด</th>
                        <th style={{ width: '120px' }}>วันที่สร้าง</th>
                        <th style={{ width: '100px' }}>สถานะ</th>
                        <th style={{ width: '80px' }}>บุคคล</th>
                        <th style={{ width: '60px' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {filteredCases.length === 0 ? (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                                {searchQuery ? `ไม่พบคดีที่ตรงกับ "${searchQuery}"` : 'ยังไม่มีคดี กดปุ่ม "+ คดีใหม่" เพื่อสร้าง'}
                            </td>
                        </tr>
                    ) : (
                        filteredCases.map(c => (
                            <tr key={c.id} onClick={() => handleOpenCase(c.id)} style={{ cursor: 'pointer' }}>
                                <td>
                                    <code style={{ fontSize: '0.85rem' }}>{c.id}</code>
                                </td>
                                <td>
                                    <b>{c.title}</b>
                                    {c.description && (
                                        <>
                                            <br />
                                            <span style={{ color: '#999', fontSize: '0.8rem' }}>{c.description}</span>
                                        </>
                                    )}
                                </td>
                                <td>{formatDate(c.createdAt)}</td>
                                <td>{getStatusBadge(c.status)}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <span style={{
                                        background: '#f0f0f0',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem'
                                    }}>
                                        {c.people?.length || 0}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="btn btn-danger-outline"
                                        style={{ padding: '4px 8px', minWidth: 'auto' }}
                                        onClick={(e) => handleDeleteCase(e, c.id)}
                                        title="ลบคดี"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>ยืนยันการลบคดี</h3>
                        <p style={{ color: '#666', margin: '1rem 0' }}>
                            คุณต้องการลบคดี "{caseToDelete?.title}" ใช่หรือไม่?
                            <br />
                            <code style={{ fontSize: '0.85rem' }}>{caseToDelete?.id}</code>
                            <br /><br />
                            <span style={{ color: '#D32F2F', fontSize: '0.85rem' }}>
                                คำเตือน: การลบคดีจะลบข้อมูลบุคคลและเอกสารทั้งหมดที่เกี่ยวข้อง
                            </span>
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn btn-white" onClick={() => setShowDeleteConfirm(null)}>
                                <X size={16} /> ยกเลิก
                            </button>
                            <button className="btn btn-danger-outline" onClick={confirmDelete}>
                                <Trash2 size={16} /> ลบคดี
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
