require('dotenv').config()
const app = require("express")()
const bodyParser = require("body-parser")
const cors = require("cors")
const mongoose = require("mongoose")
const authRouter = require("./routes/authRouter")

// Global middleware
app.use(cors())
app.use(bodyParser.json())
app.use(require("express").json())

// Validate critical environment variables early
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set. Please set it in .env and restart the server.")
}

// Connect to MongoDB
if (!process.env.MONGO_URI) {
  console.warn("MONGO_URI is not set in environment. Mongo connection will fail.")
}
mongoose.connect(process.env.MONGO_URI || "", { 
  dbName: process.env.MONGO_DB || undefined
}).then(() => {
  console.log("Connected to MongoDB")
}).catch((err) => {
  console.error("MongoDB connection error:", err.message)
})

// Routes
app.use("/api/auth", authRouter)

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, ()=>{
    console.log(`Server Start On Port ${PORT} 🎉✨ `)
})