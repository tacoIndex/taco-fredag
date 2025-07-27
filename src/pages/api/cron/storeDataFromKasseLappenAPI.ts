import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
import { AppError, withErrorHandler } from "~/utils/error-handler";
import { logger } from "~/utils/logger";

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
      }),
    ),
    allergens: z
      .array(
        z.object({
          code: z.string(),
          display_name: z.string(),
          contains: z.enum(["YES", "NO", "UNKNOWN"]),
        }),
      )
      .nullable(),
    nutrition: z
      .array(
        z.object({
          code: z.string(),
          display_name: z.string(),
          amount: z.number(),
          unit: z.string(),
        }),
      )
      .nullable(),
  }),
});

const getEanDataFromKassaLapp = async (ean: string) => {
  try {
    const apiResponse = await fetch(`https://kassal.app/api/v1/products/ean/${ean}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.KASSE_LAPPEN_API_KEY}`,
      },
    });

    if (!apiResponse.ok) {
      throw new Error(`API returned ${apiResponse.status}: ${apiResponse.statusText}`);
    }

    const data: unknown = await apiResponse.json();
    const res = await kasseLappEANResponseDto.parseAsync(data);
    return [{ payload: res }, null];
  } catch (e) {
    logger.error(`Failed to fetch EAN ${ean} from KassaLapp`, e);
    return [null, e instanceof Error ? e.message : "Could not fetch data"];
  }
};
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    throw new AppError("Method not allowed", 405);
  }

  logger.info("Starting KassaLapp data fetch cron job");

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

  // Fetch all EAN data in parallel for better performance
  const eanPromises = eans.map(async (ean) => {
    const [data, err] = await getEanDataFromKassaLapp(ean);
    return { ean, data, err };
  });

  const results = await Promise.all(eanPromises);

  const payloads: Array<{ payload: z.infer<typeof kasseLappEANResponseDto> }> = [];
  let anyFailure = false;

  for (const { ean, data, err } of results) {
    if (err) {
      console.error(`Ean code ${ean} failed to store data from KassaLapp: ${err}`);
      anyFailure = true;
      continue;
    }
    if (data) {
      payloads.push(data as { payload: z.infer<typeof kasseLappEANResponseDto> });
    }
  }

  if (payloads.length > 0) {
    await prisma.eanResponeDtos.createMany({
      data: payloads,
    });
    logger.info(`Stored ${payloads.length} EAN responses`);
  }

  if (anyFailure) {
    logger.warn("Some EAN codes failed to fetch", {
      totalEans: eans.length,
      successCount: payloads.length,
    });
    return res.status(200).json({
      message: "Partial success",
      processed: payloads.length,
      failed: eans.length - payloads.length,
    });
  }

  return res.status(200).json({
    message: "Success!",
    processed: payloads.length,
  });
}

export default withErrorHandler(handler);
