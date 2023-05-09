import { EanResponeDtos } from "@prisma/client";
import { prisma } from "~/server/db";
import { NextApiRequest, NextApiResponse } from "next";
import { kasseLappEANResponseDto } from "./storeDataFromKasseLappenAPI";

const upsertRecord = async (productsFromKassaLapp: EanResponeDtos) => {
  const validatedProducts = await kasseLappEANResponseDto.parseAsync(
    productsFromKassaLapp.payload
  );

  for await (const validatedProduct of validatedProducts.data.products) {
    await prisma.product.upsert({
      where: {
        ean_store: {
          ean: validatedProducts.data.ean,
          store: validatedProduct.store.name,
        },
      },
      update: { currentPrice: validatedProduct.current_price.price },
      create: {
        ean: validatedProducts.data.ean,
        //TODO Trim the name properly
        name: validatedProduct.name,
        currentPrice: validatedProduct.current_price.price,
        store: validatedProduct.store.name,
        url: validatedProduct.image,
        // put the extra info from name, and other fields, onto this one.
        extraData: "",
      },
    });

    await prisma.eanResponeDtos.update({
      where: { id: productsFromKassaLapp.id },
      data: { processed: true },
    });
  }
};

async function PUT(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const eanResponseDtos = await prisma.eanResponeDtos.findMany({
    take: 10,
    where: { processed: false },
  });
  for await (const eanResponseDto of eanResponseDtos) {
    await upsertRecord(eanResponseDto);
  }
  return res.status(200).json({ message: "Success!" });
}
export default PUT;
