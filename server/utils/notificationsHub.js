const clientsByUserId = new Map();

const ensureClientSet = (userId) => {
  if (!clientsByUserId.has(userId)) {
    clientsByUserId.set(userId, new Set());
  }
  return clientsByUserId.get(userId);
};

export const emitNotificationToUser = (userId, payload) => {
  const clients = clientsByUserId.get(userId);
  if (!clients || clients.size === 0) return;

  const data = `event: notification\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    try {
      client.write(data);
    } catch {
      // Ignore broken stream writes.
    }
  }
};

export const registerNotificationClient = (userId, res) => {
  const clients = ensureClientSet(userId);
  clients.add(res);

  const keepAliveTimer = setInterval(() => {
    try {
      res.write(": keep-alive\n\n");
    } catch {
      // Ignore broken stream writes.
    }
  }, 25000);

  return () => {
    clearInterval(keepAliveTimer);
    const clientSet = clientsByUserId.get(userId);
    if (!clientSet) return;
    clientSet.delete(res);
    if (clientSet.size === 0) {
      clientsByUserId.delete(userId);
    }
  };
};
