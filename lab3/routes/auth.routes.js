// routes/auth.routes.js
import express from "express";
import bcrypt from "bcryptjs"; // Dùng để mã hóa mật khẩu
import { v4 as uuidv4 } from "uuid";
import dynamoDB from "../db/dynamodb.js";
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const router = express.Router();
const TABLE_NAME = "users";

/* ===================== TRANG ĐĂNG KÝ (Để test tạo user) ===================== */
router.get("/register", (req, res) => {
    res.render("auth/register");
});

router.post("/register", async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // 1. Kiểm tra user tồn tại chưa (Dùng Scan tạm thời, thực tế nên dùng GSI)
        const checkUser = await dynamoDB.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "username = :u",
            ExpressionAttributeValues: { ":u": username }
        }));

        if (checkUser.Items.length > 0) {
            return res.send("❌ Username đã tồn tại");
        }

        // 2. Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Lưu vào DB
        await dynamoDB.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                userId: uuidv4(),
                username,
                password: hashedPassword,
                role: role || "staff", // Mặc định là staff
                createdAt: new Date().toISOString()
            }
        }));

        res.redirect("/auth/login");
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi đăng ký");
    }
});

/* ===================== ĐĂNG NHẬP ===================== */
router.get("/login", (req, res) => {
    res.render("auth/login", { error: null });
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Tìm user theo username
        const result = await dynamoDB.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "username = :u",
            ExpressionAttributeValues: { ":u": username }
        }));

        const user = result.Items ? result.Items[0] : null;

        // 2. Kiểm tra mật khẩu
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render("auth/login", { error: "Sai tên đăng nhập hoặc mật khẩu" });
        }

        // 3. Lưu thông tin vào Session (Quan trọng)
        req.session.user = {
            userId: user.userId,
            username: user.username,
            role: user.role
        };

        // 4. Redirect
        res.redirect("/");

    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi đăng nhập");
    }
});

/* ===================== ĐĂNG XUẤT ===================== */
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/auth/login");
    });
});

export default router;