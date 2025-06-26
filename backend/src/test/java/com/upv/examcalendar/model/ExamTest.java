package com.upv.examcalendar.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Exam Model Tests")
class ExamTest {

    private Exam exam;

    @BeforeEach
    void setUp() {
        exam = new Exam();
    }

    @Test
    @DisplayName("Should create exam with default values")
    void createExamWithDefaults() {
        // Then
        assertThat(exam.getId()).isNull();
        assertThat(exam.getSubject()).isNull();
        assertThat(exam.getDegree()).isNull();
        assertThat(exam.getYear()).isNull();
        assertThat(exam.getSemester()).isNull();
        assertThat(exam.getDate()).isNull();
        assertThat(exam.getRoom()).isNull();
        assertThat(exam.getSchool()).isNull();
    }

    @Test
    @DisplayName("Should set and get subject correctly")
    void setAndGetSubject() {
        // Given
        String subject = "Advanced Programming";

        // When
        exam.setSubject(subject);

        // Then
        assertThat(exam.getSubject()).isEqualTo(subject);
    }

    @Test
    @DisplayName("Should set and get degree correctly")
    void setAndGetDegree() {
        // Given
        String degree = "Computer Engineering";

        // When
        exam.setDegree(degree);

        // Then
        assertThat(exam.getDegree()).isEqualTo(degree);
    }

    @Test
    @DisplayName("Should set and get year correctly")
    void setAndGetYear() {
        // Given
        String year = "3";

        // When
        exam.setYear(year);

        // Then
        assertThat(exam.getYear()).isEqualTo(year);
    }

    @Test
    @DisplayName("Should set and get semester correctly")
    void setAndGetSemester() {
        // Given
        String semester = "B";

        // When
        exam.setSemester(semester);

        // Then
        assertThat(exam.getSemester()).isEqualTo(semester);
    }

    @Test
    @DisplayName("Should set and get date correctly")
    void setAndGetDate() {
        // Given
        LocalDateTime date = LocalDateTime.of(2024, 6, 15, 10, 30);

        // When
        exam.setDate(date);

        // Then
        assertThat(exam.getDate()).isEqualTo(date);
    }

    @Test
    @DisplayName("Should set and get room correctly")
    void setAndGetRoom() {
        // Given
        String room = "B-205";

        // When
        exam.setRoom(room);

        // Then
        assertThat(exam.getRoom()).isEqualTo(room);
    }

    @Test
    @DisplayName("Should set and get school correctly")
    void setAndGetSchool() {
        // Given
        String school = "ETSINF";

        // When
        exam.setSchool(school);

        // Then
        assertThat(exam.getSchool()).isEqualTo(school);
    }

    @Test
    @DisplayName("Should set and get ID correctly")
    void setAndGetId() {
        // Given
        Long id = 123L;

        // When
        exam.setId(id);

        // Then
        assertThat(exam.getId()).isEqualTo(id);
    }

    @Test
    @DisplayName("Should handle null values gracefully")
    void handleNullValues() {
        // When
        exam.setSubject(null);
        exam.setDegree(null);
        exam.setYear(null);
        exam.setSemester(null);
        exam.setDate(null);
        exam.setRoom(null);
        exam.setSchool(null);

        // Then
        assertThat(exam.getSubject()).isNull();
        assertThat(exam.getDegree()).isNull();
        assertThat(exam.getYear()).isNull();
        assertThat(exam.getSemester()).isNull();
        assertThat(exam.getDate()).isNull();
        assertThat(exam.getRoom()).isNull();
        assertThat(exam.getSchool()).isNull();
    }

    @Test
    @DisplayName("Should handle empty strings")
    void handleEmptyStrings() {
        // When
        exam.setSubject("");
        exam.setDegree("");
        exam.setYear("");
        exam.setSemester("");
        exam.setRoom("");
        exam.setSchool("");

        // Then
        assertThat(exam.getSubject()).isEmpty();
        assertThat(exam.getDegree()).isEmpty();
        assertThat(exam.getYear()).isEmpty();
        assertThat(exam.getSemester()).isEmpty();
        assertThat(exam.getRoom()).isEmpty();
        assertThat(exam.getSchool()).isEmpty();
    }

    @Test
    @DisplayName("Should create complete exam object")
    void createCompleteExam() {
        // Given
        Long id = 1L;
        String subject = "Data Structures";
        String degree = "Computer Science";
        String year = "2";
        String semester = "A";
        LocalDateTime date = LocalDateTime.of(2024, 7, 20, 9, 0);
        String room = "A-101";
        String school = "ETSINF";

        // When
        exam.setId(id);
        exam.setSubject(subject);
        exam.setDegree(degree);
        exam.setYear(year);
        exam.setSemester(semester);
        exam.setDate(date);
        exam.setRoom(room);
        exam.setSchool(school);

        // Then
        assertThat(exam.getId()).isEqualTo(id);
        assertThat(exam.getSubject()).isEqualTo(subject);
        assertThat(exam.getDegree()).isEqualTo(degree);
        assertThat(exam.getYear()).isEqualTo(year);
        assertThat(exam.getSemester()).isEqualTo(semester);
        assertThat(exam.getDate()).isEqualTo(date);
        assertThat(exam.getRoom()).isEqualTo(room);
        assertThat(exam.getSchool()).isEqualTo(school);
    }

    @Test
    @DisplayName("Should support equals and hashCode consistency")
    void equalsAndHashCodeConsistency() {
        // Given
        Exam exam1 = createSampleExam();
        Exam exam2 = createSampleExam();

        // When/Then
        // Test equality
        assertThat(exam1).isEqualTo(exam2);
        assertThat(exam1.hashCode()).isEqualTo(exam2.hashCode());

        // Test inequality when IDs differ
        exam2.setId(999L);
        assertThat(exam1).isNotEqualTo(exam2);
    }

    @Test
    @DisplayName("Should support toString method")
    void toStringMethod() {
        // Given
        exam.setId(1L);
        exam.setSubject("Test Subject");
        exam.setDegree("Test Degree");

        // When
        String result = exam.toString();

        // Then
        assertThat(result).isNotNull();
        assertThat(result).contains("Exam");
        // Lombok @Data generates toString, so we just verify it's not null and contains
        // class name
    }

    @Test
    @DisplayName("Should handle special characters in string fields")
    void handleSpecialCharacters() {
        // Given
        String specialSubject = "Cálculo & Álgebra (español)";
        String specialRoom = "Aula-Ñ/101";
        String specialDegree = "Ingeniería Informática";

        // When
        exam.setSubject(specialSubject);
        exam.setRoom(specialRoom);
        exam.setDegree(specialDegree);

        // Then
        assertThat(exam.getSubject()).isEqualTo(specialSubject);
        assertThat(exam.getRoom()).isEqualTo(specialRoom);
        assertThat(exam.getDegree()).isEqualTo(specialDegree);
    }

    @Test
    @DisplayName("Should handle long string values")
    void handleLongStrings() {
        // Given
        String longSubject = "A".repeat(1000); // Very long subject name
        String longDegree = "B".repeat(500);

        // When
        exam.setSubject(longSubject);
        exam.setDegree(longDegree);

        // Then
        assertThat(exam.getSubject()).isEqualTo(longSubject);
        assertThat(exam.getDegree()).isEqualTo(longDegree);
        assertThat(exam.getSubject()).hasSize(1000);
        assertThat(exam.getDegree()).hasSize(500);
    }

    @Test
    @DisplayName("Should handle edge case dates")
    void handleEdgeCaseDates() {
        // Given
        LocalDateTime futureDate = LocalDateTime.of(2030, 12, 31, 23, 59);
        LocalDateTime pastDate = LocalDateTime.of(2000, 1, 1, 0, 0);

        // When & Then
        exam.setDate(futureDate);
        assertThat(exam.getDate()).isEqualTo(futureDate);

        exam.setDate(pastDate);
        assertThat(exam.getDate()).isEqualTo(pastDate);
    }

    @Test
    @DisplayName("Should maintain object state consistency")
    void maintainStateConsistency() {
        // Given
        Exam originalExam = createSampleExam();

        // When - Modify one field
        originalExam.setRoom("New Room");

        // Then - Other fields should remain unchanged
        assertThat(originalExam.getSubject()).isEqualTo("Test Subject");
        assertThat(originalExam.getDegree()).isEqualTo("Test Degree");
        assertThat(originalExam.getYear()).isEqualTo("2");
        assertThat(originalExam.getRoom()).isEqualTo("New Room"); // This should be changed
    }

    // Helper method
    private Exam createSampleExam() {
        Exam exam = new Exam();
        exam.setId(1L);
        exam.setSubject("Test Subject");
        exam.setDegree("Test Degree");
        exam.setYear("2");
        exam.setSemester("A");
        exam.setDate(LocalDateTime.of(2024, 6, 15, 10, 0));
        exam.setRoom("A-101");
        exam.setSchool("ETSINF");
        return exam;
    }
}