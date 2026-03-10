"use client";

import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;
let connectPromise: Promise<Socket> | null = null;
const APP_BASE_PATH = "/nameplaceanimalthing";

export const getSocket = async () => {
  if (socketInstance) {
    return socketInstance;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = fetch(`${APP_BASE_PATH}/api/socket`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Socket bootstrap failed.");
      }

      return response.json() as Promise<{ wsUrl: string }>;
    })
    .then(({ wsUrl }) => {
      socketInstance = io(wsUrl, {
        path: `${APP_BASE_PATH}/socket.io`,
        transports: ["websocket", "polling"],
        autoConnect: true,
        timeout: 20000,
        reconnection: true,
        reconnectionDelay: 800,
        reconnectionDelayMax: 5000,
      });

      return socketInstance;
    })
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
};
