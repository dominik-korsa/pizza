const Fastify = require('fastify');
const FastifyWebsocket = require('fastify-websocket');

const fastify = Fastify({ logger: true });
fastify.register(FastifyWebsocket)

fastify.post('/request-print', async (request, reply) => {
    sockets.forEach((socket) => socket.send(JSON.stringify(request.body)));
    reply.status(200).send();
});

const sockets = new Set();

fastify.get('/ws', { websocket: true }, (connection) => {
    sockets.add(connection.socket);
    connection.socket.on('close', () => {
        sockets.delete(connection.socket);
    })
});

const start = async () => {
    try {
        await fastify.listen(80, '0.0.0.0');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}
start();
