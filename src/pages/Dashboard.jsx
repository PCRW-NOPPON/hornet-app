import { useNavigate } from 'react-router-dom';
import { useCases } from '../context/CaseContext';
import { ChevronDown } from 'lucide-react';

export default function Dashboard() {
    const { cases, addCase } = useCases();
    const navigate = useNavigate();

    const handleCreateNewCase = () => {
        const newId = `NEW-${Date.now()}`;
        addCase({
            id: newId,
            title: 'คดีใหม่ (ยังไม่ตั้งชื่อ)',
            description: '',
            createdAt: new Date().toISOString().split('T')[0],
            status: 'draft',
            lastEdit: 'เมื่อสักครู่',
            people: [],
            documents: {}
        });
        navigate(`/cases/${newId}`);
    };

    const handleOpenCase = (caseId) => {
        navigate(`/cases/${caseId}`);
    };

    return (
        <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                    <button className="btn btn-black" onClick={handleCreateNewCase}>+ คดีใหม่</button>
                    <input type="text" placeholder="ค้นหาเลขคดี, ชื่อคดี..." className="form-input" style={{ width: '300px', marginBottom: 0 }} />
                    <button className="btn btn-white">สถานะทั้งหมด <ChevronDown size={14} /></button>
                </div>
                <div style={{ display: 'flex' }}>
                    <button className="btn btn-black">ตาราง</button>
                    <button className="btn btn-white">การ์ด</button>
                </div>
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th>เลขคดี</th>
                        <th>ชื่อคดี / รายละเอียด</th>
                        <th>วันที่สร้าง</th>
                        <th>สถานะ</th>
                        <th>แก้ไขล่าสุด</th>
                    </tr>
                </thead>
                <tbody>
                    {cases.map(c => (
                        <tr key={c.id} onClick={() => handleOpenCase(c.id)}>
                            <td>{c.id}</td>
                            <td>
                                <b>{c.title}</b><br />
                                <span style={{ color: '#999', fontSize: '0.8rem' }}>{c.description}</span>
                            </td>
                            <td>{c.createdAt}</td>
                            <td><span className="badge-draft">{c.status === 'draft' ? 'ร่าง' : c.status}</span></td>
                            <td>{c.lastEdit}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
