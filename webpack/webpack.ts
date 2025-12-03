import * as webpack from "webpack";
import type { Configuration as DevServerConfiguration } from "webpack-dev-server";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import path from "path";
import { fonts } from "../shared/fonts";

const projectRootPath = path.resolve(__dirname, "..");
const root = path.join.bind(null, projectRootPath);
const src = path.join.bind(null, root("src"));
const dist = path.join.bind(null, root("dist"));

const config: webpack.Configuration & {
  devServer?: DevServerConfiguration;
} = {
  mode: "development",
  entry: {
    main: src("index.ts"),
  },
  devServer: {
    static: {
      directory: dist(),
    },
    hot: true,
  },
  devtool: "inline-source-map",
  output: {
    path: dist(),
    filename: "[name].[fullhash].js",
    publicPath: "/",
  },
  resolve: {
    alias: {},
    fallback: {
      fs: false,
      path: false,
    },
    extensions: ["...", ".ts"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/i,
        loader: "ts-loader",
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: src("index.html"),
      filename: "index.html",
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "node_modules/canvaskit-wasm/bin/canvaskit.wasm",
          to: "canvaskit.wasm",
        },
        ...fonts.map((x) => ({ from: x.filePath, to: x.runtimeFileName })),
      ],
    }),
  ],
};

export default config;
