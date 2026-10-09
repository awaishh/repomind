import mongoose from "mongoose"

const connectDb = async (retries = 5, delay = 3000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 15000,
            });
            console.log("✅ MongoDb connected");
            return;
        } catch (error) {
            console.error(`❌ MongoDb connection attempt ${attempt}/${retries} failed:`, error.message);
            if (attempt < retries) {
                console.log(`⏳ Retrying in ${delay / 1000}s...`);
                await new Promise((res) => setTimeout(res, delay));
            } else {
                console.error("❌ All MongoDB connection attempts failed.");
                process.exit(1);
            }
        }
    }
};


export default connectDb
