import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
export default function Profile(){
    const { user, isLoading } = useAuth();
    const plan = false; //if the user has a workout plan
    if(!user && !isLoading){ //if user is not authenticated and not loading, redirect to auth page
        return <Navigate to = "/auth/sign-in" replace/>;
    }

    // if the user has used the app before they have a workout plan, 
    // hence they are allowed the profile page, otherwise they are redirected to the onboarding page
    if(!plan){
        return <Navigate to = "/onboarding" replace/>;
    }

    return <div>Profile Page</div>
}