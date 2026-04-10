export default defineConfig({
  root: "demo",
  base: "/jule-ai-energy/",
  plugins: [react()],
  build: {
    outDir: "dist", // ../ を消して、demo/dist に作らせる
    emptyOutDir: true,
  }
})
