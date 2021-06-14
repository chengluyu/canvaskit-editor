import merge from "webpack-merge";
import common from "./webpack";

export default merge(common, {
  mode: "production",
  devtool: "source-map",
});
