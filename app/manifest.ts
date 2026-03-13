import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gorilla GYM",
    short_name: "GorillaGYM",
    description:
      "Sistema de gestión para Gorilla GYM - Control de alumnos, cuotas y rutinas",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#1a1a1a",
    orientation: "portrait",
    icons: [
      {
        src: "/android/android-launchericon-192-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android/android-launchericon-192-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/android/android-launchericon-512-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android/android-launchericon-512-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
