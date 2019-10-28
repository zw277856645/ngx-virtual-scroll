# ngx-virtual-scroll
angular 虚拟滚动插件，适用于大数据量列表展示

## ✨ 插件特性
- 支持不固定的高度/宽度，当条目的布局变化时自动刷新
- 支持使用占位符模板优化响应速度，占位符模板可自定义
- 支持根据当前滚动方向，动态调整容器上下不可见区域显示条目的个数
- 支持多列布局，即每行显示多个条目

## 🔗 链接
- [DOCS](https://zw277856645.gitlab.io/ngx-virtual-scroll)
- [DEMO](https://zw277856645.gitlab.io/ngx-virtual-scroll/#/demo)

## 📦 安装
> npm install ngx-virtual-scroll --save

## 🔨 使用
#### 1. 引入module
``` js
import { VirtualScrollModule } from 'ngx-virtual-scroll';

@NgModule({
    imports: [
        VirtualScrollModule
    ]
})
export class AppModule {
}
```
