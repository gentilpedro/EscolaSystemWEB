import React, { useState, useEffect } from 'react';
import { BookOpen, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Loading } from '../../components/Loading';
import type { ClassItem, StudentItem, PagedResult } from '../../types';
import { classApi, studentApi } from '../../services/api';

export const TeacherClasses: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [studentsByClass, setStudentsByClass] = useState<Record<string, StudentItem[]>>({});
  const [loadingStudents, setLoadingStudents] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    classApi.list(1, 100)
      .then((data: any) => setClasses((data as PagedResult<ClassItem>).items))
      .catch(() => setError('Erro ao carregar turmas.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleClass = async (classId: string) => {
    if (expanded === classId) {
      setExpanded(null);
      return;
    }
    setExpanded(classId);
    if (studentsByClass[classId]) return;
    setLoadingStudents(classId);
    try {
      const data = await studentApi.list(1, 200, classId) as PagedResult<StudentItem>;
      setStudentsByClass(prev => ({ ...prev, [classId]: data.items }));
    } catch {
      setStudentsByClass(prev => ({ ...prev, [classId]: [] }));
    } finally {
      setLoadingStudents(null);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Minhas Turmas</h1>
      <p className="text-gray-500 mb-8">{classes.length} turma{classes.length !== 1 ? 's' : ''} atribuída{classes.length !== 1 ? 's' : ''}</p>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {classes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Nenhuma turma atribuída</p>
          <p className="text-sm mt-1">Entre em contato com a diretoria para ser vinculado a uma turma.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map(cls => {
            const students = studentsByClass[cls.id] ?? [];
            const isOpen = expanded === cls.id;
            const isLoadingThis = loadingStudents === cls.id;

            return (
              <div key={cls.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => toggleClass(cls.id)}
                  className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 text-blue-700 rounded-lg p-3">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-semibold text-gray-800">{cls.name}</p>
                      <p className="text-sm text-gray-500">Ano letivo: {cls.year} · {cls.schoolName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {isOpen && !isLoadingThis && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{students.length} aluno{students.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-200">
                    {isLoadingThis ? (
                      <div className="px-6 py-6 text-center text-gray-500 text-sm">Carregando alunos...</div>
                    ) : students.length === 0 ? (
                      <div className="px-6 py-6 text-center text-gray-400 text-sm">Nenhum aluno nesta turma ainda.</div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Nome</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Matrícula</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">E-mail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {students.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50">
                              <td className="px-6 py-3 font-medium text-gray-800">{s.name}</td>
                              <td className="px-6 py-3 text-gray-500 font-mono text-sm">{s.registration}</td>
                              <td className="px-6 py-3 text-gray-500">{s.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
