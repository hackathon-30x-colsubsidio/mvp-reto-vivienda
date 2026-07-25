import type { Metadata } from "next";
import { Sora, Work_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Las tres fuentes del design system. `next/font` las auto-hospeda desde
// el propio dominio: el `@import` a fonts.googleapis.com que trae
// `tokens/typography.css` sería una petición a un CDN externo en el
// primer pintado del demo.
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vivienda — Colsubsidio",
  description: "Curado de leads de vivienda — hackathon Colsubsidio × 30X",
};

// Fija `data-theme` antes del primer pintado. Sin esto la página arranca en
// claro y salta al oscuro cuando hidrata React: un flash de tema equivocado
// justo en el arranque del demo. Va como script inline porque tiene que
// correr antes de que el navegador pinte, no después de la hidratación.
const GUION_TEMA = `(function(){try{var t=localStorage.getItem("tema");if(t!=="claro"&&t!=="oscuro"){t=matchMedia("(prefers-color-scheme: dark)").matches?"oscuro":"claro"}document.documentElement.dataset.theme=t==="oscuro"?"dark":"light"}catch(e){document.documentElement.dataset.theme="light"}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${sora.variable} ${workSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      // El script de arriba escribe `data-theme` antes de que React hidrate,
      // así que el <html> del cliente nunca va a coincidir con el del
      // servidor. Es el único atributo que difiere y es deliberado.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: GUION_TEMA }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
