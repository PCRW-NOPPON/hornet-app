import { useParams, NavLink, Outlet } from 'react-router-dom';
import { useCases } from '../context/CaseContext';

export default function CaseDetail() {
    const { caseId } = useParams();
    const { getCase } = useCases();
    const caseData = getCase(caseId);

    if (!caseData) {
        return <div>ไม่พบคดี {caseId}</div>;
    }

    return (
        <section>
            {/* Case Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{caseData.title}</h1>
                <span style={{ color: '#666' }}>{caseData.id} &nbsp;&nbsp;|&nbsp;&nbsp; {caseData.status === 'draft' ? 'แบบร่าง' : caseData.status}</span>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <NavLink to="" end className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}>Overview</NavLink>
                <NavLink to="collect" className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}>Collect</NavLink>
                <NavLink to="data" className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}>Data</NavLink>
                <NavLink to="documents" className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}>Documents</NavLink>
            </div>

            {/* Tab Content */}
            <Outlet context={{ caseData, caseId }} />
        </section>
    );
}
