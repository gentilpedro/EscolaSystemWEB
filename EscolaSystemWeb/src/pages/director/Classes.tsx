import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import type { ClassItem, PagedResult } from '../../types';
import { classApi } from '../../services/api';
import { useAuth } from '../../contexts/auth';
import {
  ActiveStamp,
  Alert,
  Button,
  CheckboxField,
  EmptyState,
  FilterBar,
  FormDialog,
  IconButton,
  LoadError,
  PageHeader,
  PageLoader,
  RowActions,
  SearchInput,
  TableEmptyRow,
  TableFrame,
  TBody,
  Td,
  TextField,
  Th,
  THead,
  Tr,
  errorMessage,
  useConfirm,
  useToast,
} from '../../components/ui';
import { matches, plural } from '../../lib/format';

export const DirectorClasses: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      const data: PagedResult<ClassItem> = await classApi.list(1, 100);
      setClasses(data.items);
      setError(null);
    } catch {
      setError('Erro ao carregar turmas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assíncrona: o setState só acontece depois do await
    fetchClasses();
  }, [fetchClasses]);

  const handleDelete = async (cls: ClassItem) => {
    const ok = await confirm({
      title: `Excluir a turma ${cls.name}?`,
      description: `Ano letivo ${cls.year}`,
      consequence: 'Só é possível excluir turma sem alunos nem histórico (notas, chamadas, trabalhos). Para encerrar o ano, edite e desmarque "Turma ativa".',
      confirmLabel: 'Excluir turma',
    });
    if (!ok) return;
    try {
      await classApi.delete(cls.id);
      toast.success(`${cls.name} foi excluída.`);
      fetchClasses();
    } catch (err) {
      toast.error(errorMessage(err, 'Erro ao excluir turma.'));
    }
  };

  const filtered = classes.filter(c => matches(searchTerm, c.name, c.year));

  return (
    <>
      <PageHeader
        title="Turmas"
        description={!loading ? plural(classes.length, 'turma', 'turmas') : undefined}
        actions={
          <Button
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              setEditingClass(null);
              setShowModal(true);
            }}
          >
            Nova turma
          </Button>
        }
      />

      {loading ? (
        <PageLoader label="Carregando turmas…" />
      ) : (
        <>
          {error && <LoadError message={error} onRetry={() => { setLoading(true); fetchClasses(); }} />}

          <FilterBar>
            <SearchInput label="Pesquisar turmas" value={searchTerm} onChange={setSearchTerm} placeholder="Pesquisar por nome ou ano…" />
          </FilterBar>

          <TableFrame caption="Turmas da escola" minWidth="36rem">
            <THead>
              <Th sticky>Nome</Th>
              <Th>Ano</Th>
              <Th>Situação</Th>
              <Th align="right" srOnly>
                Ações
              </Th>
            </THead>
            <TBody>
              {filtered.length === 0 ? (
                <TableEmptyRow colSpan={4}>
                  <EmptyState icon={BookOpen} title={classes.length === 0 ? 'Nenhuma turma cadastrada' : 'Nenhuma turma encontrada'} compact>
                    {classes.length === 0 ? 'Use “Nova turma” para criar a primeira.' : 'Ajuste a busca.'}
                  </EmptyState>
                </TableEmptyRow>
              ) : (
                filtered.map(cls => (
                  <Tr key={cls.id}>
                    <Td sticky strong className="whitespace-nowrap">
                      {cls.name}
                    </Td>
                    <Td className="figures">{cls.year}</Td>
                    <Td>
                      <ActiveStamp active={cls.isActive} feminine />
                    </Td>
                    <Td align="right">
                      <RowActions
                        destructive={
                          <IconButton tone="danger" label={`Excluir ${cls.name}`} icon={<Trash2 className="h-5 w-5" />} onClick={() => handleDelete(cls)} />
                        }
                      >
                        <IconButton
                          label={`Editar ${cls.name}`}
                          icon={<Pencil className="h-5 w-5" />}
                          onClick={() => {
                            setEditingClass(cls);
                            setShowModal(true);
                          }}
                        />
                      </RowActions>
                    </Td>
                  </Tr>
                ))
              )}
            </TBody>
          </TableFrame>
        </>
      )}

      {showModal && (
        <ClassModal
          cls={editingClass}
          directorSchoolId={user?.schoolId}
          onClose={() => setShowModal(false)}
          onSave={() => {
            toast.success(editingClass ? 'Turma atualizada.' : 'Turma criada.');
            setShowModal(false);
            fetchClasses();
          }}
        />
      )}
    </>
  );
};

const ClassModal: React.FC<{ cls: ClassItem | null; directorSchoolId?: string; onClose: () => void; onSave: () => void }> = ({
  cls,
  directorSchoolId,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: cls?.name ?? '',
    year: cls?.year ?? new Date().getFullYear(),
    schoolId: cls?.schoolId ?? '',
    isActive: cls?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (cls) {
        await classApi.update(cls.id, { name: formData.name, year: formData.year, schoolId: cls.schoolId, isActive: formData.isActive });
      } else {
        await classApi.create({ name: formData.name, year: formData.year, schoolId: directorSchoolId ?? undefined });
      }
      onSave();
    } catch (err) {
      setError(errorMessage(err, 'Erro ao salvar turma.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog title={cls ? 'Editar turma' : 'Nova turma'} onClose={onClose} onSubmit={handleSubmit} saving={saving} submitLabel="Salvar" size="sm">
      {error && <Alert tone="error">{error}</Alert>}
      <TextField
        label="Nome"
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        placeholder="Ex.: 6º Ano A"
        required
      />
      <TextField
        label="Ano letivo"
        type="number"
        className="figures"
        value={formData.year}
        onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
        min={2020}
        max={2100}
        required
      />
      {cls && (
        <CheckboxField label="Turma ativa" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
      )}
    </FormDialog>
  );
};
