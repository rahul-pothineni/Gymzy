import { createContext, useState, useEffect, type ReactNode, useContext } from "react";
import type { User } from "../types";
import { authClient } from "../lib/Auth";

interface AuthContextType{ //gets user data if exists 
    user: User | null;

}
const AuthContext = createContext<AuthContextType | null> (null);

export default function AuthProvider({ children }: { children: ReactNode }){
    const [neonUser, setNeonUser] = useState<any>(null); // data for the user we get back from neon, as a user type called neonUser
    useEffect(() => {
        async function loadUser(){ // loads user info using our authClient
            try {
                const result = await authClient.getSession();
                if(result && result.data?.user){
                    setNeonUser(result.data.user);
                } else{
                    setNeonUser(null); }
            } catch(err) {
                setNeonUser(null); }
        }

        loadUser();
    }, []);

    return (
        <AuthContext.Provider value={{user: neonUser}}>
            {children}
        </AuthContext.Provider>
    );  
}

export function useAuth(){
    const context = useContext(AuthContext);
    if(!context){
        throw new Error("useAuth isn't used within an Auth Provider");
    }
    return context;
}