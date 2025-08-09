import type { EanResponeDtos } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "~/server/db";
import { pingDb, withDbRetries } from "~/server/db-utils";
import { kasseLappEANResponseDto } from "./storeDataFromKasseLappenAPI";

const upsertRecords = async (productsFromKassaLapp: EanResponeDtos[]) => {
  const productsToUpdate = [];
  const productsToCreate = [];
  const productsToBeCreated: string[] = [];

  const productInformation: Record<string, Date> = {};
  const existingProducts = await withDbRetries(() => prisma.product.findMany());
  for (const product of existingProducts) {
    productInformation[`${product.ean}_${product.store}`] = product.updatedAt;
  }

  for (const productFromKassaLapp of productsFromKassaLapp) {
    const { data: validatedPayload } = kasseLappEANResponseDto.parse(productFromKassaLapp.payload);

    for (const product of validatedPayload.products) {
      // Skip entries missing essential data
      if (!product.store || !product.current_price || !product.image) continue;
      const ean = validatedPayload.ean;
      const productToInsertToDb = {
        ean,
        name: product.name,
        currentPrice: product.current_price.price,
        store: product.store.name,
        url: product.image,
        // Ensure Date type for Prisma
        updatedAt: new Date(product.updated_at),
        extraData: "",
      };

      const key = `${validatedPayload.ean}_${product.store.name}`;
      const productUpdatedAt = new Date(product.updated_at);

      if (key in productInformation) {
        const storedDate = productInformation[key];
        if (!storedDate) continue;
        const internalProductUpdatedAt = new Date(storedDate);

        if (productUpdatedAt > internalProductUpdatedAt) {
          productsToUpdate.push(productToInsertToDb);
        }

        continue;
      }

      if (!productsToBeCreated.includes(key)) {
        productsToBeCreated.push(key);
        productsToCreate.push(productToInsertToDb);
      }
    }
  }

  await withDbRetries(() =>
    prisma.product.createMany({
      data: productsToCreate,
      skipDuplicates: true,
    }),
  );
  for (const productToUpdate of productsToUpdate) {
    await withDbRetries(() =>
      prisma.product.update({
        where: {
          ean_store: {
            ean: productToUpdate.ean,
            store: productToUpdate.store,
          },
        },
        data: productToUpdate,
      }),
    );
  }
};

async function GET(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Wake DB if provider auto-sleeps (e.g., Neon serverless)
    await pingDb();

    const eanResponseDtos = await withDbRetries(() =>
      prisma.eanResponeDtos.findMany({
        where: {
          processed: false,
        },
      }),
    );

    await upsertRecords(eanResponseDtos);

    const updated = await withDbRetries(() =>
      prisma.eanResponeDtos.updateMany({
        where: {
          id: { in: eanResponseDtos.map((eRD) => eRD.id) },
        },
        data: {
          processed: true,
        },
      }),
    );

    // Trigger ISR revalidation after data update
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:${process.env.PORT ?? 3000}`;

      const revalidateUrl = `${baseUrl}/api/revalidate?secret=${process.env.REVALIDATION_SECRET}`;
      await fetch(revalidateUrl);
    } catch (error) {
      console.error("Failed to trigger revalidation:", error);
    }

    return res.status(200).json({ message: "Success!", processed: updated.count });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Processing error:", error);
    return res.status(500).json({ message: "Failed to process payloads", error: message });
  }
}
export default GET;
