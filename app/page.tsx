export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-4 px-8 text-center">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Vivienda — Colsubsidio
        </h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          Scaffold del MVP. La landing del jurado y el chat llegan en el
          siguiente commit.
        </p>
      </main>
    </div>
  );
}
