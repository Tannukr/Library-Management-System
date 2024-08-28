export default {
  template: `
  <div class="login-page">
    <h2 class="library-title">Library Management Application</h2>
    <div v-if="!registrationType">
      <div class="d-flex justify-content-center mt-5">
        <div class="card login-card" style="width: 20rem; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <div class="card-body">
            <h3 class="card-title text-center mb-4">Login</h3>
            <div class="text-danger text-center">{{ error }}</div>
            <form @submit.prevent="login">
              <div class="mb-3">
                <label for="user-email" class="form-label">Email address</label>
                <input type="email" class="form-control" id="user-email" placeholder="name@example.com" v-model="cred.email">
              </div>
              <div class="mb-3">
                <label for="user-password" class="form-label">Password</label>
                <input type="password" class="form-control" id="user-password" v-model="cred.password">
              </div>
              <button type="submit" class="btn btn-success mt-3">Login</button>
              <div class="d-flex justify-content-center mt-3">
                <button type="button" class="btn btn-link me-2" @click="setRegistrationType('user')">Register as User</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Show user registration form -->
    <div v-if="registrationType === 'user'">
      <div class="d-flex justify-content-center mt-5">
        <div class="card registration-card" style="width: 20rem; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <div class="card-body">
            <h5 class="card-title text-center mb-4">Register as User</h5>
            <div class="text-danger text-center">{{ error }}</div>
            <form @submit.prevent="registerUser">
              <div class="mb-3">
                <label for="new-user-name" class="form-label">Name</label>
                <input type="text" class="form-control" id="new-user-name" v-model="newUser.name">
              </div>
              <div class="mb-3">
                <label for="new-user-email" class="form-label">Email address</label>
                <input type="email" class="form-control" id="new-user-email" placeholder="name@example.com" v-model="newUser.email">
              </div>
              <div class="mb-3">
                <label for="new-user-password" class="form-label">Password</label>
                <input type="password" class="form-control" id="new-user-password" v-model="newUser.password">
              </div>
              <button type="submit" class="btn btn-success mt-3">Register</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  data() {
    return {
      cred: {
        email: null,
        password: null,
      },
      newUser: {
        name: '',
        email: '',
        password: '',
      },
      error: null,
      registrationType: null,
    };
  },
  methods: {
    async login() {
      try {
        const res = await fetch('/user-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.cred),
        });
        if (!res.ok) {
          const errorText = await res.text();
          this.error = `Error: ${res.status} - ${errorText}`;
          console.error('Login Error:', errorText);
          return;
        }
        const data = await res.json();
        localStorage.setItem('auth-token', data.token);
        localStorage.setItem('role', data.role);
        this.$router.push({ path: '/' });
      } catch (error) {
        console.error('Error during login:', error);
        this.error = 'An unexpected error occurred during login.';
      }
    },
    async registerUser() {
      try {
        const res = await fetch('/api/user-registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.newUser),
        });
        if (!res.ok) {
          const errorText = await res.text();
          this.error = `Error: ${res.status} - ${errorText}`;
          console.error('Registration Error:', errorText);
          return;
        }
        const data = await res.json();
        console.log('User registered successfully:', data);
        this.error = 'User registered successfully. Please login.';
        setTimeout(() => {
          this.error = null;
          this.registrationType = null;
        }, 3000);
      } catch (error) {
        console.error('Error during registration:', error);
        this.error = 'An unexpected error occurred during registration.';
      }
    },
    setRegistrationType(type) {
      this.registrationType = type;
      this.error = null;
    },
  },
  created() {
    let style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
      body {
        background-color: #20B2AA;
      }
      .library-title {
        color: white;
        text-align: center;
        margin-top: 20px;
      }
      .login-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100vh;
      }
      .login-card, .registration-card {
        background-color: rgba(255, 255, 255, 0.9);
        padding: 20px;
        border-radius: 10px;
      }
      .card-title {
        font-size: 24px;
        font-weight: bold;
      }
      .btn-link {
        font-size: 14px;
        color: #007bff;
        text-decoration: underline;
      }
      .btn-link:hover {
        text-decoration: none;
        color: #0056b3;
      }
    `;
    document.head.appendChild(style);
  },
};
