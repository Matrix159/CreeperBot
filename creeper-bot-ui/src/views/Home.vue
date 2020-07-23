<template>
  <div class="home">
    <creeper-bot msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
// @ is an alias to /src
import CreeperBot from '@/components/CreeperBot.vue';

export default {
  name: 'Home',
  components: {
    CreeperBot
  }
};
</script>
