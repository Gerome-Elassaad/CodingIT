import './globals.css'
import { AuthProvider, PostHogProvider, ThemeProvider } from './providers'
import { Toaster } from '@/components/ui/toaster'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Inter, Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";
import { GeistMono } from 'geist/font/mono'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Script from 'next/script'
import { cn } from '@/utils/cn'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});


export const metadata: Metadata = {
  metadataBase: new URL('https://codingit.vercel.app'),
  title: 'CodinIT.dev',
  keywords: [
    'AI software engineer',
    'open source',
    'live code execution',
    'file uploads',
    'real-time chat',
    'codinit',
    'codingit',
    'lovable.dev alternative',
    'bolt.new alternative',
    'v0.dev alternative'
  ],
  description: 'Open-source alternative to lovable.dev, bolt.new & v0.dev. AI software engineer — live code execution, file uploads, & real-time chat blazing-fast.',
  icons: [
    { rel: "icon", type: "image/x-icon", url: "/favicon.ico" },
  ],
  openGraph: {
    title: "CodinIT.dev",
    description: "Open-source alternative to lovable.dev, bolt.new & v0.dev. AI software engineer — live code execution, file uploads, & real-time chat blazing-fast.",
    images: ["/opengraph.png"],
    url: "https://codingit.vercel.app",
    siteName: "CodinIT.dev",
    type: "website",
    locale: "en_US",
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(GeistSans.variable, GeistMono.variable)}
    >
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8NNCCEN53X"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CV2G2EG0KJ');
          `}
        </Script>
        <Script id="posthog-init" strategy="afterInteractive">
          {`
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init Re Ms Fs Pe Rs Cs capture Ve calculateEventProperties Ds register register_once register_for_session unregister unregister_for_session zs getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty Ls As createPersonProfile Ns Is Us opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing is_capturing clear_opt_in_out_capturing Os debug I js getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
            posthog.init('phc_XiYZl1EamBghxnDqz8UQFv5AYMtVBX6XOZhSdMLIHMI', {
                api_host: 'https://us.i.posthog.com',
                defaults: '2025-05-24',
                person_profiles: 'identified_only',
            });
          `}
        </Script>
        <SpeedInsights />
        <Analytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            <AuthProvider>{children}</AuthProvider>
          </PostHogProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
