var path = require('path')
var webpack = require('webpack')
/*
extract-text-webpack-plugin插件，
有了它就可以将你的样式提取到单独的css文件里，
妈妈再也不用担心样式会被打包到js文件里了。
 */
var ExtractTextPlugin = require('extract-text-webpack-plugin')
/*
html-webpack-plugin插件，重中之重，webpack中生成HTML的插件，
具体可以去这里查看https://www.npmjs.com/package/html-webpack-plugin
 */
var HtmlWebpackPlugin = require('html-webpack-plugin')

//文件模块
var fs = require('fs');
var travel = function(dir, callback){
  fs.readdirSync(dir).forEach(function (file) {
    var pathname = path.join(dir, file);
    //如果是一个目录
    if (fs.statSync(pathname).isDirectory()) {
      travel(pathname, callback);
    } else {
      callback(pathname);
    }
  });
}
var travelHtml = function(dir, callback){
  fs.readdirSync(dir).forEach(function (file) {
    var pathname = path.join(dir, file);
    //如果是一个目录
    if (fs.statSync(pathname).isDirectory()) {
      // travel(pathname, callback);
    } else {
      callback(pathname);
    }
  });
}


//获取全部入口,打包全部
var getAllEntry = function(){
  var files = {};
  var jsPath = path.resolve('./src/js/page');
  var entrypathName = [];
  travel(jsPath, function (pathName) {
    if (/.js/.test(pathName)) {
      var fileName = pathName.split('\\');
      fileName = fileName[fileName.length - 1];
      //mac & linux
      var travelpath = pathName.split('\/');
      //windows
      travelpath = (travelpath.length > 1) ? travelpath : pathName.split('\\');
      var entrypath = '';
      if (travelpath.length > 1) {
        entrypath = (fileName.split('.'))[0];
        files[entrypath] = './src/js/page/'+fileName;
        entrypathName.push(entrypath);
      }
    }
  });
  return {
    files:files,
    filesName:entrypathName
  };
}
//获取入口文件和需要提前公共的
var allEntry = getAllEntry();

function newHtmlWebpackPlugin () {
  var htmlPath = path.resolve('./src/view');
  var HtmlWebpack = [];
  travelHtml(htmlPath,function (pathName) {
    var fileName = pathName.split('\\');
    fileName = fileName[fileName.length - 1];
    console.log(pathName,"pathName-->");
    HtmlWebpack.push(new HtmlWebpackPlugin({ // 根据模板插入css/js等生成最终HTML
      favicon: './src/img/favicon.ico', // favicon路径，通过webpack引入同时可以生成hash值
      filename: './'+(fileName.split('.'))[0]+'.html', // 生成的html存放路径，相对于path
      template: './src/view/'+fileName, // html模板路径
      inject: true, // js插入的位置，true/'head'/'body'/false
      hash: false, // 如果为true为静态资源生成hash值
      chunks: ['vendors', (fileName.split('.'))[0]], // 需要引入的chunk，不配置就会引入所有页面的资源
      minify: { // 压缩HTML文件
        removeComments: true, // 移除HTML中的注释
        collapseWhitespace: false // 删除空白符与换行符
      }
    }))
  });
  return HtmlWebpack;
}


module.exports = {
  // 配置入口文件，有几个写几个
  entry: allEntry.files,
  output: {
    path: path.join(__dirname, 'dist'), // 输出目录的配置，模板、样式、脚本、图片等资源的路径配置都相对于它
    publicPath: '',       // 模板、样式、脚本、图片等资源对应的server上的路径
    filename: 'js/[name].js',     // 每个页面对应的主js的生成配置
    chunkFilename: 'js/[id].chunk.js'   // chunk生成的配置
  },
  module: {
    // 加载器，关于各个加载器的参数配置，可自行搜索之。
    loaders: [
      {
        test: /\.css$/,
        // 配置css的抽取器、加载器。'-loader'可以省去
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
      }, {
        test: /\.less$/,
        // 配置less的抽取器、加载器。中间!有必要解释一下，
        // 根据从右到左的顺序依次调用less、css加载器，前一个的输出是后一个的输入
        // 你也可以开发自己的loader哟。有关loader的写法可自行谷歌之。
        loader: ExtractTextPlugin.extract('css!less')
      }, {
        // 图片加载器，雷同file-loader，更适合图片，可以将较小的图片转成base64，减少http请求
        // 如下配置，将小于8192byte的图片转成base64码
        test: /\.(png|jpg|gif)$/,
        // loader: 'file-loader?limit=8192&name=./img/[hash].[ext]'
        loader: 'file-loader?limit=8192&name=./img/[name].[ext]'
      },
      /*{
        // html模板加载器，可以处理引用的静态资源，默认配置参数attrs=img:src，处理图片的src引用的资源
        // 比如你配置，attrs=img:src img:data-src就可以一并处理data-src引用的资源了，就像下面这样
        //ejs-loader可以使用ejs语法
        test: /\.ejs$/,
        loader: 'ejs-loader'
      },*/
      {
        //ejs-loader可以使用ejs语法
        test: /\.ejs/,
        loader: 'ejs-loader'
      },
      {
        // 文件加载器，处理文件静态资源
        test: /\.(woff|woff2|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader?name=./fonts/[name].[ext]'
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({ // 加载jq
      $: 'jquery'
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendors', // 将公共模块提取，生成名为`vendors`的chunk
      chunks: allEntry.filesName, // 提取哪些模块共有的部分
      minChunks: allEntry.filesName.length // 提取至少3个模块共有的部分
    }),
    new ExtractTextPlugin('css/[name].css'), // 单独使用link标签加载css并设置路径，相对于output配置中的publickPath

    new webpack.HotModuleReplacementPlugin() // 热加载
  ]
  // HtmlWebpackPlugin，模板生成相关的配置，每个对于一个页面的配置，有几个写几个
  .concat(newHtmlWebpackPlugin ()),
  // 使用webpack-dev-server，提高开发效率
  devServer: {
    contentBase: './',
    host: 'localhost',
    port: 9090,
    inline: true,
    hot: true
  }
}
