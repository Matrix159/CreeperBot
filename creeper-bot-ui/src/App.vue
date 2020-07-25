<template>
  <div id="app">
    <h1 class="app-title">CreeperBot</h1>
    <router-view/>
  </div>
</template>

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
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #e4e4e4;
  margin-bottom: 20px;
}

.app-title {
  font-family: 'Bungee', cursive;
}
</style>
