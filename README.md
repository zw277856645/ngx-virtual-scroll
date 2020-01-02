# ngx-virtual-scroll
angular 虚拟滚动插件，适用于大数据量列表展示

## ✨ 插件特性

- 支持不固定的高度/宽度，当条目的布局变化时自动刷新
- 支持使用占位符模板优化响应速度，占位符模板可自定义
- 支持根据当前滚动方向，动态调整容器上下不可见区域显示条目的个数
- 支持多列布局，即每行显示多个条目

## 🔗 链接

- [DOCS](https://zw277856645.gitlab.io/ngx-virtual-scroll)
- [DEMO](https://zw277856645.gitlab.io/ngx-virtual-scroll/components/VirtualScrollComponent.html#example)
- [PROJECT](https://gitlab.com/zw277856645/ngx-virtual-scroll)

## 📦 安装

> npm install @demacia/ngx-virtual-scroll --save

## 🔨 使用

###### 引入module

``` js
import { VirtualScrollModule } from '@demacia/ngx-virtual-scroll';

@NgModule({
    imports: [
        VirtualScrollModule
    ]
})
export class AppModule {
}
```

###### 标签或属性使用

``` html
<div virtualScroll ...> ... </div>
<!-- 或 -->
<virtual-scroll ...> ... </virtualScroll>
```

###### 参数设置

``` html
<virtual-scroll class="cards"
                [items]="users"
                [itemHeight]="isAdmin ? 150 : 100"
                [emptyRender]="emptyTemplate"
                [placeholderRender]="placeholderTemplate"
                [itemRender]="itemTemplate"
                ...>
  <ng-template #emptyTemplate>
    <div class="empty">No Results</div>    
  </ng-template>
  
  <!-- 滚动未稳定时真实模板的替换模板(占位符)，当真实模板比较复杂(耗性能)时，可极大提升滚动体验 -->
  <ng-template #placeholderTemplate let-user>
    <div class="card">{{user.name}}</div>    
  </ng-template>
    
  <!-- 模板数据结构与 NgForOfContext 相同，$implicit 为当前迭代数据 -->
  <ng-template #itemTemplate let-user let-index="index" let-first="first" let-last="last">
    <div class="card">
      <div class="num">{{index}}</div>
      <div class="name">{{user.name}}</div>
      <div class="operators" *ngIf="isAdmin"> ... </div>
      ...
    </div>    
  </ng-template>
</virtualScroll>
```
