import { io } from "socket.io-client";
import { apiBaseUrl } from "../endpoints";

const socket = io(apiBaseUrl, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});

export default socket;
