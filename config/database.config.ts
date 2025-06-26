import mongoose from 'mongoose'

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017')
        console.log("mongodb connection - success")
    } catch (error) {
        console.error("error connecting to mongodb", error)
    }
}

export {connectDB}