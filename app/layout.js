export const metadata = {
  title: "HESTIA · Recherche commerciale",
  description: "Interface HESTIA – recherche commerciale"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: "#f8fafc" }}>{children}</body>
    </html>
  );
}
