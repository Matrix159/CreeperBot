import express from 'express';
import http from 'http';
import socketio from 'socket.io';

const httpServer = http.createServer(express());
export const io = socketio(httpServer);

export const setupHttpServer = (callback: () => void) => {
  httpServer.listen(3000, () => {
    console.log('listening on *:3000');
  });
  callback();
};

