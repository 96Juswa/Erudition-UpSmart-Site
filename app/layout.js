// app/layout.js
import { Inter, Poppins, Montserrat } from "next/font/google";
import Providers from "./providers"; // ✅ Import the client wrapper
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: "variable",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: "variable",
});

export const metadata = {
  title: {
    default: "UPSMART",
    template: "%s | UPSMART",
  },
  description:
    "Web-based peer-to-peer service market platform for JRU students",
  icons: {
    icon: "/images/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
