import Fastify from "fastify";
import FastifyWebsocket from "fastify-websocket";
import {WebSocket} from 'ws';
import {generateAuthUrl, handleGoogleCallback} from "./google-api";

const fastify = Fastify({ logger: true });
fastify.register(FastifyWebsocket)

fastify.post('/request-print', async (request, reply) => {
    sockets.forEach((socket) => socket.send(JSON.stringify(request.body)));
    reply.status(200).send();
});

fastify.get('/is-connected', async () => sockets.size > 0);

const sockets = new Set<WebSocket>();

fastify.get('/ws', { websocket: true }, (connection) => {
    sockets.add(connection.socket);
    connection.socket.on('close', () => {
        sockets.delete(connection.socket);
    })
});

fastify.get('/google-auth/authorize', (request, reply) => {
    reply.redirect(generateAuthUrl());
});

fastify.get<{
    Querystring: {
        code: string,
        scope: string,
    }
}>('/google-auth/callback', async (request) => {
    await handleGoogleCallback(request.query.code);
    return 'ok';
});

export const startApi = async () => {
    await fastify.listen(80, '0.0.0.0');
}
