<template>
  <div class="creeper-bot">
    <div class="left-info">
      <h3>There are {{info.totalOnline}} members online right now.</h3>
      <ul>
        <li v-for="(message, index) in info.messages" :key="index">
          {{message}}
        </li>
      </ul>
    </div>
    <div v-if="info.users.length > 0" class="users">
      <h3>Voice chat lurkers</h3>
      <div v-for="(user, index) in info.users" :key="index" @click="watchUser(user.snowflake)" class="user">
        <img v-bind:src="user.avatarURL" />
        <p>{{user.username}}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import io from 'socket.io-client';
import { CreeperInfo } from '../models/models';

@Component
export default class CreeperBot extends Vue {
  socket?: SocketIOClient.Socket;
  info: CreeperInfo = {
    users: [],
    totalOnline: 0,
    messages: []
  };

  mounted() {
    this.socket = io(process.env.VUE_APP_SOCKET_DOMAIN);
    console.log(this.socket);
    console.log('mounted');
    this.socket.on('message', (info: CreeperInfo) => {
      console.log(info);
      this.info = info;
    });
  }

  watchUser(snowflake: string) {
    console.log('watch user clicked');
    this.socket!.emit('watch', snowflake);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.creeper-bot {
  display: grid;
  grid-template-columns: 2fr minmax(min-content, 1fr);
  @media only screen and (min-width: 1000px){
    grid-template-columns: 3fr minmax(min-content, 1fr);
  }
  grid-template-rows: 1fr;
  grid-template-areas: "main users";
  margin: 0 20px;
  .left-info {
    grid-area: main;
  }
  .users {
    grid-area: users;
    height: auto;
    border: 1px #b5b5d6 solid;
    background-color: #36393F;
    border-radius: 6px;
    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.6);
    padding: 8px;
    margin-top: 16px;

    h3 {
      margin: 4px 0 12px 0;
      text-align: center;
    }
  }
  .user {
    display: flex;
    margin: 10px 0;
    &:last-of-type {
      margin-bottom: 0;
    }
    img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
    p {
      margin: 0 0 0 6px;
      align-self: center;
    }
  }
}
</style>
