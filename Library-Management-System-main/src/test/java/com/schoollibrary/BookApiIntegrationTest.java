package com.schoollibrary;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schoollibrary.repository.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BookApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void clearBooks() {
        bookRepository.deleteAll();
    }

    @Test
    void supportsBookCrudAndKeepsAnExistingIsbnOnUpdate() throws Exception {
        MvcResult created = mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookJson("  The Hobbit ", " J.R.R. Tolkien ", " 978-1 ", true)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("The Hobbit"))
                .andExpect(jsonPath("$.author").value("J.R.R. Tolkien"))
                .andReturn();
        JsonNode book = objectMapper.readTree(created.getResponse().getContentAsString());
        long id = book.get("id").asLong();

        mockMvc.perform(get("/api/books"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].isbn").value("978-1"));
        mockMvc.perform(get("/api/books/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true));
        mockMvc.perform(put("/api/books/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookJson("The Hobbit: Revised", "J.R.R. Tolkien", "978-1", false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isbn").value("978-1"))
                .andExpect(jsonPath("$.available").value(false));
        mockMvc.perform(delete("/api/books/{id}", id)).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/books/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Book not found with id: " + id));
    }

    @Test
    void rejectsDuplicateIsbnOnCreateAndUpdate() throws Exception {
        long firstId = createBook("First", "Author One", "isbn-1");
        createBook("Second", "Author Two", "isbn-2");

        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookJson("Duplicate", "Author Three", "isbn-1", true)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("ISBN already exist"));

        mockMvc.perform(put("/api/books/{id}", firstId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookJson("First", "Author One", "isbn-2", true)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("ISBN already exist"));
    }

    @Test
    void reportsEveryMissingRequiredField() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookJson("  ", "", "  ", false)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.title").value("Title is required"))
                .andExpect(jsonPath("$.errors.author").value("Author is required"))
                .andExpect(jsonPath("$.errors.isbn").value("ISBN is required"))
                .andReturn();

        JsonNode error = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(error.get("message").asText())
                .contains("Title is required", "Author is required", "ISBN is required");
    }

    @Test
    void concurrentCreatesCannotSaveTheSameIsbn() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startTogether = new CountDownLatch(1);
        try {
            var createRequest = (java.util.concurrent.Callable<MvcResult>) () -> {
                startTogether.await();
                return mockMvc.perform(post("/api/books")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(bookJson("Concurrent book", "Library", "isbn-race", true)))
                        .andReturn();
            };
            Future<MvcResult> first = executor.submit(createRequest);
            Future<MvcResult> second = executor.submit(createRequest);
            startTogether.countDown();

            MvcResult firstResult = first.get();
            MvcResult secondResult = second.get();
            assertThat(new int[]{firstResult.getResponse().getStatus(), secondResult.getResponse().getStatus()})
                    .containsExactlyInAnyOrder(201, 409);

            MvcResult conflict = firstResult.getResponse().getStatus() == 409 ? firstResult : secondResult;
            assertThat(objectMapper.readTree(conflict.getResponse().getContentAsString())
                    .get("message").asText()).isEqualTo("ISBN already exist");
            assertThat(bookRepository.count()).isEqualTo(1);
        } finally {
            executor.shutdownNow();
        }
    }

    private long createBook(String title, String author, String isbn) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookJson(title, author, isbn, true)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private String bookJson(String title, String author, String isbn, boolean available) throws Exception {
        return objectMapper.writeValueAsString(new BookPayload(title, author, isbn, available));
    }

    private record BookPayload(String title, String author, String isbn, boolean available) {
    }
}
