import AdminHome from "./AdminHome.js"

import userHome from "./userHome.js"



export default {
  template: `<div>
  <AdminHome v-if="userRole === 'admin'" />
  <userHome v-if="userRole === 'user'" />
  
  </div>`,


  data() {
    return {
      userRole: localStorage.getItem('role'),
      authToken: localStorage.getItem('auth-token'),
      resources: [],
    }
  },

  components: {
    AdminHome,
    userHome,
    
  },
}