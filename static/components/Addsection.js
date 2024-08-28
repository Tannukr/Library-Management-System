export default {
  template: `
    <div class="center-container">
      <div class="add-section-form">
        <label for="name">Name</label>
        <input type="text" id="name" placeholder="Name" v-model="resource.name" class="form-control" />

        <label for="description">Description</label>
        <input type="text" id="description" placeholder="Description" v-model="resource.description" class="form-control" />

        <label for="date_created">Date Created</label>
        <input type="date" id="date_created" placeholder="Date Created" v-model="resource.date_created" class="form-control" />

        <button @click="addSection" class="btn btn-success">Add Section</button>
      </div>
    </div>`,

  data() {
    return {
      resource: {
        name: null,
        description: null,
        date_created: null,
      },
      token: localStorage.getItem('auth-token'),
    };
  },

  methods: {
    async addSection() {
      try {
        const res = await fetch('/api/section', {
          method: 'POST',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.resource),
        });

        if (!res.ok) {
          const data = await res.json(); // Attempt to parse JSON error response
          throw new Error(data.message || 'Failed to add section');
        }

        const data = await res.json();
        alert(data.message);
        this.$router.push("/"); // Assuming '/' is your home route
      } catch (error) {
        console.error('Error adding section:', error);
        alert(error.message || 'Failed to add section'); // Show error message to user
      }
    },
  },

  created() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
      body {
        background-color: #f4f4f4;
      }
      .add-section-form {
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
  },
};
