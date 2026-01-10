/**
 * Hornet AI - Case Data Page (Refactored)
 * Production-ready people management with proper state handling
 */

import { useOutletContext } from 'react-router-dom';
import { useCases } from '../context/CaseContext';
import { useState, useCallback, useMemo } from 'react';
import { Trash2, UserPlus, Edit2, Save, X } from 'lucide-react';
import {
  PERSON_TYPE,
  PERSON_TYPE_LABELS,
  PERSON_TYPE_COLORS,
  GENDER,
  GENDER_LABELS,
} from '../../../shared/constants';
import { validatePhone, formatPhone } from '../../../shared/utils';

// Data categories configuration
const DATA_CATEGORIES = [
  { id: 'case_info', label: 'Case Info', count: 1 },
  { id: 'people', label: 'People', countKey: 'people' },
  { id: 'circumstances', label: 'Circumstances', count: 1 },
  { id: 'transactions', label: 'Transactions', count: 0 },
];

export default function CaseData() {
  const { caseData, caseId } = useOutletContext();
  const { updatePerson, addPerson, deletePerson } = useCases();

  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState('people');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const people = useMemo(() => caseData?.people || [], [caseData?.people]);

  const selectedPerson = useMemo(
    () => people.find((p) => p.id === selectedPersonId),
    [people, selectedPersonId]
  );

  // Select first person if none selected
  useState(() => {
    if (people.length > 0 && !selectedPersonId) {
      setSelectedPersonId(people[0].id);
    }
  });

  // Handle person field change with validation
  const handlePersonChange = useCallback(
    (field, value) => {
      if (!selectedPersonId) return;

      // Validate phone
      if (field === 'phone' && value && !validatePhone(value)) {
        setFormErrors((prev) => ({ ...prev, phone: 'รูปแบบเบอร์โทรไม่ถูกต้อง' }));
      } else if (field === 'phone') {
        setFormErrors((prev) => {
          const { phone, ...rest } = prev;
          return rest;
        });
      }

      updatePerson(caseId, selectedPersonId, { [field]: value });
    },
    [caseId, selectedPersonId, updatePerson]
  );

  // Add new person
  const handleAddPerson = useCallback(() => {
    const newPerson = addPerson(caseId, {
      type: PERSON_TYPE.RELATED,
      firstName: '',
      lastName: '',
      prefix: '',
      gender: '',
      phone: '',
      address: null,
    });

    setSelectedPersonId(newPerson.id);
    setEditMode(true);
  }, [caseId, addPerson]);

  // Delete person with confirmation
  const handleDeletePerson = useCallback(() => {
    if (!selectedPersonId) return;

    deletePerson(caseId, selectedPersonId);

    // Select next person or first
    const remainingPeople = people.filter((p) => p.id !== selectedPersonId);
    if (remainingPeople.length > 0) {
      setSelectedPersonId(remainingPeople[0].id);
    } else {
      setSelectedPersonId(null);
    }

    setShowDeleteConfirm(false);
    setEditMode(false);
  }, [caseId, selectedPersonId, people, deletePerson]);

  // Get full name display
  const getFullName = (person) => {
    if (!person) return '';
    return `${person.prefix || ''} ${person.firstName || ''} ${person.lastName || ''}`.trim() || 'ไม่ระบุชื่อ';
  };

  // Categories with dynamic counts
  const categories = useMemo(
    () =>
      DATA_CATEGORIES.map((cat) => ({
        ...cat,
        count: cat.countKey === 'people' ? people.length : cat.count,
      })),
    [people.length]
  );

  return (
    <div className="detail-layout">
      {/* Left sidebar - Categories */}
      <div className="detail-sidebar">
        <div className="menu-group-label">DATA CATEGORIES</div>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`nav-item ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              width: '100%',
              textAlign: 'left',
              background: activeCategory === cat.id ? 'var(--brand-black)' : 'transparent',
              color: activeCategory === cat.id ? 'white' : 'inherit',
            }}
          >
            {cat.label}
            <span
              className="tag"
              style={{
                marginLeft: 'auto',
                backgroundColor: activeCategory === cat.id ? 'rgba(255,255,255,0.2)' : '#e0e0e0',
              }}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="detail-content">
        {activeCategory === 'people' && (
          <>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <h3 style={{ margin: 0 }}>บุคคลที่เกี่ยวข้อง ({people.length})</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className={`btn ${editMode ? 'btn-black' : 'btn-white'}`}
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? (
                    <>
                      <Save size={16} /> บันทึก
                    </>
                  ) : (
                    <>
                      <Edit2 size={16} /> แก้ไข
                    </>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem' }}>
              {/* People List */}
              <div
                style={{
                  flex: '0 0 350px',
                  borderRight: '1px solid #eee',
                  paddingRight: '1.5rem',
                }}
              >
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
                            cursor: 'pointer',
                          }}
                        >
                          <td>{idx + 1}</td>
                          <td>
                            <span
                              style={{
                                color: PERSON_TYPE_COLORS[p.type] || '#666',
                                fontWeight: 500,
                              }}
                            >
                              {PERSON_TYPE_LABELS[p.type] || p.type}
                            </span>
                          </td>
                          <td>{getFullName(p)}</td>
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

              {/* Person Form */}
              {selectedPerson ? (
                <div
                  style={{
                    flex: 1,
                    background: '#fafafa',
                    padding: '1.5rem',
                    borderRadius: '8px',
                  }}
                >
                  {/* Person Type Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        color: PERSON_TYPE_COLORS[selectedPerson.type],
                      }}
                    >
                      {PERSON_TYPE_LABELS[selectedPerson.type] || 'บุคคล'}
                    </h4>
                    <select
                      value={selectedPerson.type || PERSON_TYPE.RELATED}
                      onChange={(e) => handlePersonChange('type', e.target.value)}
                      disabled={!editMode}
                      className="form-input"
                      style={{ width: 'auto', marginBottom: 0 }}
                    >
                      {Object.entries(PERSON_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <hr style={{ margin: '1rem 0', border: 0, borderTop: '1px solid #eee' }} />

                  {/* Form Fields */}
                  <div className="form-section">
                    {/* Name Fields */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ flex: '0 0 80px' }}>
                        <label className="form-label">คำนำหน้า</label>
                        <select
                          className="form-input"
                          value={selectedPerson.prefix || ''}
                          onChange={(e) => handlePersonChange('prefix', e.target.value)}
                          disabled={!editMode}
                          style={{ marginBottom: 0 }}
                        >
                          <option value="">-</option>
                          <option value="นาย">นาย</option>
                          <option value="นาง">นาง</option>
                          <option value="นางสาว">นางสาว</option>
                          <option value="ด.ช.">ด.ช.</option>
                          <option value="ด.ญ.">ด.ญ.</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">ชื่อ</label>
                        <input
                          type="text"
                          className="form-input"
                          value={selectedPerson.firstName || ''}
                          onChange={(e) => handlePersonChange('firstName', e.target.value)}
                          disabled={!editMode}
                          placeholder="ชื่อ"
                          style={{ marginBottom: 0 }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">นามสกุล</label>
                        <input
                          type="text"
                          className="form-input"
                          value={selectedPerson.lastName || ''}
                          onChange={(e) => handlePersonChange('lastName', e.target.value)}
                          disabled={!editMode}
                          placeholder="นามสกุล"
                          style={{ marginBottom: 0 }}
                        />
                      </div>
                    </div>

                    {/* Gender & Phone */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">เพศ</label>
                        <select
                          className="form-input"
                          value={selectedPerson.gender || ''}
                          onChange={(e) => handlePersonChange('gender', e.target.value)}
                          disabled={!editMode}
                          style={{ marginBottom: 0 }}
                        >
                          <option value="">ไม่ระบุ</option>
                          {Object.entries(GENDER_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          โทรศัพท์
                          {formErrors.phone && (
                            <span style={{ color: 'red', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                              {formErrors.phone}
                            </span>
                          )}
                        </label>
                        <input
                          type="tel"
                          className="form-input"
                          value={selectedPerson.phone || ''}
                          onChange={(e) => handlePersonChange('phone', e.target.value)}
                          disabled={!editMode}
                          placeholder="0XX-XXX-XXXX"
                          style={{
                            marginBottom: 0,
                            borderColor:
                              formErrors.phone ? 'red' : !selectedPerson.phone ? 'orange' : undefined,
                          }}
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label className="form-label">ที่อยู่</label>
                      <textarea
                        className="form-input"
                        value={
                          selectedPerson.address
                            ? `${selectedPerson.address.houseNo || ''} ${selectedPerson.address.moo ? 'หมู่ ' + selectedPerson.address.moo : ''} ${selectedPerson.address.soi ? 'ซอย ' + selectedPerson.address.soi : ''} ${selectedPerson.address.road ? 'ถนน ' + selectedPerson.address.road : ''} ${selectedPerson.address.subDistrict || ''} ${selectedPerson.address.district || ''} ${selectedPerson.address.province || ''} ${selectedPerson.address.postalCode || ''}`.trim()
                            : ''
                        }
                        onChange={(e) =>
                          handlePersonChange('address', { raw: e.target.value })
                        }
                        disabled={!editMode}
                        placeholder="บ้านเลขที่ หมู่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                        rows={2}
                        style={{ marginBottom: 0 }}
                      />
                    </div>

                    {/* Notes */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label">หมายเหตุ</label>
                      <textarea
                        className="form-input"
                        value={selectedPerson.notes || ''}
                        onChange={(e) => handlePersonChange('notes', e.target.value)}
                        disabled={!editMode}
                        placeholder="หมายเหตุเพิ่มเติม..."
                        rows={2}
                        style={{ marginBottom: 0 }}
                      />
                    </div>
                  </div>

                  {/* Delete Button */}
                  {editMode && (
                    <button
                      className="btn btn-danger-outline"
                      style={{ width: '100%' }}
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 size={16} /> ลบบุคคลนี้
                    </button>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    background: '#fafafa',
                    borderRadius: '8px',
                    padding: '3rem',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <UserPlus size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>เลือกบุคคลจากรายการ หรือเพิ่มบุคคลใหม่</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeCategory !== 'people' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              color: '#999',
            }}
          >
            ฟีเจอร์ {categories.find((c) => c.id === activeCategory)?.label} จะเปิดให้ใช้งานเร็วๆ นี้
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>ยืนยันการลบ</h3>
            <p style={{ color: '#666', margin: '1rem 0' }}>
              คุณต้องการลบ "{getFullName(selectedPerson)}" ใช่หรือไม่?
              <br />
              <span style={{ color: '#999', fontSize: '0.85rem' }}>การดำเนินการนี้ไม่สามารถย้อนกลับได้</span>
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
