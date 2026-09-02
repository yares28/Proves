import type { Locale } from "@/lib/i18n"

/**
 * UI-chrome strings in the three languages the app offers. Castellano is the
 * source; it is also the fallback when a key is missing from va/en (see
 * hooks/use-translations). Exam/subject *content* is translated separately from
 * the data (see lib/i18n examSubject) — this catalog is only interface text.
 *
 * `{placeholder}` tokens are filled by the t() function's params argument.
 */
const es = {
  // Header
  "header.changeLanguage": "Cambiar idioma",
  "header.changeTheme": "Cambiar tema",
  "header.toggleMenu": "Alternar menú",
  "header.skipToContent": "Saltar al contenido principal",
  "user.signIn": "Iniciar sesión",
  "user.account": "Cuenta de usuario",

  // Home section heading
  "home.findPre": "Encuentra tus",
  "home.findAccent": "Exámenes",

  // Hero
  "hero.titlePre": "Encuentra tu",
  "hero.titleAccent": "Calendario de Exámenes",
  "hero.subtitle":
    "Descubre, filtra y organiza tu calendario de exámenes universitarios de la UPV. Nunca más te pierdas una fecha de examen importante.",

  // Quick search (FindExamCard)
  "find.title": "Encuentra tu Examen",
  "find.school": "Escuela",
  "find.selectSchool": "Seleccionar escuela",
  "find.loadingSchools": "Cargando escuelas...",
  "find.allSchools": "Todas las Escuelas",
  "find.loading": "Cargando...",
  "find.noSchools": "No se encontraron escuelas",
  "find.degree": "Carrera",
  "find.selectSchoolFirst": "Selecciona una escuela primero",
  "find.loadingDegrees": "Cargando carreras...",
  "find.selectDegree": "Seleccionar carrera",
  "find.allDegrees": "Todas las Carreras",
  "find.subjectAcronym": "Buscar por acrónimo o asignatura",
  "find.selectSchoolDegreeFirst": "Selecciona escuela y carrera primero",
  "find.subjectExample": "Ej. MAD, Introducción a la Programación, ...",
  "find.addMore": "Agregar más acrónimos o asignaturas...",
  "find.searchPlaceholder": "Buscar acrónimo o asignatura...",
  "find.searchButton": "Buscar Exámenes",
  "find.searching": "Buscando...",
  "find.schoolsAvailable": "{count} escuelas disponibles",
  "find.degreesAvailable": "{count} carreras disponibles",
  "find.noDegreesForSchool": "No se encontraron carreras para esta escuela",
  "find.removeItem": "Eliminar {name}",
  "find.selectToSearch": "Selecciona una escuela y carrera para buscar acrónimos o asignaturas",
  "find.typeToSearch": "Escribe para buscar acrónimos o asignaturas",
  "find.noResults": "No se encontraron resultados.",

  // Filter sidebar
  "filters.title": "Filtros",
  "filters.active": "Filtros Activos",
  "filters.schools": "Escuelas",
  "filters.degrees": "Carreras",
  "filters.semesters": "Semestres",
  "filters.years": "Años del Curso",
  "filters.subjects": "Asignaturas",
  "filters.clearAll": "Limpiar todo",
  "filters.selectAll": "Seleccionar todo",
  "filters.selectPrevious": "Selecciona una de las opciones anteriores.",
  "filters.search": "Buscar {category}...",
  "filters.noOptions": "No hay {category} disponibles para los filtros seleccionados",
  "filters.saveCalendar": "Guardar Calendario",

  // Calendar display
  "calendar.title": "Calendario de Exámenes",
  "calendar.found": "Se encontraron {count} exámenes para el período seleccionado",
  "calendar.export": "Exportar",
  "calendar.save": "Guardar",
  "calendar.loading": "Cargando exámenes...",
  "calendar.selectCriteria": "Selecciona tus criterios para ver el calendario",
  "calendar.selectCriteriaHint": "Elige tu curso, cuatrimestre o asignaturas para ver tus exámenes.",
  "calendar.upcoming": "Próximos exámenes",
  "calendar.noExams": "No se han encontrado exámenes con los filtros seleccionados.",
  "calendar.tryAdjust": "Prueba a ajustar los filtros.",
  "calendar.viewCalendar": "Calendario",
  "calendar.viewList": "Lista",
  "calendar.viewToggle": "Vista del calendario",

  // Weekday abbreviations (Monday-first)
  "day.mon": "Lu",
  "day.tue": "Ma",
  "day.wed": "Mi",
  "day.thu": "Ju",
  "day.fri": "Vi",
  "day.sat": "Sá",
  "day.sun": "Do",

  // List view
  "list.search": "Buscar exámenes...",
  "list.colDate": "Fecha",
  "list.colSubject": "Asignatura",
  "list.colTime": "Hora",
  "list.colLocation": "Ubicación",
  "list.colYear": "Año",
  "list.colSemester": "Semestre",
  "list.noMatch": "Ningún examen coincide con tu búsqueda.",
  "list.selectCriteria": "Selecciona tu año, semestre o asignaturas específicas para ver los exámenes.",

  // Statistics
  "stats.headingPre": "Confianza de",
  "stats.headingAccent": "Estudiantes",
  "stats.subtitle":
    "Únete a cientos de estudiantes que usan el Calendario de Exámenes UPV para mantenerse organizados.",
  "stats.examsLabel": "Exámenes Registrados",
  "stats.examsDesc": "Disponibles en nuestra base de datos",
  "stats.schoolsLabel": "Escuelas",
  "stats.schoolsDesc": "Conectadas a nuestra plataforma",
  "stats.subjectsLabel": "Asignaturas",
  "stats.subjectsDesc": "De todas las escuelas",

  // FAQ
  "faq.titlePre": "Preguntas",
  "faq.titleAccent": "Frecuentes",
  "faq.subtitle": "Encuentra respuestas a las preguntas más comunes sobre el Calendario de Exámenes UPV.",
  "faq.q1": "¿Cómo puedo encontrar mis exámenes?",
  "faq.a1":
    "Puedes usar los filtros en la barra lateral para seleccionar tu escuela, carrera, semestre y año. Una vez seleccionados, verás todos los exámenes disponibles que coincidan con tus criterios.",
  "faq.q2": "¿Puedo guardar mi calendario personalizado?",
  "faq.a2":
    "Sí, una vez que hayas aplicado los filtros que necesitas, puedes hacer clic en 'Guardar Calendario' para crear una versión personalizada que podrás acceder fácilmente en el futuro.",
  "faq.q3": "¿Los datos están actualizados?",
  "faq.a3":
    "Nuestra base de datos se actualiza regularmente con la información más reciente de la UPV. Trabajamos directamente con las escuelas para asegurar que tengas acceso a las fechas de examen más actuales.",
  "faq.q4": "¿Puedo exportar mi calendario?",
  "faq.a4":
    "Sí, puedes exportar tu calendario filtrado en formato ICS para importarlo en Google Calendar, Apple Calendar, Outlook u otras aplicaciones de calendario.",
  "faq.q5": "¿Es gratuito usar esta plataforma?",
  "faq.a5":
    "Absolutamente. El Calendario de Exámenes UPV es completamente gratuito para todos los estudiantes. No hay costos ocultos ni suscripciones premium.",
  "faq.q6": "¿Qué hago si no encuentro mi escuela o carrera?",
  "faq.a6":
    "Si no encuentras tu escuela o carrera en la lista, por favor contáctanos. Estamos constantemente agregando nuevas escuelas y carreras a nuestra plataforma.",

  // Footer
  "footer.rights": "© {year} Calendario de Exámenes UPV. Todos los derechos reservados.",

  // Conflicts
  "conflict.overlap": "Solapan",
  "conflict.tight": "Muy seguidos",
  "conflict.busy": "Día cargado",
  "conflict.overlapHint": "Coinciden en horario — no puedes estar en los dos.",
  "conflict.tightHint": "Menos de una hora entre ellos.",
  "conflict.busyHint": "Varios exámenes el mismo día.",
  "conflict.oneDay": "1 día con conflicto de horario",
  "conflict.manyDays": "{count} días con conflictos de horario",
  "conflict.summary": "Revisa tus asignaturas seleccionadas antes de confirmar tu horario.",
  "conflict.seeDetail": "Ver detalle",
  "conflict.hide": "Ocultar",
  "conflict.noTime": "Sin hora",
} as const

export type MessageKey = keyof typeof es

const va: Partial<Record<MessageKey, string>> = {
  "header.changeLanguage": "Canviar idioma",
  "header.changeTheme": "Canviar tema",
  "header.toggleMenu": "Alternar menú",
  "header.skipToContent": "Saltar al contingut principal",
  "user.signIn": "Iniciar sessió",
  "user.account": "Compte d’usuari",

  "home.findPre": "Troba els teus",
  "home.findAccent": "Exàmens",

  "hero.titlePre": "Troba el teu",
  "hero.titleAccent": "Calendari d'Exàmens",
  "hero.subtitle":
    "Descobreix, filtra i organitza el teu calendari d'exàmens universitaris de la UPV. Mai més et perdràs una data d'examen important.",

  "find.title": "Troba el teu Examen",
  "find.school": "Escola",
  "find.selectSchool": "Seleccionar escola",
  "find.loadingSchools": "Carregant escoles...",
  "find.allSchools": "Totes les Escoles",
  "find.loading": "Carregant...",
  "find.noSchools": "No s'han trobat escoles",
  "find.degree": "Titulació",
  "find.selectSchoolFirst": "Selecciona una escola primer",
  "find.loadingDegrees": "Carregant titulacions...",
  "find.selectDegree": "Seleccionar titulació",
  "find.allDegrees": "Totes les Titulacions",
  "find.subjectAcronym": "Cerca per acrònim o assignatura",
  "find.selectSchoolDegreeFirst": "Selecciona escola i titulació primer",
  "find.subjectExample": "Ex. MAD, Introducció a la Programació, ...",
  "find.addMore": "Afegir més acrònims o assignatures...",
  "find.searchPlaceholder": "Cerca acrònim o assignatura...",
  "find.searchButton": "Cercar Exàmens",
  "find.searching": "Cercant...",
  "find.schoolsAvailable": "{count} escoles disponibles",
  "find.degreesAvailable": "{count} titulacions disponibles",
  "find.noDegreesForSchool": "No s'han trobat titulacions per a aquesta escola",
  "find.removeItem": "Eliminar {name}",
  "find.selectToSearch": "Selecciona una escola i titulació per cercar acrònims o assignatures",
  "find.typeToSearch": "Escriu per cercar acrònims o assignatures",
  "find.noResults": "No s'han trobat resultats.",

  "filters.title": "Filtres",
  "filters.active": "Filtres Actius",
  "filters.schools": "Escoles",
  "filters.degrees": "Titulacions",
  "filters.semesters": "Semestres",
  "filters.years": "Cursos",
  "filters.subjects": "Assignatures",
  "filters.clearAll": "Netejar tot",
  "filters.selectAll": "Seleccionar tot",
  "filters.selectPrevious": "Selecciona una de les opcions anteriors.",
  "filters.search": "Cerca {category}...",
  "filters.noOptions": "No hi ha {category} disponibles per als filtres seleccionats",
  "filters.saveCalendar": "Guardar Calendari",

  "calendar.title": "Calendari d'Exàmens",
  "calendar.found": "S'han trobat {count} exàmens per al període seleccionat",
  "calendar.export": "Exportar",
  "calendar.save": "Guardar",
  "calendar.loading": "Carregant exàmens...",
  "calendar.selectCriteria": "Selecciona els teus criteris per veure el calendari",
  "calendar.selectCriteriaHint": "Tria el teu curs, quadrimestre o assignatures per veure els teus exàmens.",
  "calendar.upcoming": "Pròxims exàmens",
  "calendar.noExams": "No s'han trobat exàmens amb els filtres seleccionats.",
  "calendar.tryAdjust": "Prova a ajustar els filtres.",
  "calendar.viewCalendar": "Calendari",
  "calendar.viewList": "Llista",
  "calendar.viewToggle": "Vista del calendari",

  "day.mon": "Dl",
  "day.tue": "Dt",
  "day.wed": "Dc",
  "day.thu": "Dj",
  "day.fri": "Dv",
  "day.sat": "Ds",
  "day.sun": "Dg",

  "list.search": "Cerca exàmens...",
  "list.colDate": "Data",
  "list.colSubject": "Assignatura",
  "list.colTime": "Hora",
  "list.colLocation": "Ubicació",
  "list.colYear": "Curs",
  "list.colSemester": "Semestre",
  "list.noMatch": "Cap examen coincideix amb la teua cerca.",
  "list.selectCriteria": "Selecciona el teu curs, semestre o assignatures específiques per veure els exàmens.",

  "stats.headingPre": "Confiança dels",
  "stats.headingAccent": "Estudiants",
  "stats.subtitle":
    "Uneix-te a centenars d'estudiants que usen el Calendari d'Exàmens UPV per mantenir-se organitzats.",
  "stats.examsLabel": "Exàmens Registrats",
  "stats.examsDesc": "Disponibles a la nostra base de dades",
  "stats.schoolsLabel": "Escoles",
  "stats.schoolsDesc": "Connectades a la nostra plataforma",
  "stats.subjectsLabel": "Assignatures",
  "stats.subjectsDesc": "De totes les escoles",

  "faq.titlePre": "Preguntes",
  "faq.titleAccent": "Freqüents",
  "faq.subtitle": "Troba respostes a les preguntes més comunes sobre el Calendari d'Exàmens UPV.",
  "faq.q1": "Com puc trobar els meus exàmens?",
  "faq.a1":
    "Pots usar els filtres de la barra lateral per seleccionar la teua escola, titulació, semestre i curs. Una vegada seleccionats, veuràs tots els exàmens disponibles que coincidisquen amb els teus criteris.",
  "faq.q2": "Puc guardar el meu calendari personalitzat?",
  "faq.a2":
    "Sí, una vegada hages aplicat els filtres que necessites, pots fer clic a 'Guardar Calendari' per crear una versió personalitzada que podràs consultar fàcilment en el futur.",
  "faq.q3": "Les dades estan actualitzades?",
  "faq.a3":
    "La nostra base de dades s'actualitza regularment amb la informació més recent de la UPV. Treballem directament amb les escoles per assegurar que tingues accés a les dates d'examen més actuals.",
  "faq.q4": "Puc exportar el meu calendari?",
  "faq.a4":
    "Sí, pots exportar el teu calendari filtrat en format ICS per importar-lo a Google Calendar, Apple Calendar, Outlook o altres aplicacions de calendari.",
  "faq.q5": "És gratuït usar aquesta plataforma?",
  "faq.a5":
    "Absolutament. El Calendari d'Exàmens UPV és completament gratuït per a tots els estudiants. No hi ha costos ocults ni subscripcions premium.",
  "faq.q6": "Què faig si no trobe la meua escola o titulació?",
  "faq.a6":
    "Si no trobes la teua escola o titulació a la llista, contacta amb nosaltres. Constantment estem afegint noves escoles i titulacions a la nostra plataforma.",

  "footer.rights": "© {year} Calendari d'Exàmens UPV. Tots els drets reservats.",

  "conflict.overlap": "Se solapen",
  "conflict.tight": "Molt seguits",
  "conflict.busy": "Dia carregat",
  "conflict.overlapHint": "Coincideixen en horari — no pots estar als dos.",
  "conflict.tightHint": "Menys d'una hora entre ells.",
  "conflict.busyHint": "Diversos exàmens el mateix dia.",
  "conflict.oneDay": "1 dia amb conflicte d'horari",
  "conflict.manyDays": "{count} dies amb conflictes d'horari",
  "conflict.summary": "Revisa les teues assignatures seleccionades abans de confirmar el teu horari.",
  "conflict.seeDetail": "Veure detall",
  "conflict.hide": "Amagar",
  "conflict.noTime": "Sense hora",
}

const en: Partial<Record<MessageKey, string>> = {
  "header.changeLanguage": "Change language",
  "header.changeTheme": "Change theme",
  "header.toggleMenu": "Toggle menu",
  "header.skipToContent": "Skip to main content",
  "user.signIn": "Sign in",
  "user.account": "User account",

  "home.findPre": "Find your",
  "home.findAccent": "Exams",

  "hero.titlePre": "Find your",
  "hero.titleAccent": "Exam Calendar",
  "hero.subtitle":
    "Discover, filter and organise your UPV university exam calendar. Never miss an important exam date again.",

  "find.title": "Find your Exam",
  "find.school": "School",
  "find.selectSchool": "Select school",
  "find.loadingSchools": "Loading schools...",
  "find.allSchools": "All Schools",
  "find.loading": "Loading...",
  "find.noSchools": "No schools found",
  "find.degree": "Degree",
  "find.selectSchoolFirst": "Select a school first",
  "find.loadingDegrees": "Loading degrees...",
  "find.selectDegree": "Select degree",
  "find.allDegrees": "All Degrees",
  "find.subjectAcronym": "Search by acronym or subject",
  "find.selectSchoolDegreeFirst": "Select school and degree first",
  "find.subjectExample": "e.g. MAD, Introduction to Programming, ...",
  "find.addMore": "Add more acronyms or subjects...",
  "find.searchPlaceholder": "Search acronym or subject...",
  "find.searchButton": "Search Exams",
  "find.searching": "Searching...",
  "find.schoolsAvailable": "{count} schools available",
  "find.degreesAvailable": "{count} degrees available",
  "find.noDegreesForSchool": "No degrees found for this school",
  "find.removeItem": "Remove {name}",
  "find.selectToSearch": "Select a school and degree to search acronyms or subjects",
  "find.typeToSearch": "Type to search acronyms or subjects",
  "find.noResults": "No results found.",

  "filters.title": "Filters",
  "filters.active": "Active Filters",
  "filters.schools": "Schools",
  "filters.degrees": "Degrees",
  "filters.semesters": "Semesters",
  "filters.years": "Course Years",
  "filters.subjects": "Subjects",
  "filters.clearAll": "Clear all",
  "filters.selectAll": "Select all",
  "filters.selectPrevious": "Select one of the options above.",
  "filters.search": "Search {category}...",
  "filters.noOptions": "No {category} available for the selected filters",
  "filters.saveCalendar": "Save Calendar",

  "calendar.title": "Exam Calendar",
  "calendar.found": "Found {count} exams for the selected period",
  "calendar.export": "Export",
  "calendar.save": "Save",
  "calendar.loading": "Loading exams...",
  "calendar.selectCriteria": "Select your criteria to see the calendar",
  "calendar.selectCriteriaHint": "Choose your year, semester or subjects to see your exams.",
  "calendar.upcoming": "Upcoming exams",
  "calendar.noExams": "No exams found with the selected filters.",
  "calendar.tryAdjust": "Try adjusting the filters.",
  "calendar.viewCalendar": "Calendar",
  "calendar.viewList": "List",
  "calendar.viewToggle": "Calendar view",

  "day.mon": "Mo",
  "day.tue": "Tu",
  "day.wed": "We",
  "day.thu": "Th",
  "day.fri": "Fr",
  "day.sat": "Sa",
  "day.sun": "Su",

  "list.search": "Search exams...",
  "list.colDate": "Date",
  "list.colSubject": "Subject",
  "list.colTime": "Time",
  "list.colLocation": "Location",
  "list.colYear": "Year",
  "list.colSemester": "Semester",
  "list.noMatch": "No exam matches your search.",
  "list.selectCriteria": "Select your year, semester or specific subjects to see the exams.",

  "stats.headingPre": "Trusted by",
  "stats.headingAccent": "Students",
  "stats.subtitle":
    "Join hundreds of students who use the UPV Exam Calendar to stay organised.",
  "stats.examsLabel": "Registered Exams",
  "stats.examsDesc": "Available in our database",
  "stats.schoolsLabel": "Schools",
  "stats.schoolsDesc": "Connected to our platform",
  "stats.subjectsLabel": "Subjects",
  "stats.subjectsDesc": "From every school",

  "faq.titlePre": "Frequently Asked",
  "faq.titleAccent": "Questions",
  "faq.subtitle": "Find answers to the most common questions about the UPV Exam Calendar.",
  "faq.q1": "How can I find my exams?",
  "faq.a1":
    "You can use the filters in the sidebar to select your school, degree, semester and year. Once selected, you'll see every available exam that matches your criteria.",
  "faq.q2": "Can I save my personalised calendar?",
  "faq.a2":
    "Yes — once you've applied the filters you need, you can click 'Save Calendar' to create a personalised version you can easily access later.",
  "faq.q3": "Is the data up to date?",
  "faq.a3":
    "Our database is updated regularly with the latest information from the UPV. We work directly with the schools to make sure you have access to the most current exam dates.",
  "faq.q4": "Can I export my calendar?",
  "faq.a4":
    "Yes, you can export your filtered calendar in ICS format to import it into Google Calendar, Apple Calendar, Outlook or other calendar apps.",
  "faq.q5": "Is this platform free to use?",
  "faq.a5":
    "Absolutely. The UPV Exam Calendar is completely free for all students. There are no hidden costs or premium subscriptions.",
  "faq.q6": "What if I can't find my school or degree?",
  "faq.a6":
    "If you can't find your school or degree in the list, please contact us. We're constantly adding new schools and degrees to our platform.",

  "footer.rights": "© {year} UPV Exam Calendar. All rights reserved.",

  "conflict.overlap": "Overlap",
  "conflict.tight": "Back-to-back",
  "conflict.busy": "Busy day",
  "conflict.overlapHint": "They clash in time — you can't sit both.",
  "conflict.tightHint": "Less than an hour between them.",
  "conflict.busyHint": "Several exams on the same day.",
  "conflict.oneDay": "1 day with a scheduling conflict",
  "conflict.manyDays": "{count} days with scheduling conflicts",
  "conflict.summary": "Review your selected subjects before confirming your schedule.",
  "conflict.seeDetail": "See detail",
  "conflict.hide": "Hide",
  "conflict.noTime": "No time",
}

export const messages: Record<Locale, Partial<Record<MessageKey, string>>> = { es, va, en }
