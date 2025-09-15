export const metadata = {
  title: "HDR · Recherche commerciale",
  description: "Interface Customer Success – recherche commerciale HDR"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: "#f8fafc" }}>{children}</body>
    </html>
  );
}
