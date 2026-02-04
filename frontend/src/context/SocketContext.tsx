
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from "@/hooks/use-toast";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Only connect if we have a token (or maybe handle anonymous?)
        // handling disconnection if logging out is important
        return;
    }

    const newSocket = io('http://localhost:3000', {
      auth: {
        token: token,
      },
      // query: { token }, // Fallback
      autoConnect: true,
      reconnection: true,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket Connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket Disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
        console.error('Socket Connection Error:', err);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []); // Run once on mount (reload required for new token login? Or listen to storage)

  // TODO: Improve token listening so socket reconnects on login
  
  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
