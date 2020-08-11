<template>
  <div class="container">
    <div v-if="code.length === 0" class="sub-container">
      <p>Login to discord to use CreeperBot</p>
      <a :href="discordLoginURL">Login</a>
    </div>
    <h1 v-else>Loggin you in...</h1>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import axios from 'axios';

@Component
export default class Login extends Vue {
  code = '';
  discordLoginURL = '';
  beforeMount() {
    this.code = this.$route.query.code as string || '';
    this.discordLoginURL = process.env.VUE_APP_DISCORD_LOGIN_URL;
  }

  mounted() {
    console.log(document.cookie);
    if (this.code) {
      axios.post(`http://${process.env.VUE_APP_SOCKET_DOMAIN}/login`, { code: this.code }, { withCredentials: true }).then(() => {
        console.log('Login hit');
        this.$store.commit('login');
        this.$router.replace('/bot');
      }).catch(error => console.error(error));
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;

  .sub-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #000000ab;
    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.6);
    border-radius: 6px;
    width: 25%;
    height: 40%;

    a {
      background: #386138;
      color: white;
      padding: 8px 16px;
      text-decoration: none;
      border-radius: 6px;

      &:hover {
        transform: scale(1.05);
      }
    }
  }
}
h1 {
  text-align: center;
}
</style>
