import { useOutletContext } from 'react-router-dom';
import { useCases, PERSON_TYPES } from '../context/CaseContext';
import { useState } from 'react';
import { Trash2, UserPlus, Edit2, Save, X } from 'lucide-react';

export default function CaseData() {
    const { caseData, caseId } = useOutletContext();
    const { updatePerson, addPerson, deletePerson } = useCases();

    const [selectedPersonId, setSelectedPersonId] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const people = caseData?.people || [];

    // Select first person if none selected
    if (people.length > 0 && !selectedPersonId) {
        setSelectedPersonId(people[0].id);
    }

    const selectedPerson = people.find(p => p.id === selectedPersonId);

    const handlePersonChange = (field, value) => {
        if (!selectedPersonId) return;
        updatePerson(caseId, selectedPersonId, { [field]: value });
    };

    const handleAddPerson = () => {
        const newPerson = addPerson(caseId, {
            type: PERSON_TYPES.RELATED,
            name: '',
            gender: '',
            phone: '',
            address: ''
        });
        setSelectedPersonId(newPerson.id);
        setEditMode(true);
    };

    const handleDeletePerson = () => {
        if (!selectedPersonId) return;

        deletePerson(caseId, selectedPersonId);

        // Select next available person
        const remaining = people.filter(p => p.id !== selectedPersonId);
        if (remaining.length > 0) {
            setSelectedPersonId(remaining[0].id);
        } else {
            setSelectedPersonId(null);
        }

        setShowDeleteConfirm(false);
        setEditMode(false);
    };

    const getTypeColor = (type) => {
        switch (type) {
            case PERSON_TYPES.ACCUSER: return '#1976D2';
            case PERSON_TYPES.DEFENDANT: return '#D32F2F';
            case PERSON_TYPES.WITNESS: return '#388E3C';
            default: return '#666';
        }
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>บุคคลที่เกี่ยวข้อง ({people.length})</h3>
                    <button className={`btn ${editMode ? 'btn-black' : 'btn-white'}`} onClick={() => setEditMode(!editMode)}>
                        {editMode ? <><Save size={16} /> บันทึก</> : <><Edit2 size={16} /> แก้ไข</>}
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '2rem' }}>
                    {/* List */}
                    <div style={{ flex: '0 0 350px', borderRight: '1px solid #eee', paddingRight: '1rem' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>#</th>
                                    <th style={{ width: '100px' }}>ประเภท</th>
                                    <th>ชื่อ-สกุล</th>
                                </tr>
                            </thead>
                            <tbody>
                                {people.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                                            ยังไม่มีบุคคลที่เกี่ยวข้อง
                                        </td>
                                    </tr>
                                ) : (
                                    people.map((p, idx) => (
                                        <tr
                                            key={p.id}
                                            onClick={() => setSelectedPersonId(p.id)}
                                            style={{
                                                background: p.id === selectedPersonId ? '#ebf5ff' : '',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <td>{idx + 1}</td>
                                            <td style={{ color: getTypeColor(p.type), fontWeight: 500 }}>{p.type}</td>
                                            <td>{p.name || 'ไม่ระบุชื่อ'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <button
                            className="btn btn-white"
                            style={{ width: '100%', marginTop: '1rem' }}
                            onClick={handleAddPerson}
                        >
                            <UserPlus size={16} /> เพิ่มบุคคล
                        </button>
                    </div>

                    {/* Form */}
                    {selectedPerson ? (
                        <div style={{ flex: 1, background: '#fafafa', padding: '1.5rem', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0, color: getTypeColor(selectedPerson.type) }}>
                                    {selectedPerson.type}
                                </h4>
                                <select
                                    value={selectedPerson.type}
                                    onChange={e => handlePersonChange('type', e.target.value)}
                                    disabled={!editMode}
                                    className="form-input"
                                    style={{ width: 'auto', marginBottom: 0 }}
                                >
                                    {Object.values(PERSON_TYPES).map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <hr style={{ margin: '1rem 0', border: 0, borderTop: '1px solid #eee' }} />

                            <div className="form-section">
                                <label className="form-label">ชื่อ-นามสกุล</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={selectedPerson.name || ''}
                                    onChange={e => handlePersonChange('name', e.target.value)}
                                    disabled={!editMode}
                                    placeholder="กรอกชื่อ-นามสกุล"
                                />

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">เพศ</label>
                                        <select
                                            className="form-input"
                                            value={selectedPerson.gender || ''}
                                            onChange={e => handlePersonChange('gender', e.target.value)}
                                            disabled={!editMode}
                                        >
                                            <option value="">ไม่ระบุ</option>
                                            <option value="ชาย">ชาย</option>
                                            <option value="หญิง">หญิง</option>
                                            <option value="อื่นๆ">อื่นๆ</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">โทรศัพท์</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={selectedPerson.phone || ''}
                                            onChange={e => handlePersonChange('phone', e.target.value)}
                                            disabled={!editMode}
                                            placeholder="0XX-XXX-XXXX"
                                            style={{ borderColor: !selectedPerson.phone ? 'orange' : undefined }}
                                        />
                                    </div>
                                </div>

                                <label className="form-label">ที่อยู่</label>
                                <textarea
                                    className="form-input"
                                    value={selectedPerson.address || ''}
                                    onChange={e => handlePersonChange('address', e.target.value)}
                                    disabled={!editMode}
                                    placeholder="บ้านเลขที่ หมู่ ซอย ถนน ตำบล อำเภอ จังหวัด"
                                    rows={2}
                                />
                            </div>

                            {editMode && (
                                <button
                                    className="btn btn-danger-outline"
                                    style={{ width: '100%', marginTop: '1rem' }}
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    <Trash2 size={16} /> ลบบุคคลนี้
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            background: '#fafafa',
                            borderRadius: '8px',
                            padding: '3rem'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <UserPlus size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <p>เลือกบุคคลจากรายการ หรือเพิ่มบุคคลใหม่</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>ยืนยันการลบ</h3>
                        <p style={{ color: '#666', margin: '1rem 0' }}>
                            คุณต้องการลบ "{selectedPerson?.name || 'บุคคลนี้'}" ใช่หรือไม่?
                            <br />
                            <span style={{ fontSize: '0.85rem', color: '#999' }}>
                                การดำเนินการนี้ไม่สามารถย้อนกลับได้
                            </span>
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn btn-white" onClick={() => setShowDeleteConfirm(false)}>
                                <X size={16} /> ยกเลิก
                            </button>
                            <button className="btn btn-danger-outline" onClick={handleDeletePerson}>
                                <Trash2 size={16} /> ลบ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
