<template>
  <div>
    <img v-bind:src="img" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

@Component
export default class CreeperBot extends Vue {
  @Prop() private msg!: string;
  img = '';

  mounted() {
    console.log('mounted');
    socket.on('message', (value: string) => {
      console.log(value);
      this.img = value;
    });
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

</style>
