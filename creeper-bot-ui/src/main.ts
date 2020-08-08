import Vue from 'vue';
import Vuex from 'vuex';
import App from './App.vue';
import router from './router';

Vue.config.productionTip = false;

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    count: 0,
    loggedIn: false
  },
  mutations: {
    increment (state) {
      state.count++;
    },
    login (state) {
      state.loggedIn = true;
    },
    logout(state) {
      state.loggedIn = false;
    }
  }
});

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');
