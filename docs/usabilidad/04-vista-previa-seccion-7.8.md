# Vista previa — cómo quedará el apartado 7.8 con resultados

> ⚠️ **DATOS SINTÉTICOS.** Las cifras de este documento proceden de
> `respuestas.DEMO-sintetica.csv`, generado para comprobar que el cálculo y la
> redacción funcionan. **No son resultados: nadie ha respondido todavía.**
> Sirve para ver la forma de la sección antes de invertir tiempo en las sesiones.
> Al ejecutar el estudio real, se sustituyen todas las cifras marcadas `[DEMO]`.

---

## 7.8.3. Resultados *(borrador con datos sintéticos)*

### Tabla A — Tasa de finalización por tarea

| Tarea | Completada | Observación |
|---|---|---|
| T1 Localizar un examen concreto | 9/9 `[DEMO]` | — |
| T2 Curso y semestre, ambas vistas | 9/9 `[DEMO]` | — |
| T3 Crear cuenta e iniciar sesión | 9/9 `[DEMO]` | — |
| T4 Guardar y recuperar un calendario | 8/9 `[DEMO]` | — |
| T5 Suscribirse desde el móvil | 5/9 `[DEMO]` | punto débil |

### Tabla B — Puntuación SUS por participante

| Participante | SUS |
|---|---|
| P1 | 85,0 `[DEMO]` |
| P2 | 70,0 `[DEMO]` |
| P3 | 90,0 `[DEMO]` |
| P4 | 62,5 `[DEMO]` |
| P5 | 77,5 `[DEMO]` |
| P6 | 65,0 `[DEMO]` |
| P7 | 82,5 `[DEMO]` |
| P8 | 50,0 `[DEMO]` |
| P9 | 87,5 `[DEMO]` |

**Media 74,4 · Mediana 77,5 · Desviación típica 13,5 · IC 95 % [65,7 – 83,2]** `[DEMO]`

### Redacción propuesta

> Participaron nueve estudiantes `[DEMO]` con los perfiles descritos en el
> apartado anterior. La puntuación SUS media fue de 74,4 `[DEMO]` sobre 100, con
> una mediana de 77,5 y una desviación típica de 13,5 `[DEMO]`. Situada frente a
> la referencia habitual de 68 puntos, la cifra corresponde a una usabilidad por
> encima de la media, en el tramo que la escala de Sauro y Lewis califica como
> «bueno». Conviene no sobreinterpretarla: con nueve participantes el intervalo
> de confianza del 95 % abarca de 65,7 a 83,2 `[DEMO]`, de modo que el resultado
> es indicativo y no concluyente.
>
> Las tareas de consulta —localizar un examen, filtrar por curso y semestre y
> alternar entre las dos vistas— las completaron todos los participantes sin
> intervención `[DEMO]`, lo que confirma que el recorrido central de la
> aplicación resulta comprensible sin explicación previa.
>
> El punto débil se concentró en la suscripción desde el móvil (T5), completada
> por cinco de nueve participantes `[DEMO]`. El obstáculo no estuvo en la
> aplicación sino en la frontera con el sistema operativo: el flujo abandona la
> web y continúa en la aplicación de calendario del teléfono, y varios
> participantes no reconocieron ese salto como parte de la tarea. Es un hallazgo
> valioso porque no era detectable desde las pruebas automatizadas ni desde la
> auditoría de accesibilidad: ambas verifican que el feed se genera y se sirve
> correctamente, que es justamente lo que sí ocurría.
>
> La dispersión de las puntuaciones (de 50 a 90 `[DEMO]`) fue mayor que la
> esperada y se corresponde con el perfil de los participantes: quienes ya tenían
> una estrategia propia para organizar sus exámenes puntuaron más alto que
> quienes se enfrentaban por primera vez a la herramienta.

---

## Qué cambiar cuando tengas datos reales

1. Sustituir cada cifra `[DEMO]` por la real (`npm run sus` las da todas).
2. Ajustar el número de participantes y los perfiles al grupo efectivo.
3. Reescribir el párrafo del punto débil: **puede que el tuyo no sea T5.**
   Esa frase es una hipótesis razonable, no un resultado.
4. Añadir dos o tres citas literales de las preguntas abiertas — es lo que
   distingue una evaluación real de un resumen de cifras.
5. Borrar este fichero y `respuestas.DEMO-sintetica.csv`.
