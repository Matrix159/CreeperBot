<template>
  <div id="app">
    <div class="nav">
      <h1 class="app-title">CreeperBot</h1>
      <a href="https://discord.com/api/oauth2/authorize?client_id=732331475990478870&redirect_uri=http%3A%2F%2Flocalhost%3A8080&response_type=code&scope=identify">
        Discord Login
      </a>
    </div>
    <router-view/>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import axios from 'axios';

@Component
export default class App extends Vue {
  async beforeCreate() {
    console.log(document.cookie);
    const code = this.$route.query.code;
    if (code) {
      try {
        await axios.post('http://localhost:3000/login', { code }, {
          withCredentials: true
        });
        console.log('Login hit');
        this.$router.replace('/');
      } catch (error) {
        console.error(error);
      }
    }
  }

  mounted() {
    console.log('app loaded');
  }
}
</script>
<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Bungee&display=swap');

html, body {
  min-height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #36393F;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  //-webkit-font-smoothing: antialiased;
  //-moz-osx-font-smoothing: grayscale;
  color: #e4e4e4;
  margin-bottom: 20px;
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
