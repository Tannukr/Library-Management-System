import router from './router.js';
import Navbar from './components/Navbar.js';

router.beforeEach((to, from, next) => {
  if (to.name !== 'Login' && !localStorage.getItem('auth-token')) {
    next({ name: 'Login' });
  } else {
    next();
  }
});

new Vue({
  el: '#app',
  template: `
    <div>
      <Navbar :key="has_changed" />
      <router-view class="m-3" />
    </div>
  `,
  router,
  components: {
    Navbar,
  },
  data() {
    return {
      has_changed: true,
    };
  },
  watch: {
    $route(to, from) {
      this.has_changed = !this.has_changed;
    },
  },
});
