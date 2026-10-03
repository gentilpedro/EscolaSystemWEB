import React from 'react';
import { DisciplinaryCallsPage } from '../../features/disciplinary/DisciplinaryCallsPage';

// Direção: lê e decide (aprova/rejeita) os chamados da escola.
export const DirectorDisciplinary: React.FC = () => <DisciplinaryCallsPage canResolve />;
