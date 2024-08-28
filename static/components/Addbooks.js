export default {
  template: `
    <div class="center-container">
      <div class="add-books-form">
        <label for="bookName">Name</label>
        <input type="text" id="bookName" placeholder="Name" v-model="book.name" class="form-control" />

        <label for="bookContent">Content</label>
        <textarea id="bookContent" placeholder="Content" v-model="book.content" class="form-control"></textarea>

        <label for="bookAuthor">Author</label>
        <input type="text" id="bookAuthor" placeholder="Author" v-model="book.author" class="form-control" />
        <label for="bookUnit">Unit</label>
        <input type="number" id="bookUnit" placeholder="Unit" v-model="book.unit" class="form-control" />
        <label for="section">Section</label>
        <select id="section" v-model="book.section_id" class="form-control" required>
          <option disabled value="">Select Section</option>
          <option v-for="section in sections" :key="section.id" :value="section.id">{{ section.name }}</option>
         </select>

        <button @click="addBook" class="btn btn-success">Add Book</button>
      </div>
    </div>
  `,

  data() {
    return {
      book: {
        name: '',
        content: '',
        author: '',
        unit: 0,
        section_id: '',
      },
      sections: [],
      token: localStorage.getItem('auth-token'),
    };
  },

  methods: {
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

        this.sections = await res.json();
        console.log('Fetched sections:', this.sections); // Add logging for debugging
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    },

    async addBook() {
      console.log(this.book);
      try {
        const res = await fetch('/api/books', {
          method: 'POST',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.book),
        });

        if (!res.ok) {
          throw new Error('Failed to add book');
        }

        const data = await res.json();
        alert(data.message);
        this.$router.push('/'); // Assuming '/' is your home route
      } catch (error) {
        console.error('Error adding book:', error);
      }
    },
  },

  created() {
    this.fetchSections();

    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
      body {
        background-color: #f4f4f4;
      }
      .add-books-form {
        max-width: 400px;
        margin: auto;
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .form-control {
        width: 100%;
        margin-bottom: 10px;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      .btn-success {
        background-color: #28a745;
        border-color: #28a745;
        color: #fff;
        cursor: pointer;
        padding: 10px;
        border-radius: 4px;
      }
      .btn-success:hover {
        background-color: #218838;
        border-color: #1e7e34;
      }
    `;
    document.head.appendChild(style);
  }
};
