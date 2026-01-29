import express from "express";
import { v4 as uuidv4 } from "uuid";
import upload from "../upload.js";
import dynamoDB from "../db/dynamodb.js";
import s3 from "../db/s3.js";
import { PutCommand, ScanCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const router = express.Router();

/* ===================== LIST PRODUCTS ===================== */
// URL thực tế: /products/
router.get("/", async (req, res) => {
    try {
        const result = await dynamoDB.send(
            new ScanCommand({
                TableName: "products",
                FilterExpression: "isDeleted = :d",
                ExpressionAttributeValues: { ":d": false }
            })
        );
        // Lưu ý: Đảm bảo file view nằm đúng tại views/product/products.ejs
        res.render("product/products", { products: result.Items });
    } catch (err) {
        console.error(err);
        res.status(500).send("❌ Không thể tải danh sách sản phẩm");
    }
});

/* ===================== ADD PRODUCT ===================== */
// SỬA: Bỏ "/products", chỉ để "/add"
// URL thực tế: /products/add
router.get("/add", async (req, res) => {
    const categories = await dynamoDB.send(new ScanCommand({ TableName: "categories" }));
    res.render("product/add", { categories: categories.Items });
});

router.post("/add", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) return res.send("❌ Chưa chọn ảnh");

        const id = uuidv4();
        const { name, categoryId } = req.body;
        const price = Number(req.body.price);
        const quantity = Number(req.body.quantity);
        const imageKey = `products/${id}-${req.file.originalname}`;

        await s3.send(new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: imageKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        }));

        const imageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;

        await dynamoDB.send(new PutCommand({
            TableName: "products",
            Item: {
                id, name, price, quantity, categoryId,
                url_image: imageUrl,
                isDeleted: false,
                createdAt: new Date().toISOString()
            }
        }));

        res.redirect("/products");
    } catch (err) {
        console.error(err);
        res.status(500).send("❌ Thêm sản phẩm thất bại");
    }
});

/* ===================== EDIT PRODUCT ===================== */
// SỬA: Bỏ "/products", chỉ để "/edit/:id"
// URL thực tế: /products/edit/123
router.get("/edit/:id", async (req, res) => {
    const product = await dynamoDB.send(new GetCommand({
        TableName: "products",
        Key: { id: req.params.id }
    }));
    const categories = await dynamoDB.send(new ScanCommand({ TableName: "categories" }));

    res.render("product/edit", {
        product: product.Item,
        categories: categories.Items
    });
});

// SỬA: Bỏ "/products"
router.post("/edit/:id", async (req, res) => {
    const { name, price, quantity, categoryId } = req.body;
    await dynamoDB.send(new UpdateCommand({
        TableName: "products",
        Key: { id: req.params.id },
        UpdateExpression: "SET #n=:n, price=:p, quantity=:q, categoryId=:c",
        ExpressionAttributeNames: { "#n": "name" },
        ExpressionAttributeValues: {
            ":n": name,
            ":p": Number(price),
            ":q": Number(quantity),
            ":c": categoryId
        }
    }));
    res.redirect("/products");
});

/* ===================== DELETE ===================== */
// SỬA: Bỏ "/products", chỉ để "/delete/:id"
// URL thực tế: /products/delete/123
router.get("/delete/:id", async (req, res) => {
    try {
        await dynamoDB.send(new UpdateCommand({
            TableName: "products",
            Key: { id: req.params.id },
            UpdateExpression: "SET isDeleted = :d",
            ExpressionAttributeValues: { ":d": true }
        }));
        res.redirect("/products");
    } catch (err) {
        console.error(err);
        res.status(500).send("❌ Xóa thất bại");
    }
});

export default router;