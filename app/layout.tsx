import "mapbox-gl/dist/mapbox-gl.css";
import React from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          color: "#f8fbff",
          background:
            "radial-gradient(circle at 10% 10%, #73d9ff 0%, #273469 30%, #121426 70%, #090b14 100%)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
