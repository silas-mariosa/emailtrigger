/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilitar modo standalone para Docker
  output: "standalone",

  // Configurações de segurança
  poweredByHeader: false,

  // Configurações de imagens
  images: {
    domains: ["localhost", "smartgabinete.com.br"],
    unoptimized: false,
  },

  // Configurações de headers de segurança
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
