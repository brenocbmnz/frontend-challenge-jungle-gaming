import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "../api/contracts";
import { api } from "../api/client";
import { queryClient, sessionQuery } from "../api/queries";
const Context = createContext<{
  user?: User;
  uid: string;
  loading: boolean;
  expired: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}>({
  uid: "guest",
  loading: false,
  expired: false,
  login: async () => {},
  logout: async () => {},
});
export function SessionProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0);
  const [expired, setExpired] = useState(false);
  const q = useQuery(sessionQuery());
  void revision;
  useEffect(() => {
    const listener = () => {
      void queryClient.cancelQueries();
      queryClient.clear();
      setExpired(true);
      setRevision((v) => v + 1);
    };
    window.addEventListener("kurio:expired", listener);
    return () => window.removeEventListener("kurio:expired", listener);
  }, []);
  async function login(value: string) {
    await queryClient.cancelQueries();
    queryClient.clear();
    localStorage.setItem("kurio.token", value);
    setExpired(false);
    setRevision((v) => v + 1);
    await queryClient.fetchQuery(sessionQuery());
  }
  async function logout() {
    await api.post("/logout");
    await queryClient.cancelQueries();
    localStorage.removeItem("kurio.token");
    queryClient.clear();
    setRevision((v) => v + 1);
    setExpired(false);
  }
  return (
    <Context.Provider
      value={{
        user: q.data,
        uid: q.data?.id || "guest",
        loading: q.isLoading,
        expired,
        login,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useSession = () => useContext(Context);
