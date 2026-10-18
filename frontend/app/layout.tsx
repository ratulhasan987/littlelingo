import "./globals.css";
export const metadata = {
  title: "LittleLingo | English Buddy",
  description: "A playful English learning buddy for kids",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
