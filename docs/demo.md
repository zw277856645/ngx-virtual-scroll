## 通用配置示例

``` angular-files
{
  "embedOptions": {
    "height": 800,
    "hideDevTools": true
  }
}

demo/demo-common.component.html
demo/demo-common.component.less
demo/demo-common.component.ts

[demo/]angular.json
```

## 动态高度示例

`itemHeight`虽然可以返回动态值，但也是在某一条件下的`确定`的动态值，`动态高度`就是用来处理条目高度在`编码期无法确定`的场景的

``` angular-files
{
  "embedOptions": {
    "height": 800,
    "hideDevTools": true
  }
}

demo/result.animation.ts
demo/demo-dynamic.component.html
demo/demo-common.component.less
demo/demo-dynamic.component.less
demo/demo-dynamic.component.ts

[demo/]angular.json
```