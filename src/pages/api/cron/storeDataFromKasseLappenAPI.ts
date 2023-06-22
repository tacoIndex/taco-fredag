import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";

const priceDto = z.object({
  price: z.number(),
  date: z.string(),
});
export const kasseLappEANResponseDto = z.object({
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
          contains: z.enum(["YES", "NO", "UNKNOWN"]),
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

const getEanDataFromKassaLapp = async (ean: string) => {
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
    return [{ payload: res }, null];
  } catch (e) {
    console.error(e);
    return [null, "Could not store payloads"];
  }
};
// Todo - this should either be a POST or a PUT request to be a true RESTful API. Might have to consider changing it in the future.
async function GET(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const eans = [
    "7037203627263",
    "7038010014604",
    "7311311020599",
    "7311310031015",
    "7311312002112",
    "5713496000489",
    "3254474019274",
    "7031540001625",
    "7048840000456",
    "7040514501184",
  ];

  const payloads: Array<{payload: z.infer<typeof kasseLappEANResponseDto>}> = [];
  let anyFailure = false; 
  for (const ean of eans) {
    const [data, err] = await getEanDataFromKassaLapp(ean);
    if (err) {
      console.log(`Ean code ${ean} failed to store data fra KassaLapp, this implies corrupted data from the service provider`)
      anyFailure = true
      continue
    }
    payloads.push(data as {payload: z.infer<typeof kasseLappEANResponseDto>})
  }

  await prisma.eanResponeDtos.createMany({
    data: payloads
  });
  if (anyFailure){
    return res.status(200).json({message: "Some error occured"})
  }
  return res.status(200).json({ message: "Success!" });
}
export default GET;
