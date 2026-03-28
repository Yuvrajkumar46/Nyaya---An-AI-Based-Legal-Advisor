module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('🔌 Socket connected:', socket.id);

        socket.on('join_room', (call_id) => {
            socket.join(call_id);
            console.log(`Socket ${socket.id} joined room ${call_id}`);
        });

        socket.on('call:incoming', (data) => {
            // data: { call_id, caller_peer_id, advocate_id }
            socket.to(data.call_id).emit('call:incoming', data);
        });

        socket.on('call:accepted', (data) => {
            socket.to(data.call_id).emit('call:accepted', data);
        });

        socket.on('call:ended', (data) => {
            io.to(data.call_id).emit('call:ended', data);
        });

        socket.on('call:chat_message', (data) => {
            io.to(data.call_id).emit('call:chat_message', data);
        });

        socket.on('call:billing_update', (data) => {
            // Synchronize the billing state
            io.to(data.call_id).emit('call:billing_update', data);
        });

        socket.on('call:share_document', (data) => {
            socket.to(data.call_id).emit('call:share_document', data);
        });

        socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected:', socket.id);
        });
    });
};
