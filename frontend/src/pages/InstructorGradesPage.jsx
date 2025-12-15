import React, { useState, useEffect } from 'react';
import { sectionsService } from '../services/academicService';
import gradingService from '../services/gradingService';
import Swal from 'sweetalert2';
import './InstructorGradesPage.css';

const InstructorGradesPage = () => {
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState(null);
    const [exams, setExams] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    // Grades State: { examId: { studentId: { score: 90, feedback: '' } } }
    const [gradesData, setGradesData] = useState({});
    const [expandedExam, setExpandedExam] = useState(null);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [newExam, setNewExam] = useState({ title: '', type: 'MIDTERM', weight: 30, date: '' });

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            const data = await sectionsService.getMySections();
            const list = data.sections || data || [];
            setSections(list);
            if (list.length > 0) handleSectionSelect(list[0]);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSectionSelect = async (section) => {
        setSelectedSection(section);
        setLoading(true);
        try {
            const [examsData, studentsData] = await Promise.all([
                gradingService.getSectionExams(section.id),
                sectionsService.getStudents(section.id)
            ]);
            setExams(examsData.data || examsData);
            setStudents(studentsData || []);

            if (examsData.data && examsData.data.length > 0) {
                // Fetch grades for the first exam? Or wait for expand?
                // Let's wait for expand user action to keep it light.
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Hata', 'Veriler yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExpandExam = async (examId) => {
        if (expandedExam === examId) {
            setExpandedExam(null);
            return;
        }
        setExpandedExam(examId);

        // Fetch grades for this exam
        try {
            const response = await gradingService.getExamGrades(examId);
            const serverGrades = response.data || response;

            // Map array to object: { studentId: { score, feedback } }
            const gradeMap = {};
            serverGrades.forEach(g => {
                gradeMap[g.student_id] = { score: g.score, feedback: g.feedback };
            });

            setGradesData(prev => ({ ...prev, [examId]: gradeMap }));
        } catch (error) {
            console.error(error);
        }
    };

    const handleGradeChange = (examId, studentId, field, value) => {
        setGradesData(prev => ({
            ...prev,
            [examId]: {
                ...prev[examId],
                [studentId]: {
                    ...prev[examId]?.[studentId],
                    [field]: value
                }
            }
        }));
    };

    const handleSaveGrades = async (examId) => {
        const examGrades = gradesData[examId];
        if (!examGrades) return;

        const payload = {
            exam_id: examId,
            grades: Object.keys(examGrades).map(studentId => ({
                student_id: parseInt(studentId),
                score: parseFloat(examGrades[studentId].score),
                feedback: examGrades[studentId].feedback
            })).filter(g => !isNaN(g.score)) // Only send valid scores
        };

        try {
            await gradingService.submitGrades(payload);
            Swal.fire('Başarılı', 'Notlar kaydedildi', 'success');
        } catch (error) {
            Swal.fire('Hata', 'Kayıt başarısız', 'error');
        }
    };

    const handleCreateExam = async () => {
        if (!newExam.title || !newExam.weight) {
            Swal.fire('Eksik Bilgi', 'Lütfen başlık ve ağırlık girin', 'warning');
            return;
        }

        try {
            await gradingService.createExam({ ...newExam, section_id: selectedSection.id });
            setShowModal(false);
            setNewExam({ title: '', type: 'MIDTERM', weight: 30, date: '' });
            // Refresh
            handleSectionSelect(selectedSection);
            Swal.fire('Başarılı', 'Sınav oluşturuldu', 'success');
        } catch (error) {
            Swal.fire('Hata', 'Oluşturulamadı', 'error');
        }
    };

    const handleDeleteExam = async (examId) => {
        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: 'Bu sınav ve tüm notları silinecek!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal'
        });

        if (result.isConfirmed) {
            try {
                await gradingService.deleteExam(examId);
                handleSectionSelect(selectedSection); // Refresh
                Swal.fire('Silindi', '', 'success');
            } catch (error) {
                Swal.fire('Hata', 'Silinemedi', 'error');
            }
        }
    };

    const handlePublishToggle = async (exam, currentStatus) => {
        try {
            await gradingService.publishExam(exam.id, !currentStatus);
            // Quick update local
            setExams(prev => prev.map(e => e.id === exam.id ? { ...e, is_published: !currentStatus } : e));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="page grades-page-instructor">
            <div className="sidebar">
                <h3>Dersler</h3>
                <ul className="section-list">
                    {sections.map(sec => (
                        <li
                            key={sec.id}
                            className={selectedSection?.id === sec.id ? 'active' : ''}
                            onClick={() => handleSectionSelect(sec)}
                        >
                            {sec.course?.code || 'CODE'} - {sec.course?.name || 'Name'}
                            <span className="badge">Sec {sec.section_number}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="main-content">
                {selectedSection ? (
                    <>
                        <div className="main-header">
                            <div>
                                <h2>{selectedSection.course?.name} (Section {selectedSection.section_number})</h2>
                                <p className="subtitle">Sınavları yönetin ve not girişi yapın</p>
                            </div>
                            <button className="btn-primary" onClick={() => setShowModal(true)}>+ Yeni Sınav</button>
                        </div>

                        <div className="exams-list">
                            {exams.map(exam => (
                                <div key={exam.id} className={`exam-card ${expandedExam === exam.id ? 'expanded' : ''}`}>
                                    <div className="exam-header" onClick={() => handleExpandExam(exam.id)}>
                                        <div className="exam-title-group">
                                            <span className={`type-tag ${exam.type}`}>{exam.type}</span>
                                            <h4>{exam.title}</h4>
                                            <span className="weight-tag">%{exam.weight}</span>
                                        </div>
                                        <div className="exam-actions" onClick={e => e.stopPropagation()}>
                                            <label className="switch" title="Öğrencilere Yayınla">
                                                <input
                                                    type="checkbox"
                                                    checked={exam.is_published}
                                                    onChange={() => handlePublishToggle(exam, exam.is_published)}
                                                />
                                                <span className="slider round"></span>
                                            </label>
                                            <button className="btn-icon delete" onClick={() => handleDeleteExam(exam.id)} title="Sil">🗑️</button>
                                            <span className="chevron">{expandedExam === exam.id ? '▲' : '▼'}</span>
                                        </div>
                                    </div>

                                    {expandedExam === exam.id && (
                                        <div className="exam-body">
                                            <div className="grades-table-wrapper">
                                                <table className="grades-entry-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Öğrenci No</th>
                                                            <th>Ad Soyad</th>
                                                            <th>Puan (0-100)</th>
                                                            <th>Geri Bildirim</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {students.map(student => {
                                                            const grade = gradesData[exam.id]?.[student.id] || { score: '', feedback: '' };
                                                            return (
                                                                <tr key={student.id}>
                                                                    <td>{student.student_number}</td>
                                                                    <td>{student.full_name}</td>
                                                                    <td>
                                                                        <input
                                                                            type="number"
                                                                            className="score-input"
                                                                            value={grade.score}
                                                                            onChange={(e) => handleGradeChange(exam.id, student.id, 'score', e.target.value)}
                                                                            placeholder="0"
                                                                            min="0"
                                                                            max="100"
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="feedback-input"
                                                                            value={grade.feedback || ''}
                                                                            onChange={(e) => handleGradeChange(exam.id, student.id, 'feedback', e.target.value)}
                                                                            placeholder="Opsiyonel"
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="exam-footer">
                                                <button className="btn-success" onClick={() => handleSaveGrades(exam.id)}>💾 Kaydet</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {exams.length === 0 && <div className="empty-placeholder">Henüz sınav tanımlanmamış.</div>}
                        </div>
                    </>
                ) : (
                    <div className="empty-placeholder">İşlem yapmak için soldan bir ders seçin.</div>
                )}
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Yeni Sınav Oluştur</h3>
                        <div className="form-group">
                            <label>Başlık</label>
                            <input type="text" value={newExam.title} onChange={e => setNewExam({ ...newExam, title: e.target.value })} placeholder="Örn: Vize 1" />
                        </div>
                        <div className="form-group">
                            <label>Tür</label>
                            <select value={newExam.type} onChange={e => setNewExam({ ...newExam, type: e.target.value })}>
                                <option value="MIDTERM">Vize</option>
                                <option value="FINAL">Final</option>
                                <option value="QUIZ">Quiz</option>
                                <option value="PROJECT">Proje</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Ağırlık (%)</label>
                            <input type="number" value={newExam.weight} onChange={e => setNewExam({ ...newExam, weight: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Tarih</label>
                            <input type="date" value={newExam.date} onChange={e => setNewExam({ ...newExam, date: e.target.value })} />
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                            <button className="btn-primary" onClick={handleCreateExam}>Oluştur</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorGradesPage;
