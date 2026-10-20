import "dotenv/config";
import prisma from "../lib/prisma";

async function testDatabase(): Promise<void> {
  try {
    const result = await prisma.$queryRaw<Array<{ result: number }>>`SELECT 1 AS result`;

    if (result.length !== 1 || result[0].result !== 1) {
      throw new Error("The database returned an unexpected result.");
    }

    console.log("Database connection verified with SELECT 1.");
  } catch (error) {
    const errorCode =
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : undefined;

    console.error(
      "Database connection test failed:",
      errorCode ?? (error instanceof Error ? error.name : "Unknown error"),
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void testDatabase();
