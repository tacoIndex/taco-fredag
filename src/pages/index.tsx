import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { api } from "~/utils/api";
const dateFormatter = Intl.DateTimeFormat("nb-NO", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

const Home: NextPage = () => {
  const { data: products } = api.product.getUniqueProduct.useQuery();

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
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FEEFDE]">
        <section className="w-3xl flex flex-col items-center">
          <div className="items-top mb-12 flex w-fit grow-0 flex-row justify-center gap-0  ">
            <span className="text-3xl">🌮</span>
            <h1 className="text-center text-3xl">
              Hvor skal jeg handle inn til tacofredag?
            </h1>
            <span className="text-3xl">🌮</span>
          </div>
          <article className="flex flex-col rounded-lg bg-[#FBE0C7] p-8">
            <p className=" mb-6 text-[#33373D]">
              <strong>I handlekurven</strong>
            </p>
            <div className="grid grid-cols-5 gap-3">
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
                          layout="fill"
                          objectFit="contain"
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
          </article>
          <p className=" self-end ">
            Sist oppdatert: {dateFormatter.format(products?.at(0)?.updatedAt)}
          </p>
        </section>
      </main>
    </>
  );
};

export default Home;
