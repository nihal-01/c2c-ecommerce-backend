const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decode = await jwt.verify(token, "secret");
    const user = await User.findOne({_id: decode._id});

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch(e) {
    res.status(401).send({error: e.message});
  }
}

module.exports = auth;