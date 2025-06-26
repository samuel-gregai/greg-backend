import mongoose, { Schema } from "mongoose";
import { v4 as uuid } from "uuid";
const AccountSchema = new Schema({
    id: {
        type: String,
        default: uuid,
        required: true
    },
    userId: {
        type: String,
        required: true,
        ref: "User"
    },
    picture: {
        type:String,
    },
    exp: {
      type: Number  
    },
    iat: {
        type: Number
    },
    access_token: {
        type: String,
        required: true
    },
    refresh_token: {
        type: String,
        required: true
    },
    email_verified: {
        type: Boolean,
    }
    
})

export const Account = mongoose.model("Account", AccountSchema)
AccountSchema.index({userId: 1})