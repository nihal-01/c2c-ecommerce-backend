const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
		user: "nihaln0077@gmail.com",
		pass: "floccinaucinihilipilification",
	},
});

const sendResetEmail = async (email, resetToken) => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
		  from: "nihaln0077@gmail.com",
		  to: email,
		  subject: "Verification Link",
		  html: `<p>Use this link to reset your password <a href="http://localhost:3001/${resetToken}">link</a></p>`,
	  };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return reject(error);
      } else {
        resolve();
      }
    });

  })
}

module.exports = sendResetEmail;