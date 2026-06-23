import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "@/lib/i18n-server";
import { LocaleProvider } from "@/components/locale-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.APP_URL ?? "https://viciral.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Viciral — AI studio za sadržaj",
    template: "%s · Viciral",
  },
  description:
    "Viciral spaja Claude, Nano Banana i Seedance na jednom mestu — sadržaj za društvene mreže, cinematic video, avatare, brend identitet i sajtove.",
  applicationName: "Viciral",
  keywords: [
    "AI studio",
    "AI sadržaj",
    "social media",
    "cinematic video",
    "brand kit",
    "Claude",
    "Nano Banana",
    "Seedance",
  ],
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: "Viciral",
    title: "Viciral — napravi ono što sam ne možeš",
    description:
      "AI studio koji spaja više modela: social paket, cinematic video, avatari, brand kit i sajtovi.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Viciral — AI studio za sadržaj",
    description:
      "Spoji više AI modela na jednom mestu: social paket, cinematic video, brand kit i sajtovi.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#0a0a0f] text-zinc-100">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
