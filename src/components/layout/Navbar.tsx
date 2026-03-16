import { Anchor } from "lucide-react";
import {Link} from "react-router-dom";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { UserButton } from "@neondatabase/neon-js/auth/react";
/**
 * @returns Navigation Bar which includes logo, name, and either profile button or login/signup
 */
export default function Navbar(){
    const user = useAuth(); 
    return (
        <header className = "fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md"> 
            <div className = "max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link 
                    to ="/"
                    className = "flex items-center gap-2 text-[var(--color-foreground)]">
                    <Anchor className = "w-6 h-6 text-[var(--color-accent)]"/>
                    <span className = "font-semibold text-lg">Gymzy</span>
                </Link>

                <nav>
                    {user?  //check if user is authenticated, if they are give profile icon, if not give sign-in+up options
                    
                    <>
                        <Link to="/profile">
                            <Button variant = "ghost" size = "sm">My Plan</Button>
                        </Link>
                        <UserButton className = "bg-(--color-accent)"/>
                    </> 
                    
                    : 
                    
                    <>
                        <Link to="/auth/sign-in">
                            <Button variant = "ghost" size = "sm">Sign In</Button>
                        </Link>
                        <Link to="/auth/sign-up">
                            <Button size = "sm">Sign Up</Button>
                        </Link>
                    </>
                    }
                    
                </nav>
            </div>
        </header>
    );
}