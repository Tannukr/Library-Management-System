import Home from './components/Home.js';
import Login from './components/login.js';
import Users from './components/Users.js';
import Addsection from './components/Addsection.js';
import Addbooks from './components/Addbooks.js';
import Bookrequest from './components/Bookrequest.js';
import Allbooks from './components/Allbooks.js'; // Corrected path

const routes = [
  { path: '/', component: Home, name: 'Home' },
  { path: '/Login', component: Login, name: 'Login' },
  { path: '/users', component: Users, name: 'Users' },
  { path: '/section', component: Addsection, name: 'Addsection' },
  { path: '/books', component: Addbooks, name: 'Addbooks' },
  { path: '/bookrequest', component: Bookrequest, name: 'Bookrequest' },
  { path: '/approved_books', component: Allbooks, name: 'Allbooks' },
];

export default new VueRouter({
  routes,
});
