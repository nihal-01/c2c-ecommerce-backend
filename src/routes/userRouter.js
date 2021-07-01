const router = require("express").Router();
const User = require("../models/user.model");
const auth = require("../middleware/auth");
const sendResetEmail = require("../email/connection");
const crypto = require("crypto");
const multer = require("multer");
const sharp = require("sharp");

// http://localhost:3001/api/user/...

router.post('', async (req, res) => {
  try {
    const newUser = new User(req.body);
    const response = await newUser.save();
    const token = await response.generateAuthToken();
    res.status(201).send({user: response, token});
  } catch(e) {
    if (e.name === "MongoError" && e.code === 11000) {
      return res.status(400).send({error: "This e-mail already in use"});
    }
    res.status(500).send({error: e});
  }
});

// check email already exists
router.post('/check-email', async (req, res) => {
  try {
    const user = await User.findOne({email: req.body.email});
    if (user) {
      res.status(400).send({error: "This e-mail already in use"});
    }
    res.status(200).send();
  } catch(e) {
    res.status(500).send(e);
  }
})

router.post('/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.status(200).send({user, token});
  } catch(e) {
    res.status(500).send(e);
  }
});

// Get a user details
router.get('/u/:id', async (req, res) => {
  try {
    const user = await User.findOne({_id: req.params.id});
    if (!user) {
      return res.status(404).send({error: "No user found"});
    }
    res.status(200).send(user);
  } catch(e) {
    res.status(500).send(e);
  }
});

// Get own profile
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).send(user);
  } catch (e) {
    res.status(500).send(e);
  }
});

// signout
router.post('/sign-out', auth, async (req, res) => {
  try {
    const user = req.user;
    const token = req.token;
    user.tokens = user.tokens.filter((tkn) => tkn.token != token);
    await user.save();
    res.status(200).send({message: "You successfully signed out"});
  } catch (e) {
    res.status(500).send(e);
  }
});

// signout from all devices
router.post('/sign-out-all', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.status(200).send({message: "You successfully signed out from all devices"});
  } catch (e) {
    res.status(500).send(e);
  }
});

// edit user
router.patch('/', auth, async (req, res) => {
  const allowedUpdates = ["fname", "email", "phone", "about"];
  const updates = Object.keys(req.body);
  const isValid = updates.every((update) => allowedUpdates.includes(update));
  if (!isValid) {
    return res.status(400).send({error: "You can only update fname, email, phone and about"});
  }

  try {
    const user = await User.findOneAndUpdate({ _id: req.user._id }, req.body, { new: true, runValidators: true });
    res.status(200).send(user);
  } catch (e) {
    res.status(500).send(e);
  }
});

// delete user
router.delete('/', auth, async (req, res) => {
  try {
    await User.findByIdAndRemove(req.user._id);
    res.status(200).send({message: "Deleted successfully"});
  } catch (e) {
    res.status(500).send(e);
  }
});

// edit password
router.patch('/update-password', auth, async (req, res) => {
  try {
    if (!req.body.oldPassword || !req.body.newPassword) {
      return res.status(400).send({error: "Must provide all feilds"});
    }
    await User.findAndUpdatePassword(req.user, req.body.oldPassword, req.body.newPassword);
    res.status(200).send({message: "password changed successfully"});
  } catch (e) {
    res.status(500).send(e);
  }
});

// forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({error: "user not found"});
    }
    let resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 600000 // 10 minutes
    await sendResetEmail(email, resetToken);
    await user.save();
    res.status(200).send(user);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.patch('/reset/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!token) {
    return res.status(400).send("Invalid or expired token");
  }
  try {
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).send("Invalid or expired token");
    }
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.password = password;
    await user.save();
    res.status(200).send(user);
  } catch (e) {
    res.status(500).send(e);
  }
});

const upload = multer({
  limits: {
    fileSize: 3000000,
  },
  fileFilter: (req, file, db) => {
    const allowed = ["jpg", "jpeg", "png"];
    if(!allowed.includes(file.originalname.split(".")[1])) {
      return db(new Error("please upload jpg, jpeg or png"));
    }
    db(null, true);
  }
});

// post avatar
router.post('/me/avatar', auth, upload.single("avatar"), async (req, res) => {
  try {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.status(200).send();
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete('/me/avatar', auth, async (req, res) => {
  try {
    if (!req.user.avatar) {
      return res.status(404).send({error: "You have no avatar"});
    }
    req.user.avatar = undefined;
    await req.user.save();
    res.status(200).send();
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get('/avatar/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user || !user.avatar) {
      res.status(404).send("Avatar not found!");
    }
    res.set('Content-Type', 'image/jpg');
    res.send(user.avatar);
  } catch (e) {
    res.status(500).send(e);
  }
})


module.exports = router;