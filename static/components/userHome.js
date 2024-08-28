export default {
  template: `
  <div>
    <!-- Search bar -->
    <h5>
      <div class="search-bar">
        <label for="searchInput" class="sr-only">Search</label>
        <i class="fa fa-search" aria-hidden="true"></i>
        <input v-model="searchQuery" id="searchInput" placeholder="Search section and books" />
        <button @click="search" class="btn btn-sm btn-dark">Search</button>
      </div>
    </h5>
    <div v-if="searchClicked" class="search-results">
      <div v-if="searchResults.length > 0">
        <h3>Search Results</h3>
        <div v-for="result in searchResults" :key="result.id" class="search-result">
          <template v-if="result.type === 'section'">
            <!-- Display section information -->
            <h3>{{ result.name }}</h3>
            <p>{{ result.description }}</p>
          </template>
          <template v-else-if="result.type === 'book'">
            <h4>{{ result.name }}</h4>
            <p>Author: {{ result.author }}</p>
            <p>
              <template v-if="result.unit > 0">
                <button @click="openAddToReadModal(result)" class="btn btn-sm btn-success">Request</button>
              </template>
              <template v-else>
                <span class="text-danger">Out of Stock</span>
              </template>
            </p>
          </template>
        </div>
      </div>
      <div v-else>
        <p>No results found.</p>
      </div>
    </div>
    <br>
    <!-- Loop through sections and display books -->
    <div v-for="section in sections" :key="section.id" class="section-container">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2 class="section-title">{{ section.name }} - {{ section.description }}</h2>
      </div>
      <div class="books-container">
        <div v-if="section.books && section.books.length" class="books-grid">
          <div class="book-card" v-for="book in section.books" :key="book.id">
            <div class="book-info">
              <h5 class="book-name">{{ book.name }}</h5>
              <p class="book-author">Author: {{ book.author }}</p>
              <!--<p class="card-text">Average Rating: {{ book.average_rating }}</p>-->
              <p>
                <template v-if="book.unit > 0">
                  <button @click="openAddToReadModal(book)" class="btn btn-sm btn-success">Request</button>
                </template>
                <template v-else>
                  <span class="text-danger">Out of Stock</span>
                </template>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Add to Read Modal -->
    <div class="modal fade" id="addtoreadModal" tabindex="-1" role="dialog" aria-labelledby="addtoreadModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="addtoreadModalLabel">Add to Read Books</h5>
            <button type="button" class="close" aria-label="Close" @click="closeAddToReadModal">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="addBook">
              <div class="form-group">
                <label for="bookQuantity">Quantity</label>
                <input type="number" class="form-control" v-model="quantity" id="bookQuantity" min="1" required>
                <label for="dateIssue">Date Issue</label>
                <input type="date" class="form-control" v-model="date_issue" id="dateIssue" required>
                <label for="dateReturn">Date Return</label>
                <input type="date" class="form-control" v-model="date_return" id="dateReturn" required>
              </div>
              <button type="submit" class="btn btn-primary">Add To Read</button>
            </form>
            <p v-if="isRequestLimitReached" class="limit-message">You have reached the maximum limit of 5 book requests.</p>
            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  data() {
    return {
      token: localStorage.getItem('auth-token'),
      quantity: 1,
      sections: [],
      searchQuery: '',
      searchResults: [],
      searchClicked: false,
      date_issue: '',
      date_return: '',
      selectedBook: null,
      isRequestLimitReached: false,
      errorMessage: ''
    };
  },
  methods: {
    async search() {
      this.searchClicked = true;
      if (this.searchQuery.trim() !== '') {
        try {
          const response = await fetch(`/api/search?query=${this.searchQuery.trim()}`, {
            method: 'GET',
            headers: {
              'Authentication-Token': this.token,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            this.searchResults = data;
          } else {
            console.error('Error fetching search results:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Fetch error:', error);
        }
      } else {
        this.searchResults = [];
      }
    },

    async fetchSections() {
      try {
        const response = await fetch('/get/section', {
          method: 'GET',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          this.sections = await response.json();
          this.fetchBooksForSections();
        } else {
          console.error("Error fetching sections:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    },

    async fetchBooksForSections() {
      try {
        for (const section of this.sections) {
          const bookRes = await fetch(`/api/books?section_id=${section.id}`, {
            method: 'GET',
            headers: {
              'Authentication-Token': this.token,
              'Content-Type': 'application/json',
            },
          });

          if (bookRes.ok) {
            const books = await bookRes.json();
            this.$set(section, 'books', books);
          } else {
            console.error('Error fetching books:', bookRes.status, bookRes.statusText);
          }
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    },

    openAddToReadModal(book) {
      this.selectedBook = book;
      this.isRequestLimitReached = false;
      this.errorMessage = '';
      $('#addtoreadModal').modal('show');
    },

    closeAddToReadModal() {
      this.selectedBook = null;
      this.quantity = 1;
      this.date_issue = '';
      this.date_return = '';
      $('#addtoreadModal').modal('hide');
    },

    async addBook() {
      if (this.selectedBook) {
        try {
          const response = await fetch('/api/book_request', {
            method: 'POST',
            headers: {
              'Authentication-Token': this.token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              book_name: this.selectedBook.name,
              quantity: this.quantity,
              date_issued: this.date_issue,
              return_date: this.date_return,
            }),
          });

          if (response.status === 403) {
            this.isRequestLimitReached = true; // Show message if limit is reached
          } else if (response.ok) {
            alert('Book added to read successfully!');
            this.closeAddToReadModal();
            // Optionally refresh the sections and books to reflect the updated stock
            this.fetchSections();
          } else {
            const errorData = await response.json();
            this.errorMessage = errorData.message || 'An error occurred while submitting your request.';
          }
        } catch (error) {
          console.error('Fetch error:', error);
        }
      }
    }
  },
  created() {
    let style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
      body {
        background-image: url('/static/book.jpg');
        background-size: cover;
        background-position: center;
        color: #333; /* Adjusted text color for readability */
      }
  
      .section-container {
        margin-bottom: 30px;
        background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
        padding: 20px;
        border-radius: 10px;
      }
  
      .section-title {
        font-size: 24px;
        margin: 0;
        color: #fff; /* White color for section title */
      }
  
      .books-container {
        margin-top: 20px;
      }
  
      .books-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 10px; /* Reduced gap between cards */
        justify-content: space-between;
      }
  
      .book-card {
        width: calc(25% - 10px); /* Adjusted to fit 4 cards per row with reduced gap */
        background-color: rgba(255, 255, 255, 0.9); /* Light background color for cards */
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        padding: 8px; /* Further reduced padding for a more compact look */
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        height: 160px; /* Reduced height for smaller cards */
      }
  
      .book-info {
        flex: 1; /* Ensures the info section takes up available space */
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
  
      .book-name {
        font-size: 14px; /* Smaller font size for book name */
        font-weight: bold;
        margin-bottom: 4px; /* Reduced margin for tighter spacing */
      }
  
      .book-author {
        font-size: 12px; /* Smaller font size for author */
        margin-bottom: 4px; /* Reduced margin to decrease space between author and button */
      }
  
      .book-card button {
        margin-top: auto; /* Pushes the button to the bottom of the card */
        align-self: flex-start; /* Aligns button to the start (left) */
      }
  
      .search-bar {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
      }
  
      .search-bar input {
        margin-left: 10px;
        padding: 5px;
        border-radius: 4px;
        border: 1px solid #ccc;
        width: 200px; /* Fixed width for search input */
      }
  
      .search-results {
        margin-top: 20px;
      }
  
      .limit-message, .error-message {
        color: red;
      }
    `;
    document.head.appendChild(style);
  
    this.fetchSections();
  }
}  