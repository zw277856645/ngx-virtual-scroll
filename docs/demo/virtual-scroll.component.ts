import {
    AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit, Output, Renderer2,
    SimpleChanges, TemplateRef, TrackByFunction, ViewChild
} from '@angular/core';
import { InputBoolean, InputNumber } from 'cmjs-lib';
import { fromEvent, merge, Subscription } from 'rxjs';
import { debounceTime, map, throttleTime } from 'rxjs/operators';
import { NgForOfContext } from '@angular/common';

export class ItemChanges<T> {

    all: T[];

    added: T[];

    removed: T[];

    maintained: T[];
}

@Component({
    selector: 'virtual-scroll, [virtualScroll]',
    templateUrl: './virtual-scroll.component.html',
    styleUrls: [ './virtual-scroll.component.less' ],
    exportAs: 'virtualScroll'
})
export class VirtualScrollComponent<T> implements OnChanges, OnInit, AfterViewInit, OnDestroy {

    @ViewChild('totalHeight', { static: false }) totalHeight: ElementRef;
    @ViewChild('itemsContainer', { static: false }) itemsContainer: ElementRef;

    // 是否是 window 滚动，默认为指令所在元素为滚动窗体
    @Input() @InputBoolean() windowScroll: boolean;

    // 无法识别排序导致的数组变化，请使用 arr = [].concat(arr) 改变数组引用
    @Input() items: T[];

    // 条目渲染模板
    @Input() itemRender: TemplateRef<NgForOfContext<T>>;

    // 内部 *ngFor 使用，如果没有提供，将给数据项生成唯一标识，并使用该唯一标识作为 trackBy 返回值
    @Input() trackBy: TrackByFunction<T>;

    // 禁用插件
    @Input() @InputBoolean() disable: boolean;

    // 可视条目页数，根据屏幕(全局滚动)/容器(非全局滚动)高度，每一页为一屏。上/下屏幕外缓存数量 = (visiblePages - 1) / 2
    // 根据用户滚动方向，「上/下屏幕外缓存数量」会自动调节，滚动方向的缓存数量会加大
    @Input() @InputNumber() visiblePages: number = 3;

    // 优用户体验用，防止滚动过快时出现空白。占位符消耗性能较小，可适当调大本参数优化滚动体验。位置在「上/下屏幕外缓存数量」外侧
    // 占位符条目页数，根据屏幕(全局滚动)/容器(非全局滚动)高度，每一页为一屏。上/下屏幕外占位符数量 = placeholderPages / 2
    // 根据用户滚动方向，「上/下屏幕外占位符数量」会自动调节，滚动方向的缓存数量会加大
    // 超出占位符数量的条目不会加载
    // 总渲染条目页数 = visiblePages + placeholderPages
    @Input() @InputNumber() placeholderPages: number = 0;

    // 滚动到的条目不会立即显示，因为用户可能继续滚动，先使用性能代价较小的占位元素替代
    // 高度与被替代的条目高度一致
    @Input() @ViewChild('placeholderTemplate', { static: true }) placeholderRender: TemplateRef<{ $implicit: number }>;

    // 「上/下屏幕外缓存数量」和「上/下屏幕外占位符数量」调节倍率，有效值范围 0 ≤ n ≤ 1
    @Input() @InputNumber() adjustFactor: number = 0.5;

    // 条目高度，必须设置。不需要每个条目高度都相同，当高度不同时，也可以在数据项中添加 itemHeight 属性
    // 注意高度需包含 margin-top 和 margin-bottom
    @Input() itemHeight: number | ((item: T) => number);

    // 滚动容器最大高度，仅当非 window 滚动时有效(windowScroll = false)
    // PS：对于非 window 滚动，必须有容器高度，也可不设定此参数，而在样式中设定
    @Input() @InputNumber() containerMaxHeight: number;

    // 可视条目改变，注意新增的条目不一定已经显示了，只是即将显示，当前可能处于占位符替换状态中
    @Output() readonly visibleItemsChange = new EventEmitter<ItemChanges<T>>();

    // 占位符条目改变
    @Output() readonly placeholderItemsChange = new EventEmitter<ItemChanges<T>>();

    // 可视条目改变，且已刷新到页面
    @Output() readonly viewRefreshed = new EventEmitter();

    // 当前所有加载的条目
    viewPortItems: T[];

    // 数据项附加属性，指定当前数据项是否显示真实模板
    readonly ITEM_VISIBLE_KEY = '_vs_visible';

    private scrollDirection: 'up' | 'down' = 'down';
    private lastOffsetY: number = 0;
    private minItemHeight: number;
    private lastItemsContainerOffsetY: number = 0;

    private readonly body: HTMLElement;
    private readonly ele: HTMLElement;
    private readonly subscription = new Subscription();
    private readonly ITEM_ID_KEY = '_vs_id';

    constructor(private eleRef: ElementRef,
                private renderer: Renderer2,
                private zone: NgZone) {
        this.ele = eleRef.nativeElement;
        this.body = document.body;
    }

    ngOnInit() {
        if (!this.itemRender) {
            throw Error('No itemRender provided');
        }

        this.setHostStyles();
    }

    ngOnChanges(changes: SimpleChanges) {
        if ((changes.items && !changes.items.firstChange) || (changes.itemHeight && !changes.itemHeight.firstChange)) {
            this.setContainerStyles();
        }
        if (changes.containerMaxHeight && !changes.containerMaxHeight.firstChange) {
            this.setHostStyles();
        }
    }

    ngAfterViewInit() {
        this.setContainerStyles();
        this.bindEvents();
        this.refresh(true);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    trackByItems(i: number, v: T) {
        if (typeof this.trackBy === 'function') {
            return this.trackBy(i, v);
        } else {
            if (!v[ this.ITEM_ID_KEY ]) {
                v[ this.ITEM_ID_KEY ] = Symbol('id');
            }

            return v[ this.ITEM_ID_KEY ];
        }
    }

    createItemRenderContext(item: T, index: number, count: number) {
        return new NgForOfContext(item, null, index, count);
    }

    scrollTo(item: number | object, options?: { animation?: boolean }) {
    }

    refresh(force?: boolean) {
        if (force) {
            this.refreshPlaceholders();
        }

        this.renderer.setStyle(this.body, 'pointer-events', 'auto');
    }

    private refreshPlaceholders() {
        if (!this.items || !this.items.length) {
            return;
        }

        // 参数容错
        this.visiblePages = Math.max(1, this.visiblePages);
        this.placeholderPages = Math.max(0, this.placeholderPages);
        this.adjustFactor = Math.max(0, Math.min(1, this.adjustFactor));

        this.zone.runOutsideAngular(() => {
            // 滚动条滚动了至少最小高度时，才会移动 itemsContainer
            if (Math.abs(this.lastOffsetY - this.lastItemsContainerOffsetY) >= this.minItemHeight) {
                this.lastItemsContainerOffsetY = this.lastOffsetY;
                this.renderer.setStyle(
                    this.itemsContainer.nativeElement,
                    'transform',
                    `translateY(${this.lastOffsetY}px)`
                );
            }

            // 计算屏幕/容器上、中、下渲染所需高度(px)
            let totalPages = this.visiblePages + this.placeholderPages;
            let middleArea = this.windowScroll ? this.body.clientHeight : this.containerMaxHeight;
            let topArea = (totalPages - 1) / 2 * this.getAdjustFactorByDirection().top * middleArea;
            let bottomArea = (totalPages - 1) / 2 * this.getAdjustFactorByDirection().bottom * middleArea;

            // 处理滚动条靠近顶部或底部的情况
            topArea = Math.min(topArea, this.lastOffsetY);
            if (this.windowScroll) {
                bottomArea = Math.min(bottomArea, this.body.scrollHeight - this.body.clientHeight - this.lastOffsetY);
            } else {
                bottomArea = Math.min(bottomArea, this.ele.scrollHeight - this.ele.clientHeight - this.lastOffsetY);
            }

            // 计算哪些条目需要渲染(占位符)
            let aggrHeight = 0;
            for (let item of this.items as { itemHeight?: any }[]) {
                aggrHeight += item.itemHeight;
            }
        });
    }

    private getAdjustFactorByDirection() {
        if (this.scrollDirection === 'up') {
            return { top: 1 + this.adjustFactor, bottom: 1 - this.adjustFactor };
        } else {
            return { top: 1 - this.adjustFactor, bottom: 1 + this.adjustFactor };
        }
    }

    private setHostStyles() {
        if (!this.windowScroll) {
            if (this.containerMaxHeight > 0) {
                this.renderer.setStyle(this.ele, 'max-height', this.containerMaxHeight + 'px');
                this.renderer.setStyle(this.ele, 'overflow-x', 'hidden');
                this.renderer.setStyle(this.ele, 'overflow-y', 'auto');
            } else {
                let mh = getComputedStyle(this.ele)[ 'max-height' ];
                this.containerMaxHeight = (mh && (mh as string).endsWith('px')) ? parseFloat(mh) : null;

                if (!this.containerMaxHeight) {
                    throw Error('The scroll container needs to set the explicit max-height, '
                        + 'either by using the containerMaxHeight input property, '
                        + 'or by setting the max-height style');
                }
            }
        }
    }

    private setContainerStyles() {
        if (Array.isArray(this.items) && this.items.length && this.totalHeight) {
            let height = this.items.reduce((prev, cur: { itemHeight?: any }) => {
                if (typeof cur.itemHeight === 'number' && cur.itemHeight > 0) {
                    return prev + cur.itemHeight;
                } else if (typeof cur.itemHeight === 'string' && !isNaN(parseFloat(cur.itemHeight))) {
                    cur.itemHeight = parseFloat(cur.itemHeight);

                    return prev + cur.itemHeight;
                } else if (typeof this.itemHeight === 'number' && this.itemHeight > 0) {
                    cur.itemHeight = this.itemHeight;

                    return prev + this.itemHeight;
                } else if (typeof this.itemHeight === 'string' && !isNaN(parseFloat(this.itemHeight))) {
                    this.itemHeight = parseFloat(this.itemHeight);
                    cur.itemHeight = this.itemHeight;

                    return prev + this.itemHeight;
                } else if (typeof this.itemHeight === 'function') {
                    cur.itemHeight = this.itemHeight(cur as T);

                    return prev + cur.itemHeight;
                } else {
                    throw Error('No input attribute itemHeight or data item attribute itemHeight provided');
                }
            }, 0);
            this.renderer.setStyle(this.totalHeight.nativeElement, 'height', height + 'px');

            // 缓存最小高度
            this.minItemHeight = this.items.reduce((prev, cur: { itemHeight?: number }) => {
                return Math.min(prev, cur.itemHeight);
            }, Number.MAX_SAFE_INTEGER);
        }
    }

    private bindEvents() {
        this.subscription.add(
            merge(
                fromEvent(window, 'resize'),
                fromEvent(this.windowScroll ? window : this.ele, 'scroll').pipe(
                    map(() => {
                        if (this.windowScroll) {
                            this.scrollDirection = window.pageYOffset > this.lastOffsetY ? 'down' : 'up';
                            this.lastOffsetY = window.pageYOffset;
                        } else {
                            this.scrollDirection = this.ele.scrollTop > this.lastOffsetY ? 'down' : 'up';
                            this.lastOffsetY = this.ele.scrollTop;
                        }

                        this.refreshPlaceholders();
                    })
                )
            ).pipe(
                map(() => this.renderer.setStyle(this.body, 'pointer-events', 'none')),
                debounceTime(500)
            ).subscribe(() => this.refresh())
        );
    }
}