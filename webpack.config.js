const HtmlWebPackPlugin = require("html-webpack-plugin");

//https://github.com/pinglinh/simple_webpack_boilerplate
//https://medium.freecodecamp.org/part-1-react-app-from-scratch-using-webpack-4-562b1d231e75


module.exports = {
	output: {
		publicPath: '/'
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
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader"
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