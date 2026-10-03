import React, { useEffect, useState } from 'react';
import type { DisciplinaryCall, StudentItem, ClassItem, PagedResult } from '../../types';
import { disciplinaryApi, studentApi, classApi } from '../../services/api';
import { Alert, CallStatusStamp, Dialog, FormDialog, SelectField, TextAreaField, Button, errorMessage } from '../../components/ui';
import { CallStatus } from '../../lib/school';
import { formatDateTime } from '../../lib/format';
import { cn } from '../../lib/cn';

/** Linha do tempo do chamado: nada some, cada etapa fica registrada. */
export const CallTimeline: React.FC<{ call: DisciplinaryCall; audience?: 'school' | 'family' }> = ({ call, audience = 'school' }) => {
  const resolved = call.status !== CallStatus.PENDING;
  return (
    <ol className="relative space-y-5 border-l-2 border-rule pl-5">
      <li className="relative">
        <span className="absolute -left-[1.6875rem] top-1 h-3 w-3 rounded-full border-2 border-surface bg-ink-3" aria-hidden="true" />
        <p className="text-sm font-semibold text-ink">Chamado aberto</p>
        <p className="figures text-sm text-ink-3">{formatDateTime(call.createdAt)}</p>
      </li>
      <li className="relative">
        <span
          className={cn(
            'absolute -left-[1.6875rem] top-1 h-3 w-3 rounded-full border-2 border-surface',
            call.status === CallStatus.APPROVED ? 'bg-red-ink' : call.status === CallStatus.REJECTED ? 'bg-ink-3' : 'bg-amber-ink',
          )}
          aria-hidden="true"
        />
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-ink">{resolved ? 'Decisão registrada' : 'Aguardando decisão'}</p>
          <CallStatusStamp status={call.status} fallback={call.statusName} audience={audience} />
        </div>
        {resolved && (
          <p className="text-sm text-ink-3">
            {call.resolvedByName && <>por {call.resolvedByName}</>}
            {call.resolvedAt && (
              <>
                {call.resolvedByName ? ' · ' : ''}
                <span className="figures">{formatDateTime(call.resolvedAt)}</span>
              </>
            )}
          </p>
        )}
        {call.resolution && (
          <blockquote className="mt-2 whitespace-pre-wrap rounded-md border border-rule bg-paper px-3 py-2 text-[0.9375rem] text-ink-2">
            {call.resolution}
          </blockquote>
        )}
      </li>
    </ol>
  );
};

export const CallDetailDialog: React.FC<{
  call: DisciplinaryCall;
  onClose: () => void;
  onResolve?: (action: 'approve' | 'reject') => void;
  audience?: 'school' | 'family';
}> = ({ call, onClose, onResolve, audience = 'school' }) => (
  <Dialog
    title="Detalhes do chamado"
    description={call.studentName}
    onClose={onClose}
    size="lg"
    footer={
      <>
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
        {onResolve && call.status === CallStatus.PENDING && (
          <>
            <Button variant="secondary" onClick={() => onResolve('reject')}>
              Rejeitar
            </Button>
            <Button onClick={() => onResolve('approve')}>Aprovar</Button>
          </>
        )}
      </>
    }
  >
    <h3 className="text-sm font-semibold text-ink-3">Ocorrência</h3>
    <p className="mt-1 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ink">{call.description}</p>
    <h3 className="mb-3 mt-6 text-sm font-semibold text-ink-3">Andamento</h3>
    <CallTimeline call={call} audience={audience} />
  </Dialog>
);

export const ResolveCallDialog: React.FC<{
  call: DisciplinaryCall;
  action: 'approve' | 'reject';
  onClose: () => void;
  onSave: () => void;
}> = ({ call, action, onClose, onSave }) => {
  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isApprove = action === 'approve';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isApprove) {
        await disciplinaryApi.approve(call.id, resolution);
      } else {
        await disciplinaryApi.reject(call.id, resolution);
      }
      onSave();
    } catch (err) {
      setError(errorMessage(err, 'Erro ao processar chamado.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      title={isApprove ? 'Aprovar chamado' : 'Rejeitar chamado'}
      description={
        <>
          Aluno: <strong className="text-ink">{call.studentName}</strong>
        </>
      }
      size="lg"
      onClose={onClose}
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel={isApprove ? 'Aprovar' : 'Rejeitar'}
      submitVariant="primary"
    >
      {error && <Alert tone="error">{error}</Alert>}
      {/* A decisão é tomada sobre o texto inteiro, nunca sobre um trecho cortado */}
      <section aria-label="Ocorrência">
        <h3 className="mb-1 text-sm font-semibold text-ink-3">Ocorrência</h3>
        <p className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md border border-rule bg-paper px-3 py-2 text-[0.9375rem] leading-relaxed text-ink-2">
          {call.description}
        </p>
      </section>
      <Alert tone={isApprove ? 'warning' : 'info'}>
        {isApprove
          ? 'Aprovar confirma a advertência no registro do aluno. A decisão é final e o responsável passa a vê-la com a sua justificativa.'
          : 'Rejeitar arquiva o chamado sem advertência. A decisão é final e o responsável passa a vê-la com a sua justificativa.'}
      </Alert>
      <TextAreaField
        label="Resolução / justificativa"
        value={resolution}
        onChange={e => setResolution(e.target.value)}
        rows={4}
        placeholder="Descreva a resolução do chamado…"
        hint="Escreva para o responsável: ele lerá este texto."
        required
      />
    </FormDialog>
  );
};

export const CreateCallDialog: React.FC<{ onClose: () => void; onSave: () => void }> = ({ onClose, onSave }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [formData, setFormData] = useState({ studentId: '', description: '' });
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsFailed, setStudentsFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    classApi
      .list(1, 100)
      .then((data: PagedResult<ClassItem>) => {
        setClasses(data.items);
        if (data.items.length > 0) {
          setLoadingStudents(true);
          setSelectedClass(data.items[0].id);
        }
      })
      .catch(() => setError('Erro ao carregar turmas.'));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    let active = true;
    studentApi
      .list(1, 200, selectedClass)
      .then((data: PagedResult<StudentItem>) => {
        if (!active) return;
        setStudents(data.items);
        setStudentsFailed(false);
      })
      .catch(() => {
        if (!active) return;
        setStudents([]);
        setStudentsFailed(true);
      })
      .finally(() => active && setLoadingStudents(false));
    return () => {
      active = false;
    };
  }, [selectedClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await disciplinaryApi.create({ studentId: formData.studentId, description: formData.description });
      onSave();
    } catch (err) {
      setError(errorMessage(err, 'Erro ao criar chamado.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      title="Novo chamado disciplinar"
      description="O chamado fica pendente até a decisão da direção ou da orientação."
      onClose={onClose}
      onSubmit={handleSubmit}
      saving={saving}
      savingLabel="Enviando…"
      submitLabel="Criar chamado"
    >
      {error && <Alert tone="error">{error}</Alert>}
      <SelectField
        label="Turma"
        value={selectedClass}
        onChange={e => {
          setLoadingStudents(true);
          setFormData(prev => ({ ...prev, studentId: '' }));
          setSelectedClass(e.target.value);
        }}
      >
        {classes.length === 0 && <option value="">Nenhuma turma disponível</option>}
        {classes.map(c => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.year})
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Aluno"
        value={formData.studentId}
        onChange={e => setFormData({ ...formData, studentId: e.target.value })}
        disabled={loadingStudents || studentsFailed}
        hint={loadingStudents ? 'Carregando alunos da turma…' : !studentsFailed && students.length === 0 ? 'Esta turma ainda não tem alunos.' : undefined}
        error={studentsFailed ? 'Não foi possível carregar os alunos desta turma. Escolha a turma de novo para tentar outra vez.' : undefined}
        required
      >
        <option value="">Selecione o aluno…</option>
        {students.map(s => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </SelectField>
      <TextAreaField
        label="Descrição da ocorrência"
        value={formData.description}
        onChange={e => setFormData({ ...formData, description: e.target.value })}
        rows={5}
        placeholder="Descreva detalhadamente a ocorrência disciplinar…"
        required
      />
    </FormDialog>
  );
};
