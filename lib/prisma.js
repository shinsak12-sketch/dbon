// lib/prisma.js
import { PrismaClient } from "@prisma/client";

let prisma;
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // 개발/핫리로드 보호
  if (!global.prisma) global.prisma = new PrismaClient();
  prisma = global.prisma;
}
export default prisma;
