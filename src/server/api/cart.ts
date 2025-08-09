import type { Product } from "@prisma/client";
import { prisma } from "~/server/db";

export type CartStorePrice = { name: string; price: number; offset: number };

export const getCartPrices = async (): Promise<CartStorePrice[]> => {
  const products: Product[] = await prisma.product.findMany();

  const groupedDto = products.reduce<Record<string, number[]>>((acc, obj) => {
    const key = obj.ean;
    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key]?.push(obj.currentPrice);
    return acc;
  }, {});

  const averagePrices: Record<string, number> = {};
  for (const [ean, prices] of Object.entries(groupedDto)) {
    const averagePrice = (prices as number[]).reduce((a, b) => a + b, 0) / prices.length;

    averagePrices[ean] = averagePrice;
  }

  const uniqueProducts = products.filter(
    (product: Product, index: number, self: Product[]) =>
      index === self.findIndex((t) => t.ean === product.ean),
  );

  const uniqueStores = products.filter(
    (product: Product, index: number, self: Product[]) =>
      index === self.findIndex((t) => t.store === product.store),
  );

  const uniqueStoresWithCartPrice = uniqueStores.map((store: Product) => {
    const storeName = store.store;
    const priceList = uniqueProducts.map((product: Product) => {
      const ean = product.ean;
      const productPrice = products.find(
        (product: Product) => product.ean === ean && product.store === storeName,
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
