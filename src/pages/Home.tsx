import { useAuth, } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
export default function Home(){
const { user, isLoading } = useAuth();
    
    if(user && !isLoading){ //if user is authenticated and not loading, redirect to profile page
        return <Navigate to = "/profile" replace/>;
    }
    return <div>Home Page</div>
}