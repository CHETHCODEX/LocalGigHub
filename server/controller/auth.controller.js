import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";
import createError from "../utils/createError.js";
export async function register(req, res, next) {
  try {
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return next(
        createError(409, "Username already exists. Try a different username."),
      );
    }

    const existingEmail = await User.findOne({ email: req.body.email });
    if (existingEmail) {
      return next(
        createError(409, "Email already registered. Please log in instead."),
      );
    }

    const hash = bcrypt.hashSync(req.body.password, 5);
    const newUser = new User({
      ...req.body,
      password: hash,
    });
    await newUser.save();
    res.status(201).send("user created");
  } catch (err) {
    if (err?.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern || {})[0];
      if (duplicateField === "username") {
        return next(
          createError(
            409,
            "Username already exists. Try a different username.",
          ),
        );
      }
      if (duplicateField === "email") {
        return next(
          createError(409, "Email already registered. Please log in instead."),
        );
      }
      return next(
        createError(409, "Account already exists with these details."),
      );
    }
    next(err);
  }
}
export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return next(createError(404, "User not found"));

    const iscorrect = bcrypt.compareSync(req.body.password, user.password);
    if (!iscorrect) return next(createError(400, "wrong password"));

    const token = Jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_KEY,
    );
    const { password, ...info } = user._doc;
    res.cookie("accessToken", token, { httpOnly: true }).status(200).send(info);
  } catch (error) {
    next(error);
  }
};
export const logout = async (req, res) => {
  res
    .clearCookie("accessToken", {
      sameSite: "none",
      secure: true,
    })
    .status(200)
    .send("User has been logout");
};
