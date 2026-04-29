const nodemailer = require("nodemailer");

const mailConfig = {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_FROM || '', // your email
        pass: process.env.MAIL_PASS || '', // your password
    },
    tls: {
        ciphers: 'SSLv3'
    },
    secure: true,
}
/**
 * Mailer - Send mail
 * @param {string} to EmailId to send (',' seperated)
 * @param {string} message Text body
 * @param {string} subject short title
 * @param {file} file file(s)
 * @param {string} html html - body content
 * @param {string} text
 * @returns {Boolean}
 */
const Mailer = async (to, message, subject, file, html) => {
    if (!to || !message || !subject) throw Error("Invalid params");

    const transporter = nodemailer.createTransport(mailConfig);
    let mailOptions
    if (!file) {
        mailOptions = {
            from: process.env.MAIL_FROM,
            to: to,
            subject: subject,
            text: message,
            html: html,
        };
    } else {
        mailOptions = {
            from: process.env.MAIL_FROM,
            to: to,
            subject: subject,
            text: message,
            attachments: {
                filename: file.name,
                path: file.path,
            },
        };
    }

    const sendEmail = async (mailOptions) => {
        try {
            const info = await transporter.sendMail(mailOptions);
            return {
                status: true,
                output: info,
            };
        } catch (error) {
            console.error("Error occurred:", error);
            return {
                status: false,
                output: error,
            };
        }
    }
    let mailResult = {
        status: false,
        output: null,
    }
    await sendEmail(mailOptions).then((result) => {
        mailResult = result;
    });

    // console.log(mailStatus)
    return mailResult;
};

module.exports = Mailer

