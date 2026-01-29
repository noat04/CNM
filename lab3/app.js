// app.js
import express from "express";
import dotenv from "dotenv";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import homeRoutes from "./routes/home.routes.js";
import session from "express-session";
import authRoutes from "./routes/auth.routes.js";
import { requireLogin, requireAdmin } from "./middlewares/auth.middleware.js";


dotenv.config();

const app = express();
// 1. Cấu hình Session (Đặt trước app.use routes)
app.use(session({
    secret: "mySecretKey_TMA_Internship", // Chuỗi bí mật để ký session
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 60 * 1000 } // Session sống trong 30 phút
}));

// 2. Middleware toàn cục: Truyền biến user xuống tất cả View EJS
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});


// view engine
app.set("view engine", "ejs");
app.set("views", "./views");

// middleware
app.use(express.urlencoded({ extended: true }));

// routes

// 1. Route Auth (Login/Register) phải nằm ĐẦU TIÊN và KHÔNG ĐƯỢC có middleware requireLogin
app.use("/auth", authRoutes);

// 2. Các route con cụ thể (Có bảo vệ)
app.use("/products", requireLogin, requireAdmin, productRoutes);
app.use("/categories", requireLogin, requireAdmin, categoryRoutes);

// 3. Route trang chủ (Gốc) phải nằm CUỐI CÙNG
// Vì "/" là prefix của mọi đường dẫn, nếu để lên đầu nó sẽ "ăn" hết các request
app.use("/", requireLogin, homeRoutes);



// server
app.listen(3000, () => {
    console.log("🚀 Server running at http://localhost:3000");
    console.log("AWS REGION:", process.env.AWS_REGION);
    console.log("S3 BUCKET:", process.env.AWS_S3_BUCKET);
});
