const CracoAlias = require("craco-alias");
module.exports = {
plugins: [
    {
      plugin: CracoAlias,
      options: {
        aliases: {
          "@/components": "./src/components",
          "@/interfaces": "./src/interfaces",
	  "@/services": "./src/services",
          "@/store": "./src/store",
          "@/serviceWorker": "./src/serviceWorker",
          "@/style": "./src/style",
          "@/containers": "./src/containers",
          "@/hooks": "./src/hooks",
          "@/routes": "./src/routes",
          "@/constants": "./src/constants",
          "@/utils": "./src/utils",
          "@/static": "./src/static",
	}
      }
    }
  ],
  webpack: {
      configure: {
        resolve: {
          fallback: {
            "path": require.resolve("path-browserify")
          },
        },
      },
   },
}
