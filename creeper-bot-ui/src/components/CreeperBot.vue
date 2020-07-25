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
      <h3>Members in voice chat</h3>
      <div v-for="(user, index) in info.users" :key="index" class="user">
        <img v-bind:src="user.avatarURL" />
        <p>{{user.username}}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import io from 'socket.io-client';
import { User, CreeperInfo } from '../models/models';

const socket = io(process.env.VUE_APP_SOCKET_DOMAIN);

@Component
export default class CreeperBot extends Vue {
  @Prop() private msg!: string;
  img = '';
  totalOnline = 0;
  users: User[] = [];
  info: CreeperInfo = {
    users: [],
    totalOnline: 0,
    messages: []
  };

  mounted() {
    console.log('mounted');
    socket.on('message', (info: CreeperInfo) => {
      console.log(info);
      this.info = info;
      this.users = info.users;
      this.totalOnline = info.totalOnline;
    });
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.creeper-bot {
  display: grid;
  grid-template-columns: 1fr minmax(min-content, 400px);
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
  }
  .user {
    display: flex;
    margin: 10px 0;
    img {
      width: 60px;
      height: 60px;
      border-radius: 50%;
    }

    p {
      margin: 0 0 0 6px;
      align-self: center;
    }
  }
}
</style>
