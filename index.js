// index.js

// import modules
import express from "express";
import dotenv from "dotenv";
import { connectDb } from "./db/connection.js";
import { adminsRouter } from "./src/modules/admins/admins.router.js";
import authRouter from "./src/modules/auth/auth.router.js";
import { subTeamsRouter } from "./src/modules/subteams/subteams.router.js";
import { videosRouter } from "./src/modules/videos/videos.router.js";
import galleryRouter from "./src/modules/gallery/gallery.router.js";
import { sponsorsRouter } from "./src/modules/sponsors/sponsors.router.js";
import { teamsRouter } from "./src/modules/teams/teams.router.js";

// initialize env
dotenv.config();

// initialize app and server
const app = express()
export const port = 3000

// connect db
await connectDb();

// parse reqs
app.use(express.json());

// routers
app.use("/members", authRouter);
app.use("/admins", adminsRouter);
app.use("/subteams", subTeamsRouter);
app.use("/videos", videosRouter);
app.use("/gallery", galleryRouter);
app.use("/sponsors", sponsorsRouter);
app.use("/teams",teamsRouter)

//page not found
app.all("*", (req, res, next) => {
     return next(new Error("page not found", { cause: 404 }));
   });

//global error handler
   app.use((error, req, res, next) => {
     const statusCode = error.status || 500;
     return res.status(statusCode).json({
       success: false,
       message: error.message,
       stack: error.stack,
     });
   });

app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`APEX app listening on port ${port}!`))