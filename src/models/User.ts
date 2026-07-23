import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    //password reset : we store only the HASH of the token, plus its expiry.
    passwordResetTokenHash: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // Never expose the password hash, reset token, or internal fields.
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpires;
        return ret;
      },
    },
  },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const UserModel = model("User", userSchema);
