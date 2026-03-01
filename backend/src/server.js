import dns from "dns"
dns.setServers(["8.8.8.8", "8.8.4.4"])
dns.setDefaultResultOrder("ipv4first")
import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import routes from "./routes/index.js"
import connectMongo from "./config/db.js"

dotenv.config()

const app = express()

connectMongo()

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())

app.use("/uploads", express.static("uploads"))

app.use("/api", routes)

// middleware global de erro
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        error: err.message || "Erro interno do servidor",
    })
})

app.listen(process.env.PORT, () => {
    console.log(`Servidor rodando na porta ${process.env.PORT}`)
})