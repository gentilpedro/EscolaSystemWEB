import React from 'react';
import { DisciplinaryCallsPage } from '../../features/disciplinary/DisciplinaryCallsPage';

// Responsável: somente leitura, com a resolução da escola à vista.
export const ParentDisciplinary: React.FC = () => (
  <DisciplinaryCallsPage layout="entries" description="Ocorrências registradas pela escola e a decisão tomada em cada uma." />
);
