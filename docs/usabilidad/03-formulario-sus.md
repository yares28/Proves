# Cuestionario SUS — para pegar en Google Forms

Crea un formulario nuevo y añade estas preguntas. **Todas de tipo "Escala lineal",
de 1 a 5**, con etiquetas:

- 1 = "Totalmente en desacuerdo"
- 5 = "Totalmente de acuerdo"

Marca todas como obligatorias. **No cambies el orden**: el cálculo depende de que
los ítems impares sean los positivos y los pares los negativos.

---

**Pregunta 0 (texto corto, obligatoria):** Identificador de participante (P1, P2, …)

1. Creo que usaría esta aplicación con frecuencia.
2. Encuentro la aplicación innecesariamente compleja.
3. Creo que la aplicación es fácil de usar.
4. Creo que necesitaría ayuda de una persona con conocimientos técnicos para poder usar esta aplicación.
5. Las distintas funciones de la aplicación están bien integradas.
6. Creo que la aplicación presenta demasiadas inconsistencias.
7. Imagino que la mayoría de la gente aprendería a usar esta aplicación con rapidez.
8. Encuentro la aplicación muy incómoda de usar.
9. Me he sentido seguro usando la aplicación.
10. Necesitaría aprender muchas cosas antes de poder manejar la aplicación.

---

**Preguntas abiertas finales** (tipo "Párrafo", no obligatorias):

11. ¿Qué es lo que más te ha costado?
12. ¿Qué echas en falta?
13. ¿Usarías esto en el próximo periodo de exámenes? ¿Por qué?

---

## Cómo pasar las respuestas al script

1. En Forms: **Respuestas → icono de Sheets → Descargar como CSV**.
2. Abre el CSV y **borra las columnas de marca temporal y las tres preguntas
   abiertas**. Deben quedar: identificador + Q1..Q10.
3. Guárdalo como `docs/usabilidad/respuestas.csv`.
4. Ejecuta:

```
npm run sus
```

El script ignora la fila de cabecera y valida que cada respuesta esté entre 1 y 5.
