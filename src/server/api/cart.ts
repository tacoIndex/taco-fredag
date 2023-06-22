import { z } from "zod";
import { prisma } from "~/server/db";

export const getCartPrices = async () => {
  const products = await prisma.product.findMany();

  const groupedDto = products.reduce(
    (acc: { [key: string]: number[] }, obj) => {
      const key = obj.ean;
      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key]!.push(obj.currentPrice);
      return acc;
    },
    {}
  );

  const averagePrices: { [key: string]: number } = {};
  Object.entries(groupedDto).forEach(([ean, prices]) => {
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    averagePrices[ean] = averagePrice;
  });

  const uniqueProducts = products.filter(
    (product, index, self) =>
      index === self.findIndex((t) => t.ean === product.ean)
  );

  const uniqueStores = products.filter(
    (product, index, self) =>
      index === self.findIndex((t) => t.store === product.store)
  );

  const uniqueStoresWithCartPrice = uniqueStores.map((store) => {
    const storeName = store.store;
    const priceList = uniqueProducts.map((product) => {
      const ean = product.ean;
      const productPrice = products.find(
        (product) => product.ean === ean && product.store === storeName
      )?.currentPrice;

      return productPrice ?? averagePrices[ean] ?? 0;
    });

    const price = priceList?.reduce((a, b) => a + b, 0);

    return {
      name: storeName,
      price,
    };
  });

  const sortedStores = uniqueStoresWithCartPrice.sort((a, b) => {
    return a.price - b.price;
  });
  const lowestCartPriceStore = sortedStores[0]?.price;
  const cartPrices = uniqueStoresWithCartPrice.map((store) => {
    return { ...store, offset: store.price - (lowestCartPriceStore || 0) };
  });

  return cartPrices;
};

const currentCartPriceDto = z.object({
  price: z.number(),
  store: z.string(),
  offset: z.number(),
});
