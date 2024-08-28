export default {
  template: `
    <div>
      <nav v-if="showNavbar" class="navbar navbar-expand-lg">
        <div class="container-fluid">
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <ul class="nav-item text-end" v-if="is_login">
            <h3 class="welcome-message">Welcome Home</h3>
          </ul>
          <div class="collapse navbar-collapse justify-content-end" id="navbarNav">
            <ul class="navbar-nav">
              <li class="nav-item" v-if="is_login">
                <router-link class="nav-link active" aria-current="page" to="/">Home</router-link>
              </li>
              <li class="nav-item" v-if="role === 'admin'">
                <router-link class="nav-link" to="/users">Users</router-link>
              </li>
              <li class="nav-item" v-if="role === 'admin'">
                <router-link class="nav-link" to="/section">Add Section</router-link>
              </li>
              <!--<li class="nav-item" v-if="role === 'admin'">
                <router-link class="nav-link" to="/get_all_info">Stats</router-link>
              </li>-->
              <li class="nav-item" v-if="role === 'admin'">
                <router-link class="nav-link" to="/books">Add Books</router-link>
              </li>
               <!--<li class="nav-item" v-if="role === 'admin'">
                <router-link class="nav-link" to="/bookrequest">Bookrequest</router-link>
              </li>-->
              </li>
               <li class="nav-item" v-if="role === 'user'">
                <router-link class="nav-link" to="/approved_books">Profile</router-link>
              </li>
              <li class="nav-item" v-if="is_login">
                <button class="nav-link btn btn-link" @click="logout">Logout</button>
              </li>
             
            </ul>
          </div>
        </div>
      </nav>
    </div>
  `,
  data() {
    return {
      role: localStorage.getItem('role'),
      is_login: !!localStorage.getItem('auth-token'), // !! to convert to boolean
    }
  },
  computed: {
    showNavbar() {
      const currentRoute = this.$route.path;
      return currentRoute !== '/login' && currentRoute !== '/register';
    }
  },
  methods: {
    logout() {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('role');
      this.$router.push('/login');
    }
  },
  created() {
    let style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
      .navbar {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 10px;
        background-color: #20B2AA; /* Change this color to your desired background color */
      }
      .navbar-nav .nav-link {
        font-weight: bold;
      }
      .navbar-nav .btn-link {
        color: #000;
        text-decoration: none;
      }
      .navbar-nav .btn-link:hover {
        text-decoration: underline;
      }
      .welcome-message {
        text-align: center;
        font-weight: bold;
        margin-top: 4%;
      }
    `;
    document.head.appendChild(style);
  }
};
