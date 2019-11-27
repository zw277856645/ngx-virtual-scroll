## 使用方式

``` html
<div virtualScroll ...> ... </div>
<!-- 或 -->
<virtual-scroll ...> ... </virtualScroll>
```

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

## 输入属性

@Input() 装饰器标识的属性

### windowScroll

- 类型：`boolean`
- 默认值：`false`

是否是 window 滚动，默认为指令所在元素为滚动容器

### items

- 类型：`T[]`
- 默认值：`undefined`

数据源

> 无法识别不可变(immutable)操作导致的数据变化，比如排序请使用 arr = [].concat(arr).sort() 改变数组引用

``` html
<!-- 数据源后可连接管道操作符，但要注意对不可变操作的处理，比如排序 -->
<virtual-scroll [items]="datas | pipe1 | pipe2 | ..."></virtualScroll>
```

### trackBy

- 类型：`TrackByFunction`
- 默认值：`undefined`

内部 *ngFor 的 trackBy 方法，不提供则使用自动生成的 id 为返回值。推荐定时刷新的列表提供该配置，
因为插件检测到的数据是变化了的，会重新生成 id

### emptyRender

- 类型：`TemplateRef<any>`
- 默认值：`undefined`

数据源(items)为空时显示的模板。可能会对数据源做筛选等操作，当筛选后没有任何数据时，显示一个类似`No Results`的提示是一种比较友好的方式

### placeholderRender

- 类型：`TemplateRef<NgForOfContext<T>>`
- 默认值：`内置的占位符模板`

占位符条目渲染模板

1、滚动到的条目不会立即显示真实模板，因为用户可能不关心当前数据而继续滚动，先使用性能代价很小的占位元素替代。
当真实模板比较复杂时，推荐开启占位符功能，可极大优化刷新效率，解决闪烁和空白问题  
2、如果希望只显示真实条目，可直接设置本参数为真实渲染模板，且真实模板参数`itemRender`不再设置。当真实模板比较简单时，
没必要使用占位符功能

### itemRender

- 类型：`TemplateRef<NgForOfContext<T>>`
- 默认值：`undefined`

真实条目渲染模板

### visiblePages

- 类型：`number`
- 默认值：`3`

真实条目页数

1、根据容器可视区域高度，每一页为一屏。上/下屏幕外缓存数量 = (visiblePages - 1) / 2  
2、根据用户滚动方向，`上/下屏幕外真实数量`会自动调节，滚动方向的缓存数量会加大  
3、有效值范围 n ≥ 1  

### placeholderPages

- 类型：`number`
- 默认值：`3`

占位符条目页数

1、根据容器可视区域高度，每一页为一屏。上/下屏幕外占位符数量 = (placeholderPages - visiblePages) / 2  
2、根据用户滚动方向，`上/下屏幕外占位符数量`会自动调节，滚动方向的缓存数量会加大  
3、超出占位符数量的条目不会加载。占位符消耗性能较小，可适当调大本参数优化滚动体验  
4、visiblePages ≤ placeholderPages，「真实条目」为「占位符条目」中处于可视窗口内的条目  
5、不设置或值小于 visiblePages，修正值为 visiblePages  

### adjustFactor

- 类型：`number`
- 默认值：`0.5`

`上/下屏幕外真实数量`和`上/下屏幕外占位符数量`调节倍率，有效值范围 0 ≤ n ≤ 1。滚动方向比反方向多加载`adjustFactor`倍率的条目

### itemHeight

- 类型：`number | ((item: T, index: number) => number)`
- 默认值：`undefined`

条目高度，插件已设置盒模型为`border-box`，条目高度 = height + padding-(top、bottom) + border-(top、bottom)，`必须设置`

1、不需要每个条目高度都相同，当各条目高度不同时，使用回调函数形式  
2、当参数值变化时，插件会自动刷新，但如果是回调函数形式，插件只在初始时调用一次，不会跟踪返回值的变化，
当返回值变化时需要用户自行调用`refresh`方法刷新  
3、不要给条目设置 margin-top 和 margin-bottom，使用`itemGap`设置条目的间隙

> 回调函数形式适合用高度确定的情况，当无法确定具体高度时，可使用[`动态高度`](#动态高度)配置

``` html
<!-- 回调函数形式示例 -->
<virtual-scroll [items]="users" [itemHeight]="defineItemHeight"></virtualScroll>
```

``` js
@Component({ ... })
export class DemoComponent {

    users: User[] = [ user1, user2, ... ];
    
    defineItemHeight(user: User, index: number) {
        return user.children.length > 0 ? 300 : 200; 
    }
}
```

### itemGap

- 类型：`number | { horizontal: number; vertical: number }`
- 默认值：`0`

条目之间间隙，当为多列模式且条目间水平间距和垂直间距不同时，使用对象形式的参数

### containerMaxHeight

- 类型：`number`
- 默认值：`undefined`

滚动容器最大高度，仅当`windowScroll = false`时有效

> 对于非 window 滚动，必须有容器高度，若提供了该参数，插件将使用该值设置滚动容器的 max-height。你也可不设定此参数，而自行在样式中设定

### auditTime

- 类型：`number`
- 默认值：`0`

滚动时刷新`占位符条目`的时间间隔(ms)，可根据页面性能情况，自行调节

> 该值设置的越小越好，可减少/屏蔽滚动时浏览器不能及时刷新导致的空白问题，所以`占位符条目`越简单越好

### debounceTime

- 类型：`number`
- 默认值：`300`

滚动时刷新`真实条目`的时间间隔(ms)，可根据页面性能情况，自行调节

### 动态高度

#### observeChanges

- 类型：`boolean`
- 默认值：`false`

是否使用[`MutationObserver`](https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver)监测条目 DOM 变化，
设置 true 当 DOM 变化导致条目高度变化后将自动刷新。开启后会读取元素原生高度，有一定性能影响，请只在无法确定高度的情况下使用，
可确定高度请使用[`itemHeight`](#itemHeight)

> 对影响条目高度的可变元素尽量使用`*ngIf、*ngFor`等结构指令，而不是`[hidden]`，这样就能自动监测刷新，否则需要手动调用`refresh`刷新

#### observeIntervalTime

- 类型：`number`
- 默认值：`300`

监测条目 DOM 变化的时间间隔，只在 observeChanges = true 时有效，用于合并短时间内触发多次的变化事件，减少刷新次数

#### dynamicHeight

- 类型：`(item: T) => number`
- 默认值：`undefined`

条目动态高度判断函数，只在 observeChanges = true 时有效，返回特定场景下的高度值，主要用于加快布局刷新，
使`scrollToPosition、scrollToIndex、scrollToItem`能立即滚动到正确位置，对[`itemHeight`](#itemHeight)的补充，通常不需要提供

*使用场景解释：*  
*适用于含有导航的场景，点击导航通过调用`scrollToPosition、scrollToIndex、scrollToItem`可滚动到相应的位置，
但当发生动态高度变化且含有过渡动画时，插件自动处理需要经历比较多的轮回才能确定高度稳定，然后刷新布局，有一定的时间延时，
在这之前调用滚动方法就会滚动到错误位置，某些场景的变化高度可能是确定值，针对此类场景可通过`dynamicHeight`方法返回确定值，
插件会立即刷新布局从而使滚动方法能正确处理*

> 没有导航或对`scrollToPosition、scrollToIndex、scrollToItem`调用无严格要求的情况下，不需要配置本参数

### 多列模式

#### multiseriate

- 类型：`boolean`
- 默认值：`false`

是否是多列模式，即每行显示多个条目

> 多列模式不支持动态高度，即`multiseriate`与`observeChanges`不能同时设置为 true

#### itemWidth

- 类型：`number | string | ((item: T, index: number) => number | string)`
- 默认值：`undefined`

条目宽度，插件已设置盒模型为border-box，条目宽度 = width + padding-(left、right) + border-(left、right)，`多列模式时必须设置`

1、不需要每个条目宽度都相同，当各条目宽度不同时，使用回调函数形式  
2、当参数值变化时，插件会自动刷新，但如果是回调函数形式，插件只在初始时调用一次，不会跟踪返回值的变化， 
当返回值变化时需要用户自行调用refresh方法刷新  
3、不要给条目设置 margin-left 和 margin-right，使用 itemGap 设置条目的间隙  
4、与`itemHeight`不同的是，可设置为相对于滚动容器宽度的百分比字符串

> 不支持动态宽度，没有 dynamicWidth

## 输出属性

@Output() 装饰器标识的属性

### visibleItemsChange

- 类型：`EventEmitter<ItemChanges<T>>`

真实条目改变事件

``` js
// ItemChanges 原型
class ItemChanges<T> {
    all: T[];          // 当前所有的真实条目数据
    added: T[];        // 同上一次相比，新增的真实条目数据
    removed: T[];      // 同上一次相比，删除的真实条目数据
    maintained: T[];   // 同上一次相比，不变的真实条目数据
}
```

### placeholderItemsChange

- 类型：`EventEmitter<ItemChanges<T>>`

占位符条目改变事件

## 公共成员属性

实例属性

### scrollPosition

- 类型：`number`

容器当前滚动高度

*使用场景解释：*  
*可缓存该值，稍后调用`scrollToPosition`传入该值来还原到原先滚动位置*

## 公共成员方法

实例方法

### scrollToPosition

- 类型：`(position: number, options?: ScrollConfig) => void`

滚动到指定位置

``` js
// ScrollConfig 原型
class ScrollConfig {
    animation?: number | false = 500;           // 是否使用动画
    offsetTop?: number = 0;                     // 距离滚动位置的附加偏移量
    pauseListeners?: boolean = true;            // 滚动时是否暂停插件中的监听处理函数
    onComplete?: () => void = () => void (0);   // 滚动结束后的回调
}
```

### scrollToIndex

- 类型：`(index: number, options?: ScrollConfig) => void`

滚动到指定数据源下标处的条目

### scrollToItem

- 类型：`(item: T, options?: ScrollConfig) => void`

滚动到指定条目

### refresh

- 类型：`(layoutChanged?: boolean, options?: RefreshConfig<T>) => void`

``` js
/* RefreshConfig 原型 */

class RefreshConfig<T> {
    changedItems?: RefreshItemsConfig<T>[];    // 发生了插件无法获知的高度变化的条目，默认空
    delay?: number;                            // 刷新延时，默认无延时
    onlyRefreshLayout?: boolean;               // 是否只刷新布局，不刷新`真实条目`和`占位符条目`
}

class RefreshItemsConfig<T> {
    item: T;                // 布局变化的条目
    height?: number;        // 变化后的高度，不提供该值则读取原生高度，提供该值可加快刷新
}
```

该方法通常不需要调用，插件已内部自动处理。当发生插件无法跟踪的变化导致显示不正常时，可手动调用该方法。
手动调用时通常调用姿势为`refresh(true)`，第二个参数为内部优化使用，用户可不关心
