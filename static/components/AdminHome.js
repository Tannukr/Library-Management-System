export default {
  template: `
    <div class="admin-dashboard">
      <h1 class="admin-title">Admin Dashboard</h1>
      <button @click="downloadData" class="btn btn-download">Download Data</button>
      <span v-if="isWaiting" class="waiting-message">Waiting....</span>
      <!-- Sections Display -->
      <div v-if="sections.length">
        <h2>Sections</h2>
        <div class="section-cards">
          <div class="table-responsive">
            <table class="table table-bordered table-hover">
              <thead class="table-dark">
                <tr>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Date Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="section in sections" :key="section.id">
                  <td>{{ section.name }}</td>
                  <td>{{ section.id }}</td>
                  <td>{{ section.description }}</td>
                  <td>{{ formatDate(section.date_created) }}</td>
                  <td>
                    <button class="btn btn-primary btn-sm" @click="startEditSection(section)">Edit</button>
                    <button class="btn btn-danger btn-sm" @click="deleteSection(section.id)">Delete</button>
                    <button class="btn btn-info btn-sm" @click="fetchBooks(section.id)">Show Books</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div v-else>
        <p>No sections found.</p>
      </div>

      <!-- Edit Section Form -->
      <div v-if="editingSection.id" class="edit-section">
        <h2>Edit Section</h2>
        <form @submit.prevent="submitEditSection" class="edit-form">
          <div class="form-group">
            <label for="name">Name:</label>
            <input type="text" v-model="editingSection.name" id="name" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="description">Description:</label>
            <textarea v-model="editingSection.description" id="description" class="form-control" required></textarea>
          </div>
          <div class="form-group">
            <label for="date_created">Date Created:</label>
            <input type="date" v-model="editingSection.date_created" id="date_created" class="form-control" required />
          </div>
          <button type="submit" class="btn btn-success">Save</button>
          <button type="button" class="btn btn-secondary" @click="cancelEditSection">Cancel</button>
        </form>
      </div>

      <!-- Books Display -->
      <div v-if="selectedBooks.length" class="books-list mt-4">
        <h2>Books in Section: {{ selectedSection.name }}</h2>
        <div class="table-responsive">
          <table class="table table-bordered table-striped" style="background-color: rgba(255, 255, 255, 0.8);">
            <thead class="table-dark">
              <tr>
                <th>Name</th>
                <th>Author</th>
                <th>Content</th>
                <th>Unit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="book in selectedBooks" :key="book.book_id">
                <td>{{ book.name }}</td>
                <td>{{ book.author }}</td>
                <td>{{ book.content }}</td>
                <td>{{ book.unit }}</td>
                <td>
                  <button @click="openUpdateBookModal(book)" class="btn btn-sm btn-primary">Edit</button>
                  <button @click="deleteBook(book.book_id)" class="btn btn-sm btn-danger">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Edit Book Form -->
      <div v-if="editingBook.book_id" class="edit-book">
        <h2>Edit Book</h2>
        <form @submit.prevent="updateBook" class="edit-form">
          <div class="form-group">
            <label for="book-name">Name:</label>
            <input type="text" v-model="editingBook.name" id="book-name" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="book-author">Author:</label>
            <input type="text" v-model="editingBook.author" id="book-author" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="book-content">Content:</label>
            <textarea v-model="editingBook.content" id="book-content" class="form-control" required></textarea>
          </div>
          <div class="form-group">
            <label for="unit">Unit</label>
            <input type="number" class="form-control" v-model="editingBook.unit"  id="book-content" required>
          </div>
          <div class="form-group">
            <label for="section">Section</label>
            <select class="form-control" v-model="editingBook.section_id" id="section" required>
              <option v-for="section in sections" :key="section.id" :value="section.id">{{ section.name }}</option>
            </select>
          </div>
          <button type="submit" class="btn btn-success">Save</button>
          <button type="button" class="btn btn-secondary" @click="cancelEditBook">Cancel</button>
        </form>
      </div>
    </div>
  `,

  data() {
    return {
      isWaiting: false,
      sections: [],
      selectedSection: null,
      selectedBooks: [],
      token: localStorage.getItem('auth-token'),
      editingSection: {
        id: null,
        name: "",
        description: "",
        date_created: "",
      },
      editingBook: {
        book_id: null,
        name: "",
        content: "",
        author: "",
        unit: 0,
        section_id: null,
      },
      message: "",
    };
  },

  methods: {
    async downloadData() {
      this.isWaiting = true
      const res = await fetch('/download-csv')
      const data = await res.json()
      if (res.ok) {
        const taskId = data['task-id']
        const intv = setInterval(async () => {
          const csv_res = await fetch(`/get-csv/${taskId}`)
          if (csv_res.ok) {
            this.isWaiting = false
            clearInterval(intv)
            window.location.href = `/get-csv/${taskId}`
          }
        }, 1000)
      }

    },
    async fetchSections() {
      try {
        const res = await fetch('/get/section', {
          method: 'GET',
          headers: {
            'Authentication-Token': this.token,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch sections');
        }

        const data = await res.json();
        this.sections = data;
      } catch (error) {
        this.message = error.message;
        console.error('Error fetching sections:', error);
      }
    },

    startEditSection(section) {
      this.editingSection = { ...section };
    },

    cancelEditSection() {
      this.editingSection = {
        id: null,
        name: "",
        description: "",
        date_created: "",
      };
    },

    async submitEditSection() {
      try {
        const res = await fetch(`/api/section/${this.editingSection.id}`, {
          method: 'PUT',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.editingSection),
        });

        if (!res.ok) {
          throw new Error('Failed to update section');
        }

        const data = await res.json();
        this.message = data.message;
        this.cancelEditSection();
        this.fetchSections();
      } catch (error) {
        this.message = error.message;
        console.error('Error updating section:', error);
      }
    },

    async deleteSection(sectionId) {
      if (!confirm('Are you sure you want to delete this section?')) {
        return;
      }

      try {
        const res = await fetch(`/api/section/${sectionId}`, {
          method: 'DELETE',
          headers: {
            'Authentication-Token': this.token,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to delete section');
        }

        const data = await res.json();
        this.message = data.message;
        this.fetchSections();
      } catch (error) {
        this.message = error.message;
        console.error('Error deleting section:', error);
      }
    },

    async fetchBooks(sectionId) {
      try {
        const res = await fetch(`/api/books?section_id=${sectionId}`, {
          method: 'GET',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          this.selectedBooks = data;
          this.selectedSection = this.sections.find(section => section.id === sectionId);
        } else {
          console.error('Error fetching books:', res.status, res.statusText);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    },

    openUpdateBookModal(book) {
      this.editingBook = { ...book };
    },

    cancelEditBook() {
      this.editingBook = {
        book_id: null,
        name: "",
        content: "",
        author: "",
        unit: 0,
        section_id: null,
      };
    },

    async updateBook() {
      try {
        const res = await fetch(`/api/books/${this.editingBook.book_id}`, {
          method: 'PUT',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.editingBook),
        });

        if (res.ok) {
          const data = await res.json();
          this.message = data.message;
          const index = this.selectedBooks.findIndex(book => book.book_id === this.editingBook.book_id);
          if (index !== -1) {
            this.$set(this.selectedBooks, index, { ...this.editingBook });
          }
          this.cancelEditBook();
        } else {
          console.error('Error updating book:', res.status, res.statusText);
        }
      } catch (error) {
        console.error('Error updating book:', error);
      }
    },

    async deleteBook(bookId) {
      if (!confirm('Are you sure you want to delete this book?')) {
        return;
      }

      try {
        const res = await fetch(`/api/books/${bookId}`, {
          method: 'DELETE',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          this.message = data.message;
          const index = this.selectedBooks.findIndex(book => book.book_id === bookId);
          if (index !== -1) {
            this.selectedBooks.splice(index, 1);
          }
        } else {
          console.error('Error deleting book:', res.status, res.statusText);
        }
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },
  },

  created() {
    this.fetchSections();

    // Add custom styles
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
      html, body {
        background-size: cover;
        background-position: center;
        background-color: #F5FFFA; /* Adjusted text color for readability */
      }
      .admin-dashboard {
        height: 100%;
        width: 100%;
        padding: 20px;
      }
      .admin-title {
        text-align: center;
        margin-bottom: 20px;
        color: #fff;
        text-shadow: 2px 2px 4px #000;
      }
      .section-cards {
        background-color: rgba(255, 255, 255, 0.8);
        padding: 20px;
        border-radius: 10px;
      }
      .table-responsive {
        width: 100%;
        overflow-x: auto;
      }
      .books-list {
        margin-top: 30px;
        padding: 20px;
        border-radius: 10px;
      }
      .book-card {
        margin-bottom: 20px;
      }
      .edit-section, .edit-book {
        margin-top: 30px;
        background-color: rgba(255, 255, 255, 0.8);
        padding: 20px;
        border-radius: 10px;
      }
      .edit-form {
        max-width: 400px;
        margin: 0 auto;
      }
      .form-group label {
        color: #000;
      }
      .form-control {
        border-radius: 5px;
      }
      .btn-download {
      background-color: #007bff; /* Primary button color */
      color: #fff;
      border-color: #007bff;
      border-radius: 5px;
      padding: 10px 20px;
      font-size: 16px;
      transition: background-color 0.3s, border-color 0.3s;
    }

    .btn-download:hover {
      background-color: #0056b3; /* Darker shade on hover */
      border-color: #004085;
    }

    .btn-download:focus, .btn-download:active {
      outline: none;
      box-shadow: none;
    }

    /* Style for Waiting message */
    .waiting-message {
      color: #007bff; /* Color to match the button */
      font-size: 16px;
      font-weight: bold;
      margin-left: 10px;
      display: inline;
    }
    `;
    document.head.appendChild(style);
  },
};
