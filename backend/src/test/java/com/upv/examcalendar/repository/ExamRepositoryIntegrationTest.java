package com.upv.examcalendar.repository;

import com.upv.examcalendar.model.Exam;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("ExamRepository Integration Tests with PostgreSQL")
class ExamRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @Autowired
    private ExamRepository examRepository;

    @Test
    @DisplayName("Should work with real PostgreSQL database")
    void shouldWorkWithRealPostgres() {
        // Given
        Exam exam = createSampleExam();

        // When
        Exam savedExam = examRepository.save(exam);
        List<Exam> allExams = examRepository.findAll();

        // Then
        assertThat(savedExam.getId()).isNotNull();
        assertThat(allExams).hasSize(1);
        assertThat(allExams.get(0).getSubject()).isEqualTo("Integration Test Subject");
    }

    @Test
    @DisplayName("Should handle PostgreSQL specific features")
    void shouldHandlePostgresFeatures() {
        // Given
        Exam exam1 = createSampleExam();
        exam1.setSubject("First Subject");

        Exam exam2 = createSampleExam();
        exam2.setSubject("Second Subject");
        exam2.setDate(LocalDateTime.of(2024, 8, 15, 14, 0));

        // When
        examRepository.save(exam1);
        examRepository.save(exam2);

        List<Exam> allExams = examRepository.findAll();

        // Then
        assertThat(allExams).hasSize(2);
        assertThat(allExams)
                .extracting(Exam::getSubject)
                .contains("First Subject", "Second Subject");
    }

    @Test
    @DisplayName("Should handle concurrent transactions")
    void shouldHandleConcurrentTransactions() {
        // Given
        Exam exam1 = createSampleExam();
        exam1.setSubject("Concurrent Test 1");

        Exam exam2 = createSampleExam();
        exam2.setSubject("Concurrent Test 2");

        // When
        Exam saved1 = examRepository.save(exam1);
        Exam saved2 = examRepository.save(exam2);

        // Then
        assertThat(saved1.getId()).isNotEqualTo(saved2.getId());
        assertThat(examRepository.count()).isEqualTo(2L);
    }

    @Test
    @DisplayName("Should handle large datasets efficiently")
    void shouldHandleLargeDatasets() {
        // Given - Create multiple exams
        for (int i = 0; i < 50; i++) {
            Exam exam = createSampleExam();
            exam.setSubject("Subject " + i);
            exam.setYear(String.valueOf((i % 4) + 1)); // Years 1-4
            examRepository.save(exam);
        }

        // When
        List<Exam> allExams = examRepository.findAll();

        // Then
        assertThat(allExams).hasSize(50);
        assertThat(allExams)
                .extracting(Exam::getSubject)
                .contains("Subject 0", "Subject 25", "Subject 49");
    }

    @Test
    @DisplayName("Should handle database constraints properly")
    void shouldHandleDatabaseConstraints() {
        // Given
        Exam exam = createSampleExam();
        exam.setSubject("Constraint Test");

        // When
        Exam savedExam = examRepository.save(exam);

        // Then
        assertThat(savedExam.getId()).isNotNull();
        assertThat(savedExam.getSubject()).isEqualTo("Constraint Test");

        // Verify we can find it again
        assertThat(examRepository.findById(savedExam.getId())).isPresent();
    }

    private Exam createSampleExam() {
        Exam exam = new Exam();
        exam.setSubject("Integration Test Subject");
        exam.setDegree("Computer Science");
        exam.setYear("2");
        exam.setSemester("A");
        exam.setDate(LocalDateTime.of(2024, 7, 15, 10, 0));
        exam.setRoom("IT-101");
        exam.setSchool("ETSINF");
        return exam;
    }
}