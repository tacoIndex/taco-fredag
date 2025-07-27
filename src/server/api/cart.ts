import { prisma } from "~/server/db";

interface StorePrice {
  name: string;
  price: number;
  offset?: number;
}

export const getCartPrices = async (): Promise<StorePrice[]> => {
  // Fetch all products with optimized query
  const products = await prisma.product.findMany({
    select: {
      ean: true,
      store: true,
      currentPrice: true,
      name: true,
      url: true,
      extraData: true,
    },
  });

  // Create a Map for O(1) lookups instead of multiple array operations
  const productsByEanStore = new Map<string, (typeof products)[0]>();
  const eanSet = new Set<string>();
  const storeSet = new Set<string>();

  for (const product of products) {
    productsByEanStore.set(`${product.ean}_${product.store}`, product);
    eanSet.add(product.ean);
    storeSet.add(product.store);
  }

  // Calculate average prices per EAN more efficiently
  const averagePrices = new Map<string, number>();
  for (const ean of eanSet) {
    const eanProducts = products.filter((p) => p.ean === ean);
    const avgPrice = eanProducts.reduce((sum, p) => sum + p.currentPrice, 0) / eanProducts.length;
    averagePrices.set(ean, avgPrice);
  }

  // Calculate cart prices for each store
  const storePrices: StorePrice[] = [];

  for (const store of storeSet) {
    let totalPrice = 0;

    for (const ean of eanSet) {
      const product = productsByEanStore.get(`${ean}_${store}`);
      // Use actual price if available, otherwise use average
      totalPrice += product?.currentPrice ?? averagePrices.get(ean) ?? 0;
    }

    storePrices.push({
      name: store,
      price: totalPrice,
    });
  }

  // Sort by price and calculate offsets
  storePrices.sort((a, b) => a.price - b.price);
  const lowestPrice = storePrices[0]?.price ?? 0;

  return storePrices.map((store) => ({
    ...store,
    offset: store.price - lowestPrice,
  }));
};

// Get unique products for display
export const getUniqueProducts = async () => {
  const products = await prisma.product.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    distinct: ["ean"],
  });

  return products;
};
