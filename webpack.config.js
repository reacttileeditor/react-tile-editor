const HtmlWebPackPlugin = require("html-webpack-plugin");

//https://github.com/pinglinh/simple_webpack_boilerplate
//https://medium.freecodecamp.org/part-1-react-app-from-scratch-using-webpack-4-562b1d231e75


module.exports = {
	output: {
		publicPath: '/'
	},
	resolve: {
		// changed from extensions: [".js", ".jsx"]
		extensions: [".ts", ".tsx", ".js", ".jsx"]
	},
	module: {

		rules: [{
            test: /\.scss$/,
            use: [{
					loader: "style-loader"
				}, {
					loader: "css-loader"
				}, {
					loader: "sass-loader",
				}]
            },
			{
				test: /\.(t|j)sx?$/,
				exclude: /node_modules/,
				use: {
					loader: "awesome-typescript-loader",
					options: {
						useBabel: true,
						babelCore: "@babel/core",
					},
				}
			}
		]
	},
	plugins: [
		new HtmlWebPackPlugin({
			template: "./src/index.html",
			filename: "./index.html"
		})
	]
};