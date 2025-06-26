package com.upv.examcalendar;

import com.upv.examcalendar.model.Exam;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Utility class providing common test data builders and helper methods
 */
public class TestUtils {

    /**
     * Creates a basic exam with default values for testing
     */
    public static Exam createBasicExam() {
        Exam exam = new Exam();
        exam.setSubject("Test Subject");
        exam.setDegree("Test Degree");
        exam.setYear("2");
        exam.setSemester("A");
        exam.setDate(LocalDateTime.of(2024, 6, 15, 10, 0));
        exam.setRoom("T-101");
        exam.setSchool("ETSINF");
        return exam;
    }

    /**
     * Creates an exam with custom subject
     */
    public static Exam createExamWithSubject(String subject) {
        Exam exam = createBasicExam();
        exam.setSubject(subject);
        return exam;
    }

    /**
     * Creates an exam with custom date
     */
    public static Exam createExamWithDate(LocalDateTime date) {
        Exam exam = createBasicExam();
        exam.setDate(date);
        return exam;
    }

    /**
     * Creates an exam with custom degree and year
     */
    public static Exam createExamWithDegreeAndYear(String degree, String year) {
        Exam exam = createBasicExam();
        exam.setDegree(degree);
        exam.setYear(year);
        return exam;
    }

    /**
     * Creates a complete exam with all fields populated
     */
    public static Exam createCompleteExam() {
        Exam exam = new Exam();
        exam.setSubject("Advanced Data Structures");
        exam.setDegree("Computer Science");
        exam.setYear("3");
        exam.setSemester("B");
        exam.setDate(LocalDateTime.of(2024, 7, 20, 14, 30));
        exam.setRoom("A-205");
        exam.setSchool("ETSINF");
        return exam;
    }

    /**
     * Creates an exam with minimal required fields only
     */
    public static Exam createMinimalExam() {
        Exam exam = new Exam();
        exam.setSubject("Minimal Subject");
        return exam;
    }

    /**
     * Creates multiple exams for bulk testing
     */
    public static List<Exam> createMultipleExams(int count) {
        List<Exam> exams = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Exam exam = createBasicExam();
            exam.setSubject("Subject " + i);
            exam.setRoom("Room-" + (100 + i));
            exam.setDate(LocalDateTime.of(2024, 6, 15 + i, 10, 0));
            exams.add(exam);
        }
        return exams;
    }

    /**
     * Creates exams for different degrees
     */
    public static List<Exam> createExamsForDifferentDegrees() {
        List<Exam> exams = new ArrayList<>();

        String[] degrees = { "Computer Science", "Software Engineering", "Data Science", "Cybersecurity" };
        String[] subjects = { "Algorithms", "Database Design", "Machine Learning", "Network Security" };

        for (int i = 0; i < degrees.length; i++) {
            Exam exam = createBasicExam();
            exam.setDegree(degrees[i]);
            exam.setSubject(subjects[i]);
            exam.setYear(String.valueOf((i % 4) + 1));
            exams.add(exam);
        }

        return exams;
    }

    /**
     * Creates exams scheduled for different semesters
     */
    public static List<Exam> createExamsForDifferentSemesters() {
        List<Exam> exams = new ArrayList<>();

        String[] semesters = { "A", "B" };

        for (String semester : semesters) {
            for (int year = 1; year <= 4; year++) {
                Exam exam = createBasicExam();
                exam.setSemester(semester);
                exam.setYear(String.valueOf(year));
                exam.setSubject("Subject " + semester + year);
                exams.add(exam);
            }
        }

        return exams;
    }

    /**
     * Creates an exam with future date
     */
    public static Exam createFutureExam() {
        Exam exam = createBasicExam();
        exam.setDate(LocalDateTime.of(2025, 12, 31, 15, 0));
        exam.setSubject("Future Exam");
        return exam;
    }

    /**
     * Creates an exam with past date
     */
    public static Exam createPastExam() {
        Exam exam = createBasicExam();
        exam.setDate(LocalDateTime.of(2020, 1, 1, 9, 0));
        exam.setSubject("Past Exam");
        return exam;
    }

    /**
     * Creates an exam with special characters in fields
     */
    public static Exam createExamWithSpecialCharacters() {
        Exam exam = createBasicExam();
        exam.setSubject("Cálculo & Álgebra (Matemáticas)");
        exam.setDegree("Ingeniería Informática");
        exam.setRoom("Aula-Ñ/101");
        return exam;
    }

    /**
     * Creates an exam with long text fields for testing field limits
     */
    public static Exam createExamWithLongFields() {
        Exam exam = createBasicExam();
        exam.setSubject("A".repeat(500)); // Very long subject
        exam.setDegree("B".repeat(300)); // Very long degree
        exam.setRoom("C".repeat(100)); // Very long room
        return exam;
    }

    /**
     * Utility method to check if two exams are equivalent (ignoring ID)
     */
    public static boolean areExamsEquivalent(Exam exam1, Exam exam2) {
        if (exam1 == null && exam2 == null)
            return true;
        if (exam1 == null || exam2 == null)
            return false;

        return exam1.getSubject().equals(exam2.getSubject()) &&
                exam1.getDegree().equals(exam2.getDegree()) &&
                exam1.getYear().equals(exam2.getYear()) &&
                exam1.getSemester().equals(exam2.getSemester()) &&
                exam1.getDate().equals(exam2.getDate()) &&
                exam1.getRoom().equals(exam2.getRoom()) &&
                exam1.getSchool().equals(exam2.getSchool());
    }

    /**
     * Creates exam builder for fluent API testing
     */
    public static class ExamBuilder {
        private Exam exam = new Exam();

        public ExamBuilder subject(String subject) {
            exam.setSubject(subject);
            return this;
        }

        public ExamBuilder degree(String degree) {
            exam.setDegree(degree);
            return this;
        }

        public ExamBuilder year(String year) {
            exam.setYear(year);
            return this;
        }

        public ExamBuilder semester(String semester) {
            exam.setSemester(semester);
            return this;
        }

        public ExamBuilder date(LocalDateTime date) {
            exam.setDate(date);
            return this;
        }

        public ExamBuilder room(String room) {
            exam.setRoom(room);
            return this;
        }

        public ExamBuilder school(String school) {
            exam.setSchool(school);
            return this;
        }

        public Exam build() {
            return exam;
        }
    }

    /**
     * Factory method for ExamBuilder
     */
    public static ExamBuilder examBuilder() {
        return new ExamBuilder();
    }
}