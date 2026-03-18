import 'dotenv/config';
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { profileRouter } from "./routes/profile";
import { planRouter } from "./routes/plan";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(cookieParser());
app.use(express.json());

//API routes
app.use("/api/profile", profileRouter);
app.use("/api/plan", planRouter);



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});