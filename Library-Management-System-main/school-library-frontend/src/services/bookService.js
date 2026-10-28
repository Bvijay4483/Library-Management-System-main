import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8089/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const bookService = {
  getAll: async () => (await api.get("/books")).data,
  getById: async (id) => (await api.get(`/books/${id}`)).data,
  create: async (book) => (await api.post("/books", book)).data,
  update: async (id, book) => (await api.put(`/books/${id}`, book)).data,
  remove: async (id) => api.delete(`/books/${id}`),
};
