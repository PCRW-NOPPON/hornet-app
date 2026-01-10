import { useOutletContext } from 'react-router-dom';

export default function CaseOverview() {
    const { caseData } = useOutletContext();

    return (
        <div className="detail-content">
            <h3>ภาพรวมคดี</h3>
            <p style={{ color: '#666', marginTop: '1rem' }}>
                คดี <b>{caseData.title}</b> สร้างเมื่อ {caseData.createdAt}
            </p>
            <p style={{ color: '#666', marginTop: '0.5rem' }}>
                จำนวนบุคคลที่เกี่ยวข้อง: {caseData.people?.length || 0} คน
            </p>
        </div>
    );
}
