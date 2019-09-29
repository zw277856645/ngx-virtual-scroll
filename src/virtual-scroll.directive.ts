import { Directive, Input, OnChanges, SimpleChanges } from '@angular/core';
import { InputBoolean, InputNumber } from 'cmjs-lib';

@Directive({
    selector: '[virtualScroll]',
    exportAs: 'virtualScroll'
})
export class VirtualScrollDirective implements OnChanges {

    // 无法识别排序导致的数组变化，请使用 arr = [].concat(arr) 改变数组引用
    @Input() dataSource: any[];

    // 禁用插件
    @Input() @InputBoolean() disable: boolean;

    // 屏幕外缓存数量，代表屏幕上面和下面两部分。超出缓存数量的条目会被设为 display:none
    @Input() @InputNumber() buffer: number;

    constructor() {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.dataSource) {

        }
    }

    scrollTo(item: number | object, options?: { animation?: boolean }) {
    }
}