import dynamoDB from "../db/dynamodb.js";
import { ScanCommand, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export const ProductRepo = {
    // Lấy toàn bộ sản phẩm (Raw data)
    getAll: async () => {
        const result = await dynamoDB.send(new ScanCommand({ TableName: "products" }));
        return result.Items || [];
    },

    // Lấy 1 sản phẩm theo ID
    getById: async (id) => {
        const result = await dynamoDB.send(new GetCommand({
            TableName: "products",
            Key: { id }
        }));
        return result.Item;
    },

    // Tạo mới
    create: async (item) => {
        await dynamoDB.send(new PutCommand({
            TableName: "products",
            Item: item
        }));
        return item;
    },

    // Cập nhật
    update: async (id, data) => {
        const { name, price, quantity, categoryId } = data;
        await dynamoDB.send(new UpdateCommand({
            TableName: "products",
            Key: { id },
            UpdateExpression: "SET #n=:n, price=:p, quantity=:q, categoryId=:c",
            ExpressionAttributeNames: { "#n": "name" },
            ExpressionAttributeValues: {
                ":n": name,
                ":p": Number(price),
                ":q": Number(quantity),
                ":c": categoryId
            }
        }));
    },

    // Xóa mềm
    softDelete: async (id) => {
        await dynamoDB.send(new UpdateCommand({
            TableName: "products",
            Key: { id },
            UpdateExpression: "SET isDeleted = :d",
            ExpressionAttributeValues: { ":d": true }
        }));
    }
};