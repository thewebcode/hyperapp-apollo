import typescript from "rollup-plugin-typescript2"
import uglify from "rollup-plugin-uglify"

export default [
    {
        input: "./src/index.ts",
        output: {
            file: "./dist/index.js",
            format: "cjs",
            sourcemap: true,
            external: [
                "hyperapp"
            ]
        },
        plugins: [
            typescript({
                compilerOptions: {
                    declaration: true,
                },
            }),
        ]
    },
    {
        input: "./src/index.ts",
        output: {
            file: "./dist/index.mjs",
            format: "es",
            sourcemap: true,
            external: [
                "hyperapp"
            ]
        },
        plugins: [
            typescript({
                compilerOptions: {
                    declaration: true,
                },
            }),
        ]
    },
    {
        input: "./src/index.ts",
        output: {
            file: "./dist/hyperapp-apollo.js",
            format: "umd",
            name: "HyperappApollo",
            sourcemap: false,
            external: [
                "hyperapp",
            ]
        },
        plugins: [
            typescript({
                compilerOptions: {
                    declaration: false,
                }
            })
        ]
    },
    {
        input: "./src/index.ts",
        output: {
            file: "./dist/hyperapp-apollo.min.js",
            format: "umd",
            name: "HyperappApollo",
            sourcemap: false,
            external: [
                "hyperapp",
            ]
        },
        plugins: [
            typescript({
                compilerOptions: {
                    declaration: false,
                }
            }),
            uglify(),
        ]
    }
]
