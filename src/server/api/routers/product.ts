import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const productRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.product.findMany();
  }),
  getUniqueProduct: publicProcedure.query(async ({ ctx }) => {
    const products = await ctx.prisma.product.findMany();
    const uniqueProducts = products.filter(
      (product, index, self) => index === self.findIndex((t) => t.ean === product.ean),
    );
    return uniqueProducts;
  }),
});
