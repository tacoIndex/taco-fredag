import type { Product } from "@prisma/client";
import { prisma } from "~/server/db";
import Head from "next/head";
import Image from "next/image";
import type { NextPage } from "next";

const dateFormatter = Intl.DateTimeFormat("nb-NO", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

const Home: NextPage<{ products: Product[], lastUpdated:  number }> = ({ products, lastUpdated }) => {

  return (
    <>
      <Head>
        <title>Taco Index</title>
        <meta
          name="description"
          content="Finn ut hvor du skal kjøpe fredags tacoen din"
        />
        <link rel="icon" href="/favicon.png" />
      </Head> 
      <div className="min-h-screen bg-[url('../../public/120-padded-favicon.png')] bg-repeat-space bg-[length:60px]">
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FEEFDE] pt-5 md:pt-0  bg-opacity-90">
        <section className="w-3xl flex flex-col items-center">
          <div className="items-top mb-12 flex w-fit grow-0 flex-row  justify-center ">
            <span className="text-3xl">🌮</span>
            <h1 className="text-center text-3xl">
              Hvor skal jeg handle inn til tacofredag?
            </h1>
            <span className="text-3xl">🌮</span>
          </div>
          <article className="flex flex-col">
            <div className="mb-4 rounded-lg bg-[#FBE0C7] p-8 xl:mb-0 ">
              <p className=" mb-6 text-[#33373D]">
                <strong>I handlekurven</strong>
              </p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-5 md:gap-3">
                {products?.map((product) => {
                  return (
                    <div
                      key={product.id}
                      className="flex h-40 w-32 flex-col items-center gap-1 rounded-md bg-white p-2"
                    >
                      <div className="h-20 w-24">
                        <div className="relative h-full w-full">
                          <Image
                            alt={product.name}
                            src={product.url}
                            placeholder="empty"
                            fill
                            style={{ objectFit: "contain" }}
                          />
                        </div>
                      </div>
                      <p className="text-center text-xs text-[#454D60]">
                        {product.extraData}
                      </p>
                      <p className=" text-ellipsis	text-center	 text-sm">
                        {product.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="sm:self-end mb-4 self-center ">
              Sist oppdatert:
              {dateFormatter.format(
                new Date(lastUpdated)
              )}
            </p>
          </article>
        </section>
      </main>
      </div>
  
    </>
  );
};

export async function getStaticProps() {
  const products = await prisma.product.findMany();
  const uniqueProducts = products.filter(
    (product, index, self) =>
      index === self.findIndex((t) => t.ean === product.ean)
  );
  const fixedPaylods: unknown = JSON.parse(JSON.stringify(uniqueProducts))

  const lastUpdated = Math.max(...products.map(product => product.updatedAt.getTime()))

  return {
    props: {
      products: fixedPaylods,
      lastUpdated
    },
    revalidate: 43200,
  };
}

export default Home;
