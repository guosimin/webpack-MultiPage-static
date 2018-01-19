## 基于webpack的前端工程化开发之多页站点

**声明：本项目基于https://github.com/vhtml/webpack-MultiPage-static 改写,更符合我个人的使用**

切图是作为我入行前端以来最早接触到的一项任务，过去在前后端不分离的情况下，前端往往只需要完成页面编写和交互实现，数据实现就交给后端自己慢慢嵌套到前端代码中！！所以那时很多时候我交给后端的就是一份很干净的前端代码，没有各种包，就只有单纯的js,css,img,html

对于这么任务，我们构建的静态工程只需要做到以下几点就可：

1. 将css独立出来,并且先加载
2. js我们也只想加载需要的部分，而不是一个大大的打包了所有js模块的包
3. 直接发给客户，客户可以直接点击查看，而不是还要到服务器上查看

哈哈！别人怎么前后端分离不管，这个项目我改写的核心原因是为了第3点，杀鸡用牛刀~

-----------------------------------

首先开始构建我的项目目录结构。

#### 初始化项目、安装依赖

使用`npm init`初始化项目就不多说了，生成package.json文件。

使用`npm install plugins --save-dev`安装项目所需依赖。最终package.json的依赖声明如下：

```javascript
"devDependencies": {
   "css-loader": "^0.23.1",
      "ejs-loader": "^0.3.0",
      "eslint": "^3.15.0",
      "eslint-config-standard": "^6.2.1",
      "eslint-loader": "^1.6.1",
      "eslint-plugin-html": "^2.0.0",
      "eslint-plugin-promise": "^3.4.1",
      "eslint-plugin-standard": "^2.0.1",
      "extract-text-webpack-plugin": "^1.0.1",
      "file-loader": "^0.8.5",
      "html-loader": "^0.4.3",
      "html-webpack-plugin": "^2.9.0",
      "jquery": "^1.12.0",
      "less": "^2.6.0",
      "less-loader": "^2.2.2",
      "style-loader": "^0.13.0",
      "url-loader": "^0.5.7",
      "webpack": "^1.12.13",
      "webpack-dev-server": "^1.14.1"
}
```

>这里我引入了ejs-loader,因为这样可以不用重复引入公用部分html,eslint 暂时去除了。因为经过它的js代码，写了分号一片红，不喜欢。先注释掉了配置文件，等以后学习过后再改写改写。

#### 主要目录结构

```
- website
  - src                #代码开发目录
    - css              #css目录，按照页面（模块）、通用、第三方三个级别进行组织
      + page
      + common
      + lib
    + img              #图片资源
    - js               #JS脚本，按照page、components进行组织
      + page
    - view             #ejs模板
      + common         #公共调用ejs
      . index.ejs      #ejs模板
      .
      .
  - dist               #webpack编译打包输出目录，无需建立目录可由webpack根据配置自动生成
    + css                
    + js
    + img
    . index.html       #生成的静态页
  + node_modules       #所使用的nodejs模块
  package.json         #项目配置
  webpack.config.js    #webpack配置
  README.md            #项目说明
```

> 生产的dist文件可以直接打开预览效果，或者直接丢给后端继续开发拉~！！

目录组织好，我们就可以开始撸代码了。

#### 开发页面

在src/js/page目录下建立index.js文件，在src/view目录下建立index.html文件。入口js和模板文件名对应。

index.js内容如下：

```javascript
//引入css
require("../../css/lib/reset.css")
require("../../css/common/global.css")
require("../../css/common/grid.css")
require("../../css/page/index.less")

$('.g-bd').append('<p class="text">这是由js生成的一句话。</p>')
```

index.ejs 内容如下：

```xml
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>首页</title>
  <meta name="description" content="基于webpack的前端工程化开发解决方案探索"/>
  <!--
    描述：head中无需再引入css以及facicon，webpack将根据入口JS文件的要求自动实现按需加载或者生成style标签
  -->
</head>
<body>
  <div class="g-hd"></div>
  <div class="g-bd">
  		<input type="button" value="弹窗" class="btn">
  		<p class="img">
        <img src="<%= require('../img/4.png') %>">
  		</p>
      <%= require('./common/b.ejs')() %>
      <%= 1+2 %>
  	</div>
  	<div class="g-ft"></div>
  <!--
    描述：body中同样无需单独引入JS文件，webpack会根据入口JS文件自动实现按需加载或者生成script标签，还可以生成对应的hash值
  -->
</body>
</html>
```
就是这样一个简单的ejs模板，我们甚至没有引入任何CSS和JS，通过webpack打包就可以自动帮我们引入。

由于是做website，在此之前相信你对单页应用打包已经有过了解,webpack.config.js目前已经被改写，src/view目录非文件夹的文件会会生成一个新页，故不用重复配置。



OK，太棒了！！！

#### webpack配置

这里是关键，在webpack.config.js里，我们将进行一些配置，来完成我们的需求，一开始或许有点难理解，但等你真的掌握了，你便会惊呼它的神奇。配置中我写了详细的注释，要想彻底理解，还需多实践，多查阅文档，必要时看看源码，呜呼，学习之路漫漫兮。
对了，为了满足我“杀鸡”的目的,我吧hash也禁用了，注释也开放出来,因为我的目的是鸡，而不是牛。

```javascript
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
```
好了，完成以上的这些配置之后，执行`npm run build`打包命令完成项目打包生成dist。
执行`npm run dev`后,可以通过http://localhost:9090 查看页面



此时，前往/dist目录下查看生成的index.html文件，如下：

```xml
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>首页</title>
	<meta name="description" content="基于webpack的前端工程化开发解决方案探索">
	
<link rel="shortcut icon" href="favicon.ico"><link href="css/vendors.css" rel="stylesheet"></head>
<body>
	<div class="g-hd"></div>
	<div class="g-bd">
		<input type="button" value="弹窗" class="btn">
		<p class="img">
      <img src="./img/4.png">
		</p>
    <div>dsfsdfsdfsdfs</div>

    3
	</div>
	<div class="g-ft"></div>

	
<script type="text/javascript" src="js/vendors.js"></script><script type="text/javascript" src="js/index.js"></script></body>
</html>
```

可以看到生成的文件除了保留原模板中的内容以外，还根据引入，引入了公共模块，自动添加需要引入CSS与JS文件，以及favicon。

好了，纯静态的webpack前端构建过程就是这样了。

> 最后最后声明:这是只为切图项目服务且前后端不分离的项目服务，毕竟太复杂，后端也看不懂！
