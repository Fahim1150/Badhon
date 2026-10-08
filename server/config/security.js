const crypto = require("crypto");

let developmentSecret;

const getJwtSecret = () => {
    if (process.env.JWT_SECRET) {
        return process.env.JWT_SECRET;
    }

    if (process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET must be set in production");
    }

    developmentSecret ||= crypto.randomBytes(32).toString("hex");
    return developmentSecret;
};

const validateProductionEnvironment = () => {
    if (process.env.NODE_ENV !== "production") {
        return;
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error("Production JWT_SECRET must contain at least 32 characters");
    }

    const mongoUri = new URL(process.env.MONGO_URI || "");

    if (
        !["mongodb:", "mongodb+srv:"].includes(mongoUri.protocol) ||
        !mongoUri.username ||
        !mongoUri.password
    ) {
        throw new Error("Production MONGO_URI must use authenticated MongoDB credentials");
    }

    const appOrigin = new URL(process.env.APP_ORIGIN || "");

    if (
        appOrigin.protocol !== "https:" ||
        ["localhost", "127.0.0.1"].includes(appOrigin.hostname)
    ) {
        throw new Error("Production APP_ORIGIN must be a public HTTPS origin");
    }
};

module.exports = { getJwtSecret, validateProductionEnvironment };