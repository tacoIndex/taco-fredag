import type { EanResponeDtos } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "~/server/db";
import { kasseLappEANResponseDto } from "./storeDataFromKasseLappenAPI";

const upsertRecords = async (productsFromKassaLapp: EanResponeDtos[]) => {
  const productsToUpdate = [];
  const productsToCreate = [];
  const productsToBeCreated: string[] = [];

  const productInformation = (await prisma.product.findMany()).reduce(
    (a, product) => ({
      ...a,
      [`${product.ean}_${product.store}`]: product.updatedAt,
    }),
    {}
  );

  for (const productFromKassaLapp of productsFromKassaLapp) {
    const { data: validatedPayload } = kasseLappEANResponseDto.parse(
      productFromKassaLapp.payload
    );

    for (const product of validatedPayload.products) {
      const ean = validatedPayload.ean;
      const productToInsertToDb = {
        ean,
        name: product.name,
        currentPrice: product.current_price.price,
        store: product.store.name,
        url: product.image,
        updatedAt: product.updated_at,
        extraData: "",
      };

      const key = `${validatedPayload.ean}_${product.store.name}`;
      const productUpdatedAt = new Date(product.updated_at);

      if (key in productInformation) {
        const internalProductUpdatedAt = new Date(
          productInformation[key as keyof typeof productInformation]
        );

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

  await prisma.product.createMany({
    data: productsToCreate,
  });
  for (const productToUpdate of productsToUpdate) {
    await prisma.product.update({
      where: {
        ean_store: {
          ean: productToUpdate.ean,
          store: productToUpdate.store,
        },
      },
      data: productToUpdate,
    });
  }
};

async function GET(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const eanResponseDtos = await prisma.eanResponeDtos.findMany({
    where: {
      processed: false,
    },
  });

  await upsertRecords(eanResponseDtos);

  await prisma.eanResponeDtos.updateMany({
    where: {
      id: { in: eanResponseDtos.map((eRD) => eRD.id) },
    },
    data: {
      processed: true,
    },
  });
  return res.status(200).json({ message: "Success!" });
}
export default GET;
