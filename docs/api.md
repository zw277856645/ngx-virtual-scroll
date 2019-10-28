## 使用方式

``` html
<div virtualScroll ...> ... </div>
<!-- 或 -->
<virtual-scroll ...> ... </virtualScroll>
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
2、根据用户滚动方向，「上/下屏幕外真实数量」会自动调节，滚动方向的缓存数量会加大  
3、有效值范围 n ≥ 1.5  

### placeholderPages

- 类型：`number`
- 默认值：`3`

占位符条目页数

1、根据容器可视区域高度，每一页为一屏。上/下屏幕外占位符数量 = (placeholderPages - visiblePages) / 2  
2、根据用户滚动方向，「上/下屏幕外占位符数量」会自动调节，滚动方向的缓存数量会加大  
3、超出占位符数量的条目不会加载。占位符消耗性能较小，可适当调大本参数优化滚动体验  
4、visiblePages ≤ placeholderPages，「真实条目」为「占位符条目」中处于可视窗口内的条目  
5、不设置或值小于 visiblePages，修正值为 visiblePages  

### adjustFactor

- 类型：`number`
- 默认值：`0.5`

「上/下屏幕外真实数量」和「上/下屏幕外占位符数量」调节倍率，有效值范围 0 ≤ n ≤ 1。滚动方向比反方向多加载`adjustFactor`倍率的条目

### errorGroupClassNames

- 类型：`string`
- 默认值：`fh-group-error`

验证失败时`表单组`自动添加的类名。默认主题没有为 fh-group-error 设置样式，用户可在自己的样式文件中定义具体样式

### resultOkAssertion

- 类型：`(res: any) => boolean`
- 默认值：`undefined`

判断请求是否成功的断言函数，res为请求返回值，仅当执行结果为 true 时，才会继续执行[`SubmitWrapper`](appendix#submitwrapper)
监听函数和自动重置表单。默认根据请求状态码处理，200为请求成功，否则为失败。如果用户包装了请求响应，比如使用自定义状态码代表请求状态，
需要使用此配置指定判断逻辑

``` js
// 示例
function myResultOkAssertion(res: any) {
    return 'customStatus' in res ? res.customStatus === 'SUCCESS' : true;
}
```

``` html
<form formHelper [resultOkAssertion]="myResultOkAssertion"></form>
```

## 输出属性

@Output() 装饰器标识的属性

### validFail

- 类型：`EventEmitter<void>`

验证不通过事件

### validPass

- 类型：`EventEmitter<SubmitWrapper>`

验证通过事件。事件会传递[`SubmitWrapper`](appendix#submitwrapper)方法，必须由用户合理调用

## 公共成员属性

实例属性

### ngForm

- 类型：`ControlContainer`

关联的 angular form 实例，`模板驱动`表单(template driven form)时为 NgForm，`模型驱动`表单(Model driven form)时为 FormGroup。
ControlContainer 为两者共同基类

### form

- 类型：`HTMLFormElement`

表单的 dom 元素

### controls

- 类型：`{ [key: string]: AbstractControl }`

控件树，屏蔽了模板驱动和模型驱动表单之间的差异

## 公共成员方法

实例方法

### submit

- 类型：`(submitHandler?: SubmitHandler) => void`
  - submitHandler：详情参见[`SubmitWrapper`](appendix#submitwrapper)章节文档

提交处理函数，不需要用户调用，通常在实现自定义的提交处理指令时需要

### reset

- 类型：`() => void`

重置，在重置按钮使用了`#reset`模板变量时可省略调用
``` html
<form formHelper>
    <button type="button" #reset>重置</button>
</form>
```

绑定事件方式
``` html
<form formHelper #formHelperCtrl="formHelper">
    <button type="button" (click)="formHelperCtrl.reset()">重置</button>
</form>
```

### repositionMessages

- 类型：`(type?: RefType | AbstractControl, delay?: number)`
  - type：需要重定位错误信息关联的表单控件指引，当控件为`表单组`时，其`子域`也会同时重定位。详情参见
  [`RefType`](appendix#reftype)章节文档。省略参数将重定位所有错误消息
  - delay：延时重定位时间，默认不延时

重定位错误消息。页面布局变化时，某些绝对定位错误消息位置可能需要重新定位。window:resize 事件已被插件处理，
会自动重定位错误消息，其他情况需要手动调用此方法。

``` html
<!-- 示例 -->
<form formHelper #formHelperCtrl="formHelper">
  <div ngModelGroup="group">
    ...
  </div>
  <button type="button" (click)="formHelperCtrl.repositionMessages('group')">重定位消息</div>
</form>
```

## 主题附加样式

表单域添加`ignore`类，将忽略给该元素设置验证失败样式
``` html
<input type="text" class="ignore" name="name" [(ngModel)]="xxx" required>
```

表单域添加`thin`类，将设置元素左边框为细边框样式
``` html
<input type="text" class="thin" name="name" [(ngModel)]="xxx" required>
```
