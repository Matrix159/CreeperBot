<template>
  <div id="app">
    <div v-if="loggedIn" class="nav">
      <h1 class="app-title">CreeperBot</h1>
      <a v-if="loggedIn" href="javascript:void(0)" @click="logout($event)">Logout</a>
    </div>
    <router-view/>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class App extends Vue {
  get loggedIn() {
    console.log(this.$store.state.loggedIn);
    return this.$store.state.loggedIn;
  }

  beforeMount() {
    // this.$store.commit('login');
    const loggedIn = document.cookie.split('; ').find(row => row.startsWith('sessionID'));
    if (loggedIn) {
      // Tell the vuex store that we are logged in
      console.log('we are logged in');
      this.$store.commit('login');
    }
  }

  mounted() {
    console.log('app loaded');
  }

  logout(event: Event) {
    event.preventDefault();
    document.cookie = 'sessionID=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    this.$store.commit('logout');
    this.$router.push('/login');
  }
}
</script>
<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Bungee&display=swap');

html, body {
  min-height: 100%;
  margin: 0;
  padding: 0;
  background-color: #36393F;
}
#app {
  height: 100vh;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  //-webkit-font-smoothing: antialiased;
  //-moz-osx-font-smoothing: grayscale;
  color: #e4e4e4;
}
.nav {
  display: grid;
  grid-template-columns: 1fr min-content 1fr;
  grid-template-rows: 1fr;
  align-items: center;
  background-color: #000000ab;
  .app-title {
    grid-column: 2;
    font-family: 'Bungee';
    text-align: center;
  }
  a {
    grid-column: 3;
    margin-left: 10px;
    color: #56ca6a;
  }
}

</style>
