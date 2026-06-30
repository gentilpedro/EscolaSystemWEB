import React, { useState, useEffect } from 'react';
import { Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { Loading } from '../../components/Loading';
import type { ClassItem, StudentItem, AttendanceItem, PagedResult } from '../../types';
import { classApi, studentApi, attendanceApi } from '../../services/api';

interface AttendanceEntry {
  studentId: string;
  studentName: string;
  isPresent: boolean;
  notes: string;
  existingId?: string;
}

export const TeacherAttendance: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    classApi.list(1, 100)
      .then((data: any) => {
        const items = (data as PagedResult<ClassItem>).items;
        setClasses(items);
        if (items.length > 0) setSelectedClass(items[0].id);
      })
      .catch(() => setError('Erro ao carregar turmas.'))
      .finally(() => setLoadingClasses(false));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    buildAttendanceEntries();
  }, [selectedClass, selectedDate]);

  const buildAttendanceEntries = async () => {
    setLoadingAttendance(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const [studentsData, attendanceData] = await Promise.all([
        studentApi.list(1, 200, selectedClass) as Promise<PagedResult<StudentItem>>,
        attendanceApi.list(1, 200, selectedClass, undefined, selectedDate) as Promise<PagedResult<AttendanceItem>>,
      ]);

      const existingMap = new Map(attendanceData.items.map(a => [a.studentId, a]));

      setEntries(studentsData.items.map(s => {
        const existing = existingMap.get(s.id);
        return {
          studentId: s.id,
          studentName: s.name,
          isPresent: existing ? existing.isPresent : true,
          notes: existing?.notes ?? '',
          existingId: existing?.id,
        };
      }));
    } catch {
      setError('Erro ao carregar chamada.');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const toggle = (studentId: string) => {
    setEntries(prev => prev.map(e => e.studentId === studentId ? { ...e, isPresent: !e.isPresent } : e));
    setSuccessMsg(null);
  };

  const setNotes = (studentId: string, notes: string) => {
    setEntries(prev => prev.map(e => e.studentId === studentId ? { ...e, notes } : e));
  };

  const handleSave = async () => {
    if (entries.length === 0) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const toCreate = entries.filter(e => !e.existingId);
      const toUpdate = entries.filter(e => e.existingId);

      if (toCreate.length > 0) {
        await attendanceApi.bulkCreate(toCreate.map(e => ({
          studentId: e.studentId,
          classId: selectedClass,
          date: selectedDate,
          isPresent: e.isPresent,
          notes: e.notes || null,
        })));
      }

      await Promise.all(
        toUpdate.map(e =>
          attendanceApi.update(e.existingId!, { isPresent: e.isPresent, notes: e.notes || null })
        )
      );

      setSuccessMsg('Chamada salva com sucesso!');
      buildAttendanceEntries();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar chamada.');
    } finally {
      setSaving(false);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const presentCount = entries.filter(e => e.isPresent).length;
  const absentCount = entries.length - presentCount;

  if (loadingClasses) return <Loading />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Chamada</h1>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
      {successMsg && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{successMsg}</div>}

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
          <div className="flex items-center gap-2">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
            />
            <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {entries.length > 0 && (
          <div className="flex gap-4 text-sm pb-1">
            <span className="text-green-700 font-semibold">✓ Presentes: {presentCount}</span>
            <span className="text-red-600 font-semibold">✗ Ausentes: {absentCount}</span>
          </div>
        )}
      </div>

      {loadingAttendance ? (
        <Loading />
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
          Nenhum aluno nesta turma.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Aluno</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Presença</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map(entry => (
                  <tr key={entry.studentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">{entry.studentName}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggle(entry.studentId)}
                        className={`px-5 py-2 rounded-lg font-semibold transition-colors text-sm ${
                          entry.isPresent
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {entry.isPresent ? 'Presente' : 'Ausente'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={entry.notes}
                        onChange={e => setNotes(entry.studentId, e.target.value)}
                        placeholder="Observação (opcional)"
                        className="w-full px-3 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Salvando...' : 'Salvar Chamada'}</span>
          </button>
        </>
      )}
    </div>
  );
};
