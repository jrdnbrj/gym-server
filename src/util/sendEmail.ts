import * as nodemailer from "nodemailer";
import { SMTP_HOST, SMTP_PASSWORD, SMTP_USER } from "../constants";

const sendEmail = async (to: string, subject: string, html: string) => {
    // const account = await nodemailer.createTestAccount();

    // Configured for Heroku's CloudMailin or Gmail SMTP.
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD,
        },
    });

    const info = await transporter.sendMail({
        from: "RadikalGym Support",
        to,
        subject,
        html,
        // headers: { "x-cloudmta-class": "standard" }, For CloudMailin
    });

    console.log("Email sent to: " + info.envelope.to);
    console.log(info.response);
};

export default sendEmail;
