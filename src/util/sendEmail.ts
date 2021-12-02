import * as nodemailer from "nodemailer";

const sendEmail = async (to: string, subject: string, html: string) => {
    const account = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
            user: account.user,
            pass: account.pass,
        },
    });

    const info = await transporter.sendMail({
        from: "RadikalGym Support <support@radikalgym.com>",
        to,
        subject,
        html,
    });

    console.log("Email sent to: " + info.envelope.to);
    console.log("Preview URL: " + nodemailer.getTestMessageUrl(info));
};

export default sendEmail;
