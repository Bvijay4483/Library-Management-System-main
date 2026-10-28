import { useCallback, useEffect, useState } from "react";
import BookForm from "./components/BookForm";
import BookList from "./components/BookList";
import { bookService } from "./services/bookService";

export default function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [notice, setNotice] = useState("");
  const [formBook, setFormBook] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewBook, setViewBook] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const refreshBooks = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      setBooks(await bookService.getAll());
    } catch (error) {
      setListError(error.response?.data?.message || "Could not load books. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBooks();
  }, [refreshBooks]);

  function openNewForm() {
    setNotice("");
    setFormBook(null);
    setFormOpen(true);
  }

  function openEditForm(book) {
    setNotice("");
    setFormBook(book);
    setFormOpen(true);
  }

  async function saveBook(values) {
    if (formBook) {
      await bookService.update(formBook.id, values);
      setNotice("Book updated successfully.");
    } else {
      await bookService.create(values);
      setNotice("Book added successfully.");
    }
    setFormOpen(false);
    await refreshBooks();
  }

  async function deleteBook(book) {
    if (!window.confirm(`Delete "${book.title}" from the library?`)) return;
    setNotice("");
    try {
      await bookService.remove(book.id);
      setNotice("Book deleted successfully.");
      await refreshBooks();
    } catch (error) {
      setListError(error.response?.data?.message || "Could not delete this book. Please try again.");
    }
  }

  async function showBook(id) {
    setViewLoading(true);
    setViewBook(null);
    try {
      setViewBook(await bookService.getById(id));
    } catch (error) {
      setListError(error.response?.data?.message || "Could not load this book.");
    } finally {
      setViewLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="School Library home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>School Library</span>
        </a>
        <span className="topbar-note">A place for every story</span>
      </header>

      <section className="page-content">
        <div className="page-intro">
          <div>
            <p className="eyebrow">LIBRARY CATALOG</p>
            <h1>School Library<br className="mobile-break" /> Management System</h1>
            <p className="intro-copy">Keep your collection organized and ready for curious minds.</p>
          </div>
          <button className="button button-primary add-button" onClick={openNewForm} type="button">
            <span aria-hidden="true">+</span> Add book
          </button>
        </div>

        <div className="catalog-card">
          <div className="catalog-heading">
            <div>
              <h2>Books</h2>
              <p>{books.length} {books.length === 1 ? "book" : "books"} in the collection</p>
            </div>
            <span className="catalog-icon" aria-hidden="true">▤</span>
          </div>
          {notice && <div className="notice-success" role="status">{notice}</div>}
          {listError && <div className="notice-error" role="alert">{listError}</div>}
          {loading ? (
            <div className="loading-state"><span className="spinner" /> Loading books...</div>
          ) : listError ? (
            <div className="retry-row"><button className="text-button" onClick={refreshBooks} type="button">Try again</button></div>
          ) : (
            <BookList books={books} onView={showBook} onEdit={openEditForm} onDelete={deleteBook} />
          )}
        </div>
        <footer>Made for readers, learners, and lifelong curiosity.</footer>
      </section>

      {formOpen && <BookForm book={formBook} onSubmit={saveBook} onCancel={() => setFormOpen(false)} />}
      {(viewBook || viewLoading) && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setViewBook(null);
        }}>
          <section className="dialog details-dialog" role="dialog" aria-modal="true" aria-labelledby="book-details-title">
            {viewLoading ? (
              <div className="loading-state"><span className="spinner" /> Loading book details...</div>
            ) : (
              <>
                <div className="dialog-heading">
                  <div>
                    <p className="eyebrow">BOOK DETAILS · #{viewBook.id}</p>
                    <h2 id="book-details-title">{viewBook.title}</h2>
                  </div>
                  <button className="icon-button" onClick={() => setViewBook(null)} type="button" aria-label="Close details">×</button>
                </div>
                <dl className="detail-list">
                  <div><dt>Author</dt><dd>{viewBook.author}</dd></div>
                  <div><dt>ISBN</dt><dd>{viewBook.isbn}</dd></div>
                  <div><dt>Availability</dt><dd>{viewBook.available ? "Available" : "Not Available"}</dd></div>
                </dl>
                <button className="button button-secondary full-button" onClick={() => setViewBook(null)} type="button">Close</button>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
