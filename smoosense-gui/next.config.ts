/** @type {import('next').NextConfig} */

const commonConfig = {
    // React Strict Mode causes intentional double execution to help catch bugs
    // Turn it off when optimize rendering performance
    reactStrictMode: true,
    
    webpack(config: any) {
        config.module.rules.push({
          test: /\.ya?ml$/,
          use: 'yaml-loader',
        });

        // Handle Plotly.js specific issues
        config.resolve.alias = {
            ...config.resolve.alias,
            'plotly.js/dist/plotly': 'plotly.js/dist/plotly.min.js',
            'plotly.js': 'plotly.js/dist/plotly.min.js'
        };

        // Ignore canvas module for Plotly (used for server-side rendering)
        config.externals = config.externals || [];
        if (!config.isServer) {
            config.externals.push({
                canvas: false,
                'canvas-prebuilt': false
            });
        }

        return config;
    }
}

const nextConfigDev = {
    ...commonConfig,
    rewrites: async () => {
        return [
        {
            source: '/api/:path*',
            destination: `http://127.0.0.1:8000/api/:path*`

        },
        ]
  },
};

const nextConfigProd = {
    ...commonConfig,
    output: 'export',
    productionBrowserSourceMaps: false,
    assetPrefix: process.env.ASSET_PREFIX,
    distDir: 'dist',

};

module.exports = process.env.NODE_ENV === 'development' ? nextConfigDev : nextConfigProd
