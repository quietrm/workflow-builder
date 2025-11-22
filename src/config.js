export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

  export default {
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };