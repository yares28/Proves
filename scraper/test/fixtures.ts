/**
 * Fixtures modelled on real payloads captured from the live API, including the
 * quirks that motivated the normalizer (leading spaces, CRLF, nulls, plan
 * variants) and the actual 500 envelope observed during an upstream outage.
 */

/** Shape of an upstream row, with the nullable fields the API really sends. */
export interface RawRow {
  idExamen: number;
  idTitulacion: number;
  cursoAcademico: number;
  curso: number;
  cuatrimestre: string;
  idAsignatura: number;
  dia: string;
  hora: number | null;
  minuto: number | null;
  duracion: number | null;
  nombreConvocatoriaCastellano: string | null;
  nombreConvocatoriaValenciano: string | null;
  nombreConvocatoriaIngles: string | null;
  lugar: string | null;
  siglasAsignatura: string;
  siglasTitulacion: string;
  comentario: string | null;
}

/** A well-formed row; override fields per test. */
export const baseRow: RawRow = {
  idExamen: 1948313,
  idTitulacion: 156,
  cursoAcademico: 2025,
  curso: 4,
  cuatrimestre: 'A',
  idAsignatura: 11604,
  dia: '2025-09-25T00:00:00.000+00:00',
  hora: 8,
  minuto: 0,
  duracion: 30,
  nombreConvocatoriaCastellano: 'Modelos de negocio y áreas funcionales de la organización',
  nombreConvocatoriaValenciano: "Models de Negoci i Àrees Funcionals de l'Organització",
  nombreConvocatoriaIngles: 'Business models and company functional areas',
  lugar: 'ETS DE INGENIERÍA INFORMÁTICA',
  siglasAsignatura: 'MNE',
  siglasTitulacion: 'GIINF(2009)',
  comentario: '1 parcial online',
};

export const row = (over: Partial<RawRow> & Record<string, unknown> = {}): RawRow & Record<string, unknown> => ({
  ...baseRow,
  ...over,
});

export const envelope = (rows: unknown[], cursoAcademico = 2025) => ({
  data: { cursoAcademico, examenes: rows },
});

/** Verbatim shape returned by the upstream during the JDBC pool outage. */
export const errorEnvelope = {
  timestamp: '2026-07-16T17:04:29.82364202',
  message:
    '500 INTERNAL_SERVER_ERROR "Exception in : es.upv.etsinf.horarios.controllers.ExamenFullCalendarController@485caa8f"; nested exception is org.springframework.dao.DataAccessResourceFailureException: Unable to acquire JDBC Connection; nested exception is org.hibernate.exception.JDBCConnectionException: Unable to acquire JDBC Connection',
};

/** Real quirks seen in production data. */
export const quirkyRows = [
  // Leading space in lugar, trailing CRLF in comentario.
  row({
    idExamen: 2036183,
    idTitulacion: 243,
    siglasTitulacion: 'GCD-GIOI(2026)',
    lugar: ' 1G 1.4',
    comentario: 'Primer parcial teoría\r\n',
  }),
  // Nulls are common for lugar/comentario.
  row({ idExamen: 1968340, idTitulacion: 216, siglasTitulacion: 'GCD-GIOI(2023)', lugar: null, comentario: null }),
];

/** Same exam under two plan variants of one degree: must merge into a single row. */
export const planVariantRows = [
  row({ idExamen: 2050487, idTitulacion: 216, siglasTitulacion: 'GCD-GIOI(2023)' }),
  row({ idExamen: 2050487, idTitulacion: 243, siglasTitulacion: 'GCD-GIOI(2026)' }),
];

/** Same exam shared by two *different* degrees: both rows are legitimate. */
export const sharedExamRows = [
  row({ idExamen: 1946381, idTitulacion: 189, siglasTitulacion: 'GCD(2018)' }),
  row({ idExamen: 1946381, idTitulacion: 216, siglasTitulacion: 'GCD-GIOI(2023)' }),
];
