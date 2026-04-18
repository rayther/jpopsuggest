import { defineConfig } from "@apps-in-toss/web-framework/config";

const devHost = process.env.AIT_DEV_HOST ?? "localhost";

export default defineConfig({
  appName: "jpopsuggest",
  brand: {
    displayName: "제이팝추천",
    primaryColor: "#F06292",
    icon: "file:///C:/Users/User/Desktop/AppInToss/Jpop.png",
  },
  web: {
    host: devHost,
    port: 5173,
    commands: {
      dev: "vite --host 0.0.0.0",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
