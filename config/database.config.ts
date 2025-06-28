import mongoose from 'mongoose'

const connectDB = async () => {
    try {
        await mongoose.connect(`mongodb+srv://samuel-yeboah:${process.env.MONGO_DB_PASSWORD}@kwabscluster.d7jjk.mongodb.net/?retryWrites=true&w=majority&appName=KwabsCluster`)
        console.log("mongodb connection - success")
    } catch (error) {
        console.error("error connecting to mongodb", error)
    }
}

export { connectDB }