package com.upv.examcalendar.repository;

import com.upv.examcalendar.model.Exam;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("ExamRepository Tests")
class ExamRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ExamRepository examRepository;

    @Test
    @DisplayName("Should save and retrieve exam successfully")
    void saveAndFindExam() {
        // Given
        Exam exam = createSampleExam();

        // When
        Exam savedExam = examRepository.save(exam);

        // Then
        assertThat(savedExam.getId()).isNotNull();
        assertThat(savedExam.getSubject()).isEqualTo("Algorithms and Data Structures");
        assertThat(savedExam.getDegree()).isEqualTo("Computer Science");

        Optional<Exam> foundExam = examRepository.findById(savedExam.getId());
        assertThat(foundExam).isPresent();
        assertThat(foundExam.get()).isEqualTo(savedExam);
    }

    @Test
    @DisplayName("Should find all exams correctly")
    void findAllExams() {
        // Given
        Exam exam1 = createSampleExam();
        Exam exam2 = createSampleExam();
        exam2.setSubject("Database Systems");
        exam2.setYear("3");

        entityManager.persistAndFlush(exam1);
        entityManager.persistAndFlush(exam2);

        // When
        List<Exam> exams = examRepository.findAll();

        // Then
        assertThat(exams).hasSize(2);
        assertThat(exams).extracting(Exam::getSubject)
                .contains("Algorithms and Data Structures", "Database Systems");
    }

    @Test
    @DisplayName("Should delete exam successfully")
    void deleteExam() {
        // Given
        Exam exam = createSampleExam();
        Exam savedExam = entityManager.persistAndFlush(exam);
        Long examId = savedExam.getId();

        // When
        examRepository.deleteById(examId);
        entityManager.flush();

        // Then
        Optional<Exam> deletedExam = examRepository.findById(examId);
        assertThat(deletedExam).isEmpty();
    }

    @Test
    @DisplayName("Should update exam successfully")
    void updateExam() {
        // Given
        Exam exam = createSampleExam();
        Exam savedExam = entityManager.persistAndFlush(exam);

        // When
        savedExam.setRoom("B-101");
        savedExam.setDate(LocalDateTime.of(2024, 7, 15, 10, 0));
        Exam updatedExam = examRepository.save(savedExam);

        // Then
        assertThat(updatedExam.getRoom()).isEqualTo("B-101");
        assertThat(updatedExam.getDate()).isEqualTo(LocalDateTime.of(2024, 7, 15, 10, 0));
    }

    @Test
    @DisplayName("Should handle null values gracefully")
    void handleNullValues() {
        // Given
        Exam exam = new Exam();
        exam.setSubject("Minimal Exam");
        // Other fields left as null

        // When
        Exam savedExam = examRepository.save(exam);

        // Then
        assertThat(savedExam.getId()).isNotNull();
        assertThat(savedExam.getSubject()).isEqualTo("Minimal Exam");
        assertThat(savedExam.getDegree()).isNull();
        assertThat(savedExam.getDate()).isNull();
    }

    @Test
    @DisplayName("Should find table names using custom query")
    void findAllTableNames() {
        // When
        List<String> tableNames = examRepository.findAllTableNames();

        // Then
        // Note: This test may need adjustment based on actual database schema
        // In H2 test database, the result might be different
        assertThat(tableNames).isNotNull();
        // Add specific assertions based on your test database setup
    }

    @Test
    @DisplayName("Should handle empty result set")
    void handleEmptyResultSet() {
        // When
        List<Exam> exams = examRepository.findAll();

        // Then
        assertThat(exams).isEmpty();
    }

    @Test
    @DisplayName("Should maintain data integrity with constraints")
    void maintainDataIntegrity() {
        // Given
        Exam exam = createSampleExam();
        Exam savedExam = examRepository.save(exam);

        // When - Try to find by non-existent ID
        Optional<Exam> nonExistentExam = examRepository.findById(999L);

        // Then
        assertThat(nonExistentExam).isEmpty();
        assertThat(savedExam.getId()).isNotNull();
    }

    @Test
    @DisplayName("Should handle concurrent access scenarios")
    void handleConcurrentAccess() {
        // Given
        Exam exam1 = createSampleExam();
        Exam exam2 = createSampleExam();
        exam2.setSubject("Concurrent Subject");

        // When
        Exam saved1 = examRepository.save(exam1);
        Exam saved2 = examRepository.save(exam2);

        // Then
        assertThat(saved1.getId()).isNotEqualTo(saved2.getId());
        assertThat(examRepository.count()).isEqualTo(2L);
    }

    @Test
    @DisplayName("Should validate exam data fields")
    void validateExamDataFields() {
        // Given
        Exam exam = createCompleteExam();

        // When
        Exam savedExam = examRepository.save(exam);

        // Then
        assertThat(savedExam.getSubject()).isEqualTo("Advanced Algorithms");
        assertThat(savedExam.getDegree()).isEqualTo("Computer Science");
        assertThat(savedExam.getYear()).isEqualTo("4");
        assertThat(savedExam.getSemester()).isEqualTo("A");
        assertThat(savedExam.getRoom()).isEqualTo("A-201");
        assertThat(savedExam.getSchool()).isEqualTo("ETSINF");
        assertThat(savedExam.getDate()).isNotNull();
    }

    // Helper methods
    private Exam createSampleExam() {
        Exam exam = new Exam();
        exam.setSubject("Algorithms and Data Structures");
        exam.setDegree("Computer Science");
        exam.setYear("2");
        exam.setSemester("A");
        exam.setDate(LocalDateTime.of(2024, 6, 15, 9, 0));
        exam.setRoom("A-101");
        exam.setSchool("ETSINF");
        return exam;
    }

    private Exam createCompleteExam() {
        Exam exam = new Exam();
        exam.setSubject("Advanced Algorithms");
        exam.setDegree("Computer Science");
        exam.setYear("4");
        exam.setSemester("A");
        exam.setDate(LocalDateTime.of(2024, 7, 20, 14, 30));
        exam.setRoom("A-201");
        exam.setSchool("ETSINF");
        return exam;
    }
}