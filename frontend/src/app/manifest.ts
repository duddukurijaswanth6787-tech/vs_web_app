import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vasanthi's Signature",
    short_name: "VS Signature",
    description: "Premium Women's Ethnic Wear & Designer Fashion",
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#7c3aed",
    icons: [
      {
        src: "/brand/logo-icon.png",
        sizes: "any",
        type: "image/png",
      },
      {
        src: "/brand/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
