// Description: This file contains the MongoDB connection logic using Mongoose.
// It exports a function that connects to the MongoDB database using the connection string from environment variables.
import mongoose from 'mongoose';
//import dotenv from 'dotenv';
//dotenv.config({ path: '.env' }); // Load environment variables from config.env

const connectToMongoDB = async () => {
    try {
        /* const connection = await mongoose.connect(process.env.MONGO_URl, {
             useNewUrlParser: true,
             useUnifiedTopology: true,
         });*/
    const connection = await mongoose.connect(`${process.env.DB}/data`)
    //  const connection = await mongoose.connect(process.env.LOCAL_CONN_STR)

      console.log(`MongoDB connected: ${connection.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

export default connectToMongoDB;