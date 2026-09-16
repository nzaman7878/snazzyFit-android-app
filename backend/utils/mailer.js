import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    }
});

export const sendOrderConfirmation = async (email, order) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_EMAIL,
            to: email,
            subject: 'Order Confirmation - SnazzyFit',
            html: `
                <h1>Thank you for your order!</h1>
                <p>Your order (ID: ${order._id}) has been successfully placed.</p>
                <p>Total Amount: ₹${order.amount}</p>
                <p>We will notify you when your order is shipped.</p>
            `
        };
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending order confirmation email:", error);
    }
};

export const sendShippingUpdate = async (email, order) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_EMAIL,
            to: email,
            subject: 'Shipping Update - SnazzyFit',
            html: `
                <h1>Your order status has been updated!</h1>
                <p>Your order (ID: ${order._id}) is now: <strong>${order.status}</strong></p>
                <p>Thank you for shopping with SnazzyFit.</p>
            `
        };
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending shipping update email:", error);
    }
};

export const sendPasswordReset = async (email, resetUrl) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_EMAIL,
            to: email,
            subject: 'Password Reset Request - SnazzyFit',
            html: `
                <h1>You have requested a password reset</h1>
                <p>Please click the link below to reset your password. This link is valid for 15 minutes.</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>If you did not request this, please ignore this email.</p>
            `
        };
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending password reset email:", error);
    }
};
