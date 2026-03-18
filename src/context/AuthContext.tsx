import { createContext, useState, useEffect, type ReactNode, useContext } from "react";
import type { User, UserProfile } from "../types";
import { authClient } from "../lib/Auth";
import { api } from "../lib/api";

interface AuthContextType{ //gets user data if exists 
    user: User | null;
    isLoading: boolean;
    saveProfile: (profile: Omit<UserProfile, "userId" | "updatedAt">) => Promise<void>;

}
const AuthContext = createContext<AuthContextType | null> (null);

export default function AuthProvider({ children }: { children: ReactNode }){
    const [neonUser, setNeonUser] = useState<any>(null); // data for the user we get back from neon, as a user type called neonUser
    const [isloading, setIsLoading] = useState(true); //boolean to check if the user is in a loading state

    console.log(neonUser);
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
            finally{
                setIsLoading(false); //set loading to false once the user is loaded
            }
        }

        loadUser();
    }, []);

    async function saveProfile(profile: Omit<UserProfile, "userId" | "updatedAt">){
        if(!neonUser) {
            throw new Error("User not authenticated");
        };

        await api.saveProfile(neonUser.id, profile);
    }

    return (
        <AuthContext.Provider value={{user: neonUser, isLoading: isloading, saveProfile}}>
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