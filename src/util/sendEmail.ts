import { Transporter } from "nodemailer";

interface EmailInfo {
    to: string;
    subject: string;
    html: string;
}

const sendEmail = async (
    transporter: Transporter,
    { to, subject, html }: EmailInfo
) => {
    // const account = await nodemailer.createTestAccount();

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
