"use client";

import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;
let connectPromise: Promise<Socket> | null = null;
const APP_BASE_PATH = "/nameplaceanimalthing";

const getBrowserOrigin = () => {
  if (typeof window === "undefined") {
    return "http://localhost:3000";
  }

  return window.location.origin;
};

const normalizeSocketOrigin = (rawOrigin: string) => {
  const trimmedOrigin = String(rawOrigin || "").trim();

  if (!trimmedOrigin) {
    return getBrowserOrigin();
  }

  const protocolMatch = trimmedOrigin.match(/^([^:]+):\/\/(.+)$/);
  if (protocolMatch) {
    const normalizedProtocol = protocolMatch[1].split(",")[0]?.trim();
    const normalizedHost = protocolMatch[2].split(",")[0]?.trim();

    if (normalizedProtocol && normalizedHost) {
      return `${normalizedProtocol}://${normalizedHost}`;
    }
  }

  try {
    return new URL(trimmedOrigin, getBrowserOrigin()).origin;
  } catch {
    return getBrowserOrigin();
  }
};

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
      socketInstance = io(normalizeSocketOrigin(wsUrl), {
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
