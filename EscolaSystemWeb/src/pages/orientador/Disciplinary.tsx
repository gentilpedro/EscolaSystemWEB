import React from 'react';
import { DisciplinaryCallsPage } from '../../features/disciplinary/DisciplinaryCallsPage';

// Orientação: abre e resolve chamados das turmas que acompanha.
export const OrientadorDisciplinary: React.FC = () => <DisciplinaryCallsPage canCreate canResolve />;
