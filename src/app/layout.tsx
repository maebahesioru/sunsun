import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const siteUrl =
  process.env.SITE_URL || "https://sunsunsunday.hikamer.f5.si";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "マニアスプレッダーのサンサンサンデー2026 野獣の日スペシャル",
    template: "%s | マニアスプレッダーのサンサンサンデー2026",
  },
  description:
    "マニアスプレッダーのサンサンサンデー2026公式サイト。2026年8月10日（月）19時より@maebahesioru2のXスペースで開催。ヒカマー界隈の音MAD・VTuber楽曲・不謹慎系音声まで何でもありのオールナイト音楽リクエスト配信。",
  keywords: [
    "サンサンサンデー",
    "マニアスプレッダー",
    "ヒカマー",
    "ヒカマニ",
    "音MAD",
    "Xスペース",
    "音楽リクエスト",
    "野獣の日",
    "maebahesioru2",
    "オールナイト",
  ],
  authors: [{ name: "@maebahesioru2", url: "https://x.com/maebahesioru2" }],
  creator: "@maebahesioru2",
  publisher: "マニアスプレッダーのサンサンサンデー実行委員会",
  applicationName: "マニアスプレッダーのサンサンサンデー2026",
  category: "音楽配信イベント",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: "マニアスプレッダーのサンサンサンデー2026",
    title: "マニアスプレッダーのサンサンサンデー2026 野獣の日スペシャル",
    description:
      "2026年8月10日（月）19時より@maebahesioru2のXスペースで開催！ヒカマー界隈のオールナイト音楽リクエスト配信。",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "マニアスプレッダーのサンサンサンデー2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@maebahesioru2",
    creator: "@maebahesioru2",
    title: "マニアスプレッダーのサンサンサンデー2026 野獣の日スペシャル",
    description:
      "2026年8月10日（月）19時より@maebahesioru2のXスペースで開催！リクエスト受付中！",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      ja: siteUrl,
      "ja-JP": siteUrl,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MusicEvent",
              name: "マニアスプレッダーのサンサンサンデー2026 野獣の日スペシャル",
              startDate: "2026-08-10T19:00:00+09:00",
              endDate: "2026-08-11T23:00:00+09:00",
              eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
              eventStatus: "https://schema.org/EventScheduled",
              location: {
                "@type": "VirtualLocation",
                url: "https://x.com/i/spaces/1rGmqpqpjngGy",
              },
              description:
                "マニアスプレッダーのサンサンサンデー2026 野獣の日スペシャル。@maebahesioru2のXスペースで開催するオールナイト音楽リクエスト配信。ヒカマー界隈の音MAD・VTuber楽曲・不謹慎系音声まで何でもあり。",
              organizer: {
                "@type": "Organization",
                name: "マニアスプレッダーのサンサンサンデー実行委員会",
                url: "https://x.com/maebahesioru2",
              },
              image: `${siteUrl}/og.png`,
              url: siteUrl,
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "マニアスプレッダーのサンサンサンデー2026",
              alternateName: "サンサンサンデー2026 野獣の日スペシャル",
              url: siteUrl,
              inLanguage: "ja",
            }),
          }}
        />
        <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
              <span className="text-xl">🐗</span>
              <span className="text-sm sm:text-base">
                サンサンサンデー<span className="text-amber-400">2026</span>
                <span className="ml-1 hidden text-xs text-zinc-400 sm:inline">野獣の日スペシャル</span>
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-zinc-300 transition hover:text-amber-400">
                説明
              </Link>
              <Link
                href="/timetable"
                className="rounded-full bg-amber-500 px-4 py-1.5 font-semibold text-zinc-950 transition hover:bg-amber-400"
              >
                番組表
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-500">
          <p>マニアスプレッダーのサンサンサンデー2026 野獣の日スペシャル</p>
          <p className="mt-1">主催: @maebahesioru2 ／ 音楽再生: @okubahesioru</p>
        </footer>
      </body>
    </html>
  );
}
