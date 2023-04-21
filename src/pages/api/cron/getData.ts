import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";

const priceDto = z.object({
  price: z.number(),
  date: z.string(),
});
const kasseLappEANResponseDto = z.object({
  data: z.object({
    ean: z.string(),
    products: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        vendor: z.string().nullable(),
        brand: z.string().nullable(),
        description: z.string().nullable(),
        ingredients: z.string().nullable(),
        url: z.string(),
        image: z.string(),
        store: z.object({
          name: z.string(),
          code: z.string(),
          url: z.string(),
          logo: z.string(),
        }),
        current_price: priceDto,
        price_history: z.array(priceDto).nullable(),
        kassalapp: z.object({
          url: z.string(),
          opengraph: z.string().nullable(),
        }),
        created_at: z.string().datetime(),
        updated_at: z.string().datetime(),
      })
    ),
    allergens: z
      .array(
        z.object({
          code: z.string(),
          display_name: z.string(),
          contains: z.enum(["YES", "NO"]),
        })
      )
      .nullable(),
    nutrition: z
      .array(
        z.object({
          code: z.string(),
          display_name: z.string(),
          amount: z.number(),
          unit: z.string(),
        })
      )
      .nullable(),
  }),
});

const storeDataforEanFromKasseLappenToDb = async (ean: string) => {
  try {
    const apiResponse = await fetch(
      "https://kassal.app/api/v1/products/ean/" + ean,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.KASSE_LAPPEN_API_KEY}`,
        },
      }
    );
    const data: unknown = await apiResponse.json();
    const res = await kasseLappEANResponseDto.parseAsync(data);
    //TODO Endre, be good boy 🐶
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await prisma.eanResponeDtos.create({
      data: {
        payload: res,
      },
    });
    return res;
  } catch (e) {
    console.error(e);
  }
};

async function GET(_: NextApiRequest, res: NextApiResponse) {
  const eans = ["7037204177125"];
  for (const ean of eans) {
    await storeDataforEanFromKasseLappenToDb(ean);
  }
  return res.status(200).json({ message: "Success!" });
}
export default GET;
