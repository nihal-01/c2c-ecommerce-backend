const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    trim: true,
  },
  about: {
    type: String,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      }
    }
  ],
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  avatar: {
    type: Buffer,
  }
});

userSchema.methods.generateAuthToken = async function () {
  try {
    const user = this;
    const token = await jwt.sign({ _id: user._id.toString() }, "secret", { expiresIn: "7d" });

    user.tokens = [...user.tokens, { token }];
    await user.save();
    return token;
  } catch(e) {
    return e;
  }
}

userSchema.statics.findByCredentials = (email, password) => {
  return new Promise(async (resolve, reject) => {
    const user = await User.findOne({email: email});

    if (!user) {
      return reject({error: "Unable to login"});
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return reject({error: "Unable to login"});
    }
    resolve(user);
  })
}

userSchema.statics.findAndUpdatePassword = function (user, oldPassword, newPassword) {
  return new Promise(async (resolve, reject) => {
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return reject({error: "Incorrect password"});
    }
    user.password = newPassword;
    await user.save();
    resolve()
  })
}

// Middleware to hash password.
userSchema.pre('save', async function (next) {
  const user = this;

  if(user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

const User = mongoose.model('users', userSchema);

module.exports = User;