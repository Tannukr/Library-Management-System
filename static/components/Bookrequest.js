export default {
  template: `
    <div>
      <table border="1">
        <thead>
          <tr>
            <th>Request Id</th>
            <th>Book Name</th>
            <th>Quantity</th>
            <th>Date Issued</th>
            <th>Return Date</th>
            <th>Status</th>
            <th>Actions</th>
            <th>Revoke Access</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="request in requests" :key="request.b_id">
            <td>{{ request.b_id }}</td>
            <td>{{ request.book_name }}</td>
            <td>{{ request.quantity }}</td>
            <td>{{ request.date_issued }}</td>
            <td>{{ request.return_date }}</td>
            <td>{{ request.is_approved === true ? 'Approved' : request.is_approved === false ? 'Declined' : 'Pending' }}</td>
            <td>
              <div v-if="request.is_approved === null">
                <button @click="approveRequest(request.b_id)">Approve</button>
                <button @click="declineRequest(request.b_id)">Decline</button>
              </div>
            </td>
            <td>
              <button @click="deleteBookRequest(book.b_id)">Revoke Access</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  data() {
    return {
      requests: [],
      token: localStorage.getItem('auth-token')
    };
  },
  methods: {
    async fetchRequests() {
      try {
        const res = await fetch('/api/book_request', {
          method: 'GET',
          headers: {
            'Authentication-Token': this.token,
          },
        });
        const data = await res.json();
        console.log("Fetched requests:", data);  // Debugging line
        this.requests = data;
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    },
    async approveRequest(b_id) {
      try {
        await fetch(`/api/book_request/${b_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': this.token,
          },
          body: JSON.stringify({ is_approved: true }),
        });
        this.updateRequestStatus(b_id, true); // Update the request status directly
      } catch (error) {
        console.error('Error approving request:', error);
      }
    },
    async declineRequest(b_id) {
      try {
        await fetch(`/api/book_request/${b_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': this.token,
          },
          body: JSON.stringify({ is_approved: false }),
        });
        this.updateRequestStatus(b_id, false); // Update the request status directly
      } catch (error) {
        console.error('Error declining request:', error);
      }
    },
    updateRequestStatus(b_id, is_approved) {
      const request = this.requests.find(request => request.b_id === b_id);
      if (request) {
        request.is_approved = is_approved;
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
    this.fetchRequests();
  }
};
