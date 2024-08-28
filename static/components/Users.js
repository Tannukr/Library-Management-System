export default {
  template: `
    <div>
      <div class="dashboard">
        <div class="info-box-container">
          <div class="info-box">
            <h3>Total Users</h3>
            <p>{{ info.total_users }}</p>
          </div>
          <div class="info-box">
            <h3>Total Sections</h3>
            <p>{{ info.total_sections }}</p>
          </div>
          <div class="info-box">
            <h3>Total Books</h3>
            <p>{{ info.total_books }}</p>
          </div>
          <!--<div class="info-box">
            <h3>Total Requested Books</h3>
            <p>{{ info.total_book_requests }}</p>
          </div>-->
        </div>
      </div>
      <div class="info-box"> Total Requested Book </div>
      <div class="table-container">
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
                  <button @click="approveRequest(request.b_id)" class="approve-btn">Approve</button>
                  <button @click="declineRequest(request.b_id)" class="decline-btn">Decline</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  data() {
    return {
      allUsers: [],
      token: localStorage.getItem('auth-token'),
      error: null,
      requests: [],
      info: {
        total_users: 0,
        total_sections: 0,
        total_books: 0,
        total_book_requests: 0,
      },
    };
  },
  async mounted() {
    this.fetchUsers();
    this.fetchInfo();
    this.fetchRequests();
  },
  methods: {
    async fetchUsers() {
      try {
        const res = await fetch('/users', {
          headers: {
            'Authentication-Token': this.token,
          },
        });

        if (!res.ok) {
          this.error = `Error ${res.status}`;
          return;
        }

        const data = await res.json();
        this.allUsers = data;
      } catch (error) {
        this.error = `Error fetching users: ${error.message}`;
      }
    },
    async fetchInfo() {
      try {
        const response = await fetch('/get_all_info', {
          method: "GET",
          headers: {
            'Authentication-Token': this.token
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch information');
        }

        const data = await response.json();
        console.log('Fetched data:', data);
        this.info = data;
      } catch (error) {
        console.error('Error fetching information:', error);
      }
    },
    async fetchRequests() {
      try {
        const res = await fetch('/api/book_request', {
          method: 'GET',
          headers: {
            'Authentication-Token': this.token,
          },
        });
        const data = await res.json();
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
        this.updateRequestStatus(b_id, true);
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
        this.updateRequestStatus(b_id, false);
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
  },
  style: `
  .dashboard {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f0f2f5;
    padding: 20px;
  }
  .info-box-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 800px;
    padding: 20px;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  .info-box {
    border: 1px solid #ddd;
    padding: 20px;
    border-radius: 8px;
    width: 100%;
    text-align: center;
    background-color: #f8f9fa;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .info-box h3 {
    margin: 0;
    font-size: 1.4em;
    color: #333;
  }
  .info-box p {
    margin: 10px 0 0;
    font-size: 1.8em;
    font-weight: bold;
    color: #007bff;
  }
  .table-container {
    margin: 20px auto;
    padding: 20px;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    width: 80%;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }
  th, td {
    padding: 12px 15px;
    border: 1px solid #ddd;
    text-align: left;
  }
  th {
    background-color: #f4f4f4;
    font-weight: bold;
  }
  .approve-btn {
    background-color: #28a745;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 4px;
    margin-right: 5px;
  }
  .decline-btn {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 4px;
  }
  .approve-btn:hover,
  .decline-btn:hover {
    opacity: 0.8;
  }
  `,
};
