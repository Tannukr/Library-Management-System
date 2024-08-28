export default {
  template: `
    <div class="approved-books-container">
      <h2 class="text-center mb-5">Approved Books</h2>
      <div class="book-list">
        <div class="card book-card" v-for="book in approvedBooks" :key="book.b_id">
          <div class="card-body">
            <h5 class="card-title">{{ book.book_name }}</h5>
            <h6 class="card-subtitle mb-2 text-muted">by {{ book.author }}</h6>
            <p class="card-text">{{ book.content }}</p>
            <!--<button class="btn btn-danger" @click="returnBook(book.b_id)">Return Book</button>-->
            <button class="btn btn-danger mt-2" @click="deleteBookRequest(book.b_id)">Return book</button>

            <div class="rating-form">
              <h2>Rate This Book:</h2>
              <label for="rating1"><input type="radio" name="rating" :id="'rating1-' + book.b_id" value="1" v-model="book.ratingValue"> 1</label>
              <label for="rating2"><input type="radio" name="rating" :id="'rating2-' + book.b_id" value="2" v-model="book.ratingValue"> 2</label>
              <label for="rating3"><input type="radio" name="rating" :id="'rating3-' + book.b_id" value="3" v-model="book.ratingValue"> 3</label>
              <label for="rating4"><input type="radio" name="rating" :id="'rating4-' + book.b_id" value="4" v-model="book.ratingValue"> 4</label>
              <label for="rating5"><input type="radio" name="rating" :id="'rating5-' + book.b_id" value="5" v-model="book.ratingValue"> 5</label>
              
              <button class="btn btn-primary mt-2" @click="rateBook(book.b_id)">Submit Rating</button>
              <div v-if="book.successMessage" class="alert alert-success mt-2">{{ book.successMessage }}</div>
              <div v-if="book.errorMessage" class="alert alert-danger mt-2">{{ book.errorMessage }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      approvedBooks: [],
      token: localStorage.getItem('auth-token'),
      userId: localStorage.getItem('user-id'),
    };
  },
  async mounted() {
    await this.fetchApprovedBooks();
  },
  methods: {
    async fetchApprovedBooks() {
      try {
        const response = await fetch(`/approved_books`, {
          method: 'GET',
          headers: {
            'Authentication-Token': this.token,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch approved books');
        }
        const data = await response.json();
        this.approvedBooks = data.map((book) => ({
          ...book,
          ratingValue: 0,
          successMessage: '',
          errorMessage: '',
        }));
      } catch (error) {
        console.error('Error fetching approved books:', error);
      }
    },
    async rateBook(bookId) {
      try {
        const response = await fetch(`/rating/${bookId}`, {
          method: 'POST',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rating: this.approvedBooks.find((book) => book.b_id === bookId).ratingValue,
          }),
        });

        if (!response.ok) {
          const errorMessage = await response.text();
          const book = this.approvedBooks.find((book) => book.b_id === bookId);
          book.errorMessage = `Failed to submit rating: ${errorMessage}`;
          book.successMessage = '';
          throw new Error(`Failed to submit rating: ${errorMessage}`);
        }

        const result = await response.json();
        const book = this.approvedBooks.find((book) => book.b_id === bookId);
        book.successMessage = result.message;
        book.errorMessage = '';
        alert(`Successfully rated the book: ${book.book_name}`);
        await this.fetchApprovedBooks(); // Optionally refresh the list of books
      } catch (error) {
        console.error('Error submitting rating:', error);
      }
    },
    async deleteBookRequest(bookId) {
      try {
        const response = await fetch(`/api/book_request/${bookId}`, {
          method: 'DELETE',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorMessage = await response.text();
          const book = this.approvedBooks.find((book) => book.b_id === bookId);
          book.errorMessage = `Failed to delete request: ${errorMessage}`;
          book.successMessage = '';
          throw new Error(`Failed to delete request: ${errorMessage}`);
        }

        const result = await response.json();
        const bookIndex = this.approvedBooks.findIndex((book) => book.b_id === bookId);
        if (bookIndex !== -1) {
          this.approvedBooks.splice(bookIndex, 1);
        }
        this.successMessage = result.message;
        this.errorMessage = '';
        
      } catch (error) {
        console.error('Error deleting book request:', error);
      }
    },
   
  },
  created() {
    let style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
      .approved-books-container {
        padding: 20px;
      }
      .text-center {
        text-align: center;
      }
      .book-list {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
      }
      .book-card {
        width: 18rem;
        margin: 10px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      .card-body {
        padding: 20px;
      }
      .card-title {
        font-size: 18px;
        font-weight: bold;
      }
      .card-subtitle {
        font-size: 14px;
      }
      .card-text {
        margin-top: 10px;
        font-size: 14px;
      }
      .btn-danger {
        margin-top: 10px;
      }
      .rating-form {
        margin-top: 10px;
      }
    `;
    document.head.appendChild(style);
  },
};

// async returnBook(bookId) {
//   console.log('Book ID:', bookId); // This should log the actual book ID
//   try {
//     const response = await fetch(`/return_book/${bookId}`, {
//       method: 'POST',
//       headers: {
//         'Authentication-Token': this.token,
//         'Content-Type': 'application/json',
//       }
//     });

//     if (!response.ok) {
//       const errorMessage = await response.text();
//       console.error('Failed to return book:', errorMessage);
//       throw new Error(errorMessage);
//     }

//     const result = await response.json();
//     console.log('Book returned successfully:', result.message);
//     await this.fetchApprovedBooks(); // Optionally refresh the list of books
//   } catch (error) {
//     console.error('Error returning book:', error);
//   }
// },

