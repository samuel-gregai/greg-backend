import mongoose, { Schema } from "mongoose";
import  {v4 as uuid} from 'uuid'

const UserSchema = new Schema({
  id: {
    type: String,
    default: uuid,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required:true
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
  },
});

const User = mongoose.model("User", UserSchema);
export { User };
