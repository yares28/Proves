/**
 * Contract with the upstream API. These schemas are the layout-change detector:
 * if UPV renames/retypes/removes a field we depend on, validation fails loudly
 * and names the field instead of silently writing wrong data.
 */
import { z } from 'zod';
import { createHash } from 'node:crypto';

/**
 * Fields we require. `.passthrough()` keeps unknown fields so we can report new
 * ones as drift warnings rather than failing on a harmless upstream addition.
 */
export const examRowSchema = z
  .object({
    idExamen: z.number().int(),
    idTitulacion: z.number().int(),
    cursoAcademico: z.number().int(),
    curso: z.number().int(),
    cuatrimestre: z.string(),
    idAsignatura: z.number().int(),
    // A few very old records have no date. normalizeExams quarantines a row with
    // an unparseable/absent dia, so allow null here rather than aborting the run.
    dia: z.string().nullable(),
    hora: z.number().int().nullable(),
    minuto: z.number().int().nullable(),
    duracion: z.number().int().nullable(),
    nombreConvocatoriaCastellano: z.string().nullable(),
    nombreConvocatoriaValenciano: z.string().nullable(),
    nombreConvocatoriaIngles: z.string().nullable(),
    lugar: z.string().nullable(),
    // Next-year exams are sometimes published before an acronym is assigned, so
    // this arrives null. normalizeExams maps it to '' (the acronym column is NOT
    // NULL); a null here is a legitimate upstream state, not a contract change.
    siglasAsignatura: z.string().nullable(),
    siglasTitulacion: z.string(),
    comentario: z.string().nullable(),
  })
  .passthrough();

export type ExamRow = z.infer<typeof examRowSchema>;

export const examsEnvelopeSchema = z.object({
  data: z.object({
    cursoAcademico: z.number().int(),
    examenes: z.array(examRowSchema),
  }),
});

export type ExamsEnvelope = z.infer<typeof examsEnvelopeSchema>;

/** The shape upstream returns when it blows up (observed: JDBC pool exhaustion). */
export const errorEnvelopeSchema = z.object({
  timestamp: z.string().optional(),
  message: z.string(),
});

export const titulacionSchema = z
  .object({
    id: z.number().int(),
    siglas: z.string(),
    nombre: z.string(),
    plan: z.number().int(),
  })
  .passthrough();

export const titulacionesSchema = z.array(titulacionSchema);

/** Fields we know about; anything else in a payload is new and worth flagging. */
export const KNOWN_EXAM_FIELDS = new Set(Object.keys(examRowSchema.shape));

/**
 * Stable hash of the payload's field names. A change between runs means the
 * upstream contract moved, even if validation still passes.
 */
export function fingerprintFields(rows: Array<Record<string, unknown>>): string {
  const names = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) names.add(k);
  const sorted = [...names].sort();
  return createHash('sha256').update(sorted.join(',')).digest('hex').slice(0, 16);
}

/** Field names present upstream that we don't know about yet. */
export function unknownFields(rows: Array<Record<string, unknown>>): string[] {
  const extra = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r)) if (!KNOWN_EXAM_FIELDS.has(k)) extra.add(k);
  }
  return [...extra].sort();
}
