import { createContext, useState, useEffect, type ReactNode, useContext } from "react";
import type { User, UserProfile } from "../types";
import { authClient } from "../lib/auth";
import { api } from "../lib/api";
import { useRef, useCallback } from "react";
import type { TrainingPlan } from "../types";

interface AuthContextType{ //gets user data if exists 
    user: User | null;
    isLoading: boolean;
    saveProfile: (profile: Omit<UserProfile, "userId" | "updatedAt">) => Promise<void>;
    generatePlan: () => Promise<void>;
    refreshData: () => Promise<void>;
    plan: TrainingPlan | null;
}
const AuthContext = createContext<AuthContextType | null> (null);

export default function AuthProvider({ children }: { children: ReactNode }){
    const [neonUser, setNeonUser] = useState<any>(null); // data for the user we get back from neon, as a user type called neonUser
    const [isLoading, setIsLoading] = useState(true); //boolean to check if the user is in a loading state 
    const isRefreshingRef = useRef(false); //boolean to check if the data is being refreshed
    const [plan, setPlan] = useState<TrainingPlan | null>(null); // data for the plan we get back from the api

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


    useEffect(() => {
        if (!isLoading) {
          if (neonUser?.id) {
            refreshData();
          } else {
            setPlan(null);
          }
          setIsLoading(false);
        }
      }, [neonUser?.id, isLoading]);

    // refreshData memoize (replace with caching later)
    const refreshData = useCallback(async () => {
        if(!neonUser || isRefreshingRef.current) return;
        isRefreshingRef.current = true;
        try {
            //fetch profile
            //const profileData = 


            //fetch plan
            const planData = await api.getCurrentPlan(neonUser.id).catch(() => null); // get the current plan for the user
            if (planData){
                setPlan({
                    id: planData.id,
                    userId: planData.userId,
                    overview: planData.planJson.overview,
                    weeklySchedule: planData.planJson.weeklySchedule,
                    progression: planData.planJson.progression,
                    version: planData.version,
                    createdAt: planData.createdAt,
                });
            };
        } catch(err) {
            console.error("Error refreshing data:", err);
        } finally {
            isRefreshingRef.current = false;
        }
    }, [neonUser?.id]);


    async function saveProfile(profile: Omit<UserProfile, "userId" | "updatedAt">){
        if(!neonUser) {
            throw new Error("User not authenticated");
        }

        await api.saveProfile(neonUser.id, profile);
        await refreshData();
    }

    async function generatePlan(){
        if(!neonUser) {
            throw new Error("User must be authenticated to generate a plan");
        };

        await api.generatePlan(neonUser.id);
        await refreshData();
    }

    return (
        <AuthContext.Provider value={{user: neonUser, isLoading, saveProfile, generatePlan, refreshData, plan}}>
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