import express from 'express'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import { connectDB } from './config/database.config'
import router from './routes/router'
import cors from 'cors'
import cookieParser from 'cookie-parser'
dotenv.config()
const app = express(); 

(async () => {
    await connectDB()

    app.use(cors({
        origin: ["http://localhost:1856","https://web.gregthe.ai/"],
        credentials: true
    }))
    app.use(cookieParser());
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json())
    app.use(router)

    app.listen(process.env.PORT || 8080, () => {
        console.log(`Server is running on PORT ${process.env.PORT}`)
    })
})()
