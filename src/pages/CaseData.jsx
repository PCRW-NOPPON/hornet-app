import { useOutletContext } from 'react-router-dom';
import { useCases } from '../context/CaseContext';
import { useState } from 'react';

export default function CaseData() {
    const { caseData, caseId } = useOutletContext();
    const { updateCase } = useCases();
    const [selectedPersonIndex, setSelectedPersonIndex] = useState(0);
    const [editMode, setEditMode] = useState(false);

    const people = caseData.people || [];
    const selectedPerson = people[selectedPersonIndex];

    const handlePersonChange = (field, value) => {
        const updatedPeople = [...people];
        updatedPeople[selectedPersonIndex] = { ...updatedPeople[selectedPersonIndex], [field]: value };
        updateCase(caseId, { people: updatedPeople });
    };

    const handleAddPerson = () => {
        const newPerson = { id: Date.now(), type: 'ผู้เกี่ยวข้อง', name: '', gender: '', phone: '', address: '' };
        updateCase(caseId, { people: [...people, newPerson] });
        setSelectedPersonIndex(people.length);
    };

    return (
        <div className="detail-layout">
            {/* Left sidebar for data categories */}
            <div className="detail-sidebar">
                <div className="menu-group-label">DATA CATEGORIES</div>
                <div className="nav-item">Case Info <span className="tag">1</span></div>
                <div className="nav-item active">People <span className="tag">{people.length}</span></div>
                <div className="nav-item">Circumstances <span className="tag">1</span></div>
                <div className="nav-item">Transactions <span className="tag">0</span></div>
            </div>

            {/* Main Data Form Area */}
            <div className="detail-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3>People</h3>
                    <button className="btn btn-black" onClick={() => setEditMode(!editMode)}>
                        {editMode ? 'Save Mode' : 'Edit Mode'}
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '2rem' }}>
                    {/* List */}
                    <div style={{ flex: 1, borderRight: '1px solid #eee', paddingRight: '1rem' }}>
                        <table className="data-table">
                            <thead><tr><th>#</th><th>ประเภท</th><th>ชื่อ-สกุล</th></tr></thead>
                            <tbody>
                                {people.map((p, idx) => (
                                    <tr key={p.id} onClick={() => setSelectedPersonIndex(idx)} style={{ background: idx === selectedPersonIndex ? '#ebf5ff' : '' }}>
                                        <td>{idx + 1}</td>
                                        <td style={{ color: p.type === 'ผู้ต้องหา' ? 'red' : 'inherit' }}>{p.type}</td>
                                        <td>{p.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button className="btn btn-white" style={{ width: '100%', marginTop: '1rem' }} onClick={handleAddPerson}>+ เพิ่มบุคคล</button>
                    </div>

                    {/* Form */}
                    {selectedPerson && (
                        <div style={{ flex: 1, background: '#fafafa', padding: '1.5rem', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h4>{selectedPerson.type}</h4>
                                <select
                                    value={selectedPerson.type}
                                    onChange={e => handlePersonChange('type', e.target.value)}
                                    disabled={!editMode}
                                    style={{ padding: '4px' }}
                                >
                                    <option>ผู้กล่าวหา</option>
                                    <option>ผู้ต้องหา</option>
                                    <option>พยาน</option>
                                    <option>ผู้เกี่ยวข้อง</option>
                                </select>
                            </div>
                            <hr style={{ margin: '1rem 0', border: 0, borderTop: '1px solid #eee' }} />

                            <div className="form-section">
                                <label className="form-label">ชื่อ-นามสกุล</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={selectedPerson.name}
                                    onChange={e => handlePersonChange('name', e.target.value)}
                                    disabled={!editMode}
                                />

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">เพศ</label>
                                        <input type="text" className="form-input" value={selectedPerson.gender} onChange={e => handlePersonChange('gender', e.target.value)} disabled={!editMode} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">โทร</label>
                                        <input type="text" className="form-input" value={selectedPerson.phone} onChange={e => handlePersonChange('phone', e.target.value)} disabled={!editMode} style={{ borderColor: !selectedPerson.phone ? 'orange' : undefined }} />
                                    </div>
                                </div>

                                <label className="form-label">ที่อยู่</label>
                                <input type="text" className="form-input" value={selectedPerson.address} onChange={e => handlePersonChange('address', e.target.value)} disabled={!editMode} />
                            </div>

                            <button className="btn btn-danger-outline" style={{ width: '100%' }}>ลบข้อมูล</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
