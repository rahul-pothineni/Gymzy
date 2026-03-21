import { RedirectToSignIn, SignedIn } from "@neondatabase/neon-js/auth/react";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Select } from "../components/ui/Select";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import type { UserProfile } from "../types";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const goalOptions = [
    {value: "bulk", label: "Build Muscle"},
    {value: "cut", label: "Lose Fat"},
    {value: "strength", label: "Strength"},
    {value: "endurance", label: "Endurance"},
    {value: "recomp", label: "Body Recomposition"},
];

const experienceOptions = [
    {value: "beginner", label: " (0-1 Years Experience ) "},
    {value: "intermediate", label: " (1-3 Years Experience ) "},
    {value: "advanced", label: " (3+ Years Experience ) "},
];

const daysPerWeekOptions = [
    {value: "2", label: "2 Days Per Week"},
    {value: "3", label: "3 Days Per Week"},
    {value: "4", label: "4 Days Per Week"},
    {value: "5", label: "5 Days Per Week"},
    {value: "6", label: "6 Days Per Week"},
];

const minutesPerDayOptions = [
    {value: "30", label: "30 Minutes Per Day"},
    {value: "45", label: "45 Minutes Per Day"},
    {value: "60", label: "60 Minutes Per Day"},
    {value: "90", label: "90 Minutes Per Day"},
    {value: "120", label: "120 Minutes Per Day"},
];

const splitOptions = [
    {value: "full_body", label: "Full Body Split"},
    {value: "upper_lower", label: "Upper-Lower Split"},
    {value: "push_pull", label: "Push-Pull-Legs Split"},
    {value: "custom", label: "Let AI Choose"},
];

export default function Onboarding(){
    const { user, saveProfile, generatePlan } = useAuth();
    const [formData, setFormData] = useState({
        goal: goalOptions[0].value,
        experience: experienceOptions[0].value,
        daysPerWeek: daysPerWeekOptions[0].value,
        minutesPerDay: minutesPerDayOptions[0].value,
        split: splitOptions[0].value,
    });


    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    async function submitForm(e: React.SubmitEvent){
        e.preventDefault();

        const profile: Omit<UserProfile, "userId" | "updatedAt"> = {
            goal: formData.goal as UserProfile["goal"],
            experience: formData.experience as UserProfile["experience"],
            daysPerWeek: parseInt(formData.daysPerWeek) as UserProfile["daysPerWeek"],
            minutesPerDay: parseInt(formData.minutesPerDay) as UserProfile["minutesPerDay"],
            split: formData.split as UserProfile["split"],
        };

        try {
            await saveProfile(profile);
            setIsGenerating(true); //after user finishes onboarding, they are now generating a plan
            await generatePlan();
            navigate("/profile");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setIsGenerating(false); //set generating to false after the plan is generated
        }
    }

    
    function updateFormData(field: string, value: string){ //function takes in field and updates to value, which updates formData state
        setFormData(prev => ({...prev, [field]: value}));
    }

    if(!user){
        return <RedirectToSignIn />; //redirects to sign-in page if user is not signed in
    }

    //only shows page contents if the user is signed in
    return (
        <SignedIn> 
            <div className = "min-h-screen pt-24 pb-12 px-6">
                <div className = "max-w-xl mx-auto">
                    {/* Progress Bar for onboarding */}

                    {/* Questionnaire */}
                    {!isGenerating ? <Card variant = "bordered">
                        <h1 className="text-2xl font-bold mb-2">Tell Us About Your Goals</h1>
                        <p className = "text-[var(--color-muted)] mb-6">
                            Help us create a personalized workout plan for you.
                        </p>
                        <form onSubmit = {submitForm} className = "space-y-4"> {/*form for the questionnaire*/}
                            <Select 
                                id = "goal" 
                                label="What's your primary goal?"
                                options= {goalOptions}
                                value = {formData.goal}
                                onChange = {(e) => updateFormData("goal", e.target.value)}
                            />
                            <Select 
                                id = "experience" 
                                label="How much experience do you have?"
                                options= {experienceOptions}
                                value = {formData.experience}
                                onChange = {(e) => updateFormData("experience", e.target.value)}
                            />
                            <Select 
                                id = "daysPerWeek" 
                                label="How many days per week do you want to workout?"
                                options= {daysPerWeekOptions}
                                value = {formData.daysPerWeek}
                                onChange = {(e) => updateFormData("daysPerWeek", e.target.value)}
                            />
                            <Select 
                                id = "minutesPerDay" 
                                label="How much time do you have per day to workout?"
                                options= {minutesPerDayOptions}
                                value = {formData.minutesPerDay}
                                onChange = {(e) => updateFormData("minutesPerDay", e.target.value)}
                            />
                            <Select 
                                id = "split" 
                                label="What's your preferred workout split?"
                                options= {splitOptions}
                                value = {formData.split}
                                onChange = {(e) => updateFormData("split", e.target.value)}
                            />
                            <div className = "flex gap-3 pt-2">
                                <Button type = "submit" className = "flex-1 gap-2">
                                    Generate Plan
                                </Button>
                            </div>
                        </form>
                        {/* AI Generation vvv*/} 
                    </Card>: (
                        
                        <Card variant = "bordered" className = "text-center py-16">
                            <Loader2 className = "w-10 h-10 mx-auto animate-spin mb-6 text-[var(--color-accent)]"/>
                            <h1 className = "text-2xl font-bold mb-2">Generating your plan</h1>
                            <p className = "text-[var(--color-muted)] mb-6">Our AI is working on creating a personalized workout plan for you.</p>
                        </Card>
                    )}

                    
                </div>
            </div>
        </SignedIn>);
}