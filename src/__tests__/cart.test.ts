import { getCartPrices } from "~/server/api/cart";
import { prisma } from "~/server/db";

// Mock Prisma
jest.mock("~/server/db", () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
    },
  },
}));

describe("Cart API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCartPrices", () => {
    it("should calculate cart prices correctly", async () => {
      const mockProducts = [
        { ean: "123", store: "Rema 1000", currentPrice: 20.5, name: "Product 1" },
        { ean: "123", store: "Kiwi", currentPrice: 22.0, name: "Product 1" },
        { ean: "456", store: "Rema 1000", currentPrice: 15.0, name: "Product 2" },
        { ean: "456", store: "Kiwi", currentPrice: 14.5, name: "Product 2" },
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const result = await getCartPrices();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: "Rema 1000",
        price: 35.5,
        offset: 0,
      });
      expect(result[1]).toEqual({
        name: "Kiwi",
        price: 36.5,
        offset: 1,
      });
    });

    it("should handle missing products with average price", async () => {
      const mockProducts = [
        { ean: "123", store: "Rema 1000", currentPrice: 20.0, name: "Product 1" },
        { ean: "123", store: "Kiwi", currentPrice: 30.0, name: "Product 1" },
        // Missing product 456 for Kiwi
        { ean: "456", store: "Rema 1000", currentPrice: 10.0, name: "Product 2" },
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const result = await getCartPrices();

      // Average price for product 456 should be 10.0
      expect(result[0]).toEqual({
        name: "Rema 1000",
        price: 30.0,
        offset: 0,
      });
      expect(result[1]).toEqual({
        name: "Kiwi",
        price: 40.0, // 30 + 10 (average)
        offset: 10.0,
      });
    });

    it("should handle empty product list", async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getCartPrices();

      expect(result).toEqual([]);
    });
  });
});
