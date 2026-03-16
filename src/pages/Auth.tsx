import { AuthView } from "@neondatabase/neon-js/auth/react";
import { useParams } from "react-router-dom";

export default function Auth(){
    const{ pathname } = useParams(); //changes the path set in src/App.tsx for auth
    return (
        <div className = "min-h-screen pt-24 pb-12 px-6 flex items-center justify-center">
            <AuthView pathname = {pathname}/>
        </div>
    );
}