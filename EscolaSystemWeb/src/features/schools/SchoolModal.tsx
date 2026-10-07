import React, { useState } from 'react';
import type { School } from '../../types';
import { schoolApi } from '../../services/api';
import { Alert, CheckboxField, FormDialog, TextField, errorMessage, useConfirm } from '../../components/ui';
import { emailError, maskPhone, minLengthError, phoneError } from '../../lib/contact';
import { confirmActivation } from './activation';

export interface SchoolModalProps {
  school: School | null;
  onClose: () => void;
  onSave: () => void;
}

/** Cadastro e edição de escola; ao ligar ou desligar a escola, confirma dizendo quantas pessoas são afetadas. */
export const SchoolModal: React.FC<SchoolModalProps> = ({ school, onClose, onSave }) => {
  const confirm = useConfirm();
  const [formData, setFormData] = useState({
    name: school?.name ?? '',
    email: school?.email ?? '',
    address: school?.address ?? '',
    phone: maskPhone(school?.phone ?? ''),
    isActive: school?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Os erros de campo aparecem depois de sair do campo ou de tentar salvar, não enquanto a pessoa digita
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const fieldErrors = {
    name: minLengthError(formData.name, 3, 'O nome'),
    address: minLengthError(formData.address, 5, 'O endereço'),
    email: emailError(formData.email),
    phone: phoneError(formData.phone),
  };
  const shown = (field: keyof typeof fieldErrors) => (touched[field] ? fieldErrors[field] : undefined);
  const touch = (field: keyof typeof fieldErrors) => () => setTouched(t => ({ ...t, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(fieldErrors).some(Boolean)) {
      setTouched({ name: true, address: true, email: true, phone: true });
      setError('Corrija os campos destacados.');
      return;
    }
    if (school && formData.isActive !== school.isActive && !(await confirmActivation(confirm, school, formData.isActive))) return;
    setSaving(true);
    setError(null);
    try {
      if (school) {
        await schoolApi.update(school.id, formData);
      } else {
        await schoolApi.create(formData);
      }
      onSave();
    } catch (err) {
      setError(errorMessage(err, 'Erro ao salvar escola.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog title={school ? 'Editar escola' : 'Nova escola'} onClose={onClose} onSubmit={handleSubmit} saving={saving} submitLabel="Salvar">
      {error && <Alert tone="error">{error}</Alert>}
      <TextField
        label="Nome"
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        onBlur={touch('name')}
        error={shown('name')}
        maxLength={300}
        required
      />
      <TextField
        label="E-mail"
        type="email"
        value={formData.email}
        onChange={e => setFormData({ ...formData, email: e.target.value })}
        onBlur={touch('email')}
        error={shown('email')}
        maxLength={200}
        required
      />
      <TextField
        label="Endereço"
        value={formData.address}
        onChange={e => setFormData({ ...formData, address: e.target.value })}
        onBlur={touch('address')}
        error={shown('address')}
        maxLength={500}
        required
      />
      <TextField
        label="Telefone"
        type="tel"
        inputMode="numeric"
        className="figures"
        value={formData.phone}
        onChange={e => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
        onBlur={touch('phone')}
        error={shown('phone')}
        placeholder="(00) 00000-0000"
        required
      />
      {school && (
        <CheckboxField label="Escola ativa" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
      )}
    </FormDialog>
  );
};
