export default function BookList({ books, onView, onEdit, onDelete }) {
  if (books.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon" aria-hidden="true">B</div>
        <h2>Your shelves are waiting</h2>
        <p>Add the first book to start building your school library collection.</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Title</th>
            <th scope="col">Author</th>
            <th scope="col">ISBN</th>
            <th scope="col">Available</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id}>
              <td className="id-cell">{book.id}</td>
              <td className="title-cell">{book.title}</td>
              <td>{book.author}</td>
              <td className="isbn-cell">{book.isbn}</td>
              <td>
                <span className={`availability ${book.available ? "is-available" : "is-unavailable"}`}>
                  <span className="availability-dot" aria-hidden="true" />
                  {book.available ? "Available" : "Not Available"}
                </span>
              </td>
              <td>
                <div className="row-actions">
                  <button className="text-button" onClick={() => onView(book.id)} type="button">View</button>
                  <button className="text-button" onClick={() => onEdit(book)} type="button">Edit</button>
                  <button className="text-button danger-text" onClick={() => onDelete(book)} type="button">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
