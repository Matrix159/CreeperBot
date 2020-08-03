<template>
  <div>
    <h1>Loggin you in...</h1>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import axios from 'axios';

@Component
export default class Login extends Vue {
  async mounted() {
    console.log(document.cookie);
    const code = this.$route.query.code;
    if (code) {
      try {
        await axios.post('http://localhost:3000/login', { code }, { withCredentials: true });
        console.log('Login hit');
        this.$store.commit('login');
        this.$router.replace('/');
      } catch (error) {
        console.error(error);
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h1 {
  text-align: center;
}
</style>
