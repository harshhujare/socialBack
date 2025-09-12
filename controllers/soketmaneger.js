import { Server } from "socket.io";
export const connectsoket = (server) => {
	const io = new Server(server, {
		cors: {
			origin: process.env.CLIENT_URL || 'http://localhost:5173',
			methods: ['GET', 'POST'],
			credentials: true,
		},
	});
	return io;



};