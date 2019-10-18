import {
    AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit, Output, Renderer2,
    SimpleChanges, TemplateRef, ViewChild
} from '@angular/core';
import { getScrollTop, InputBoolean, InputNumber, setScrollTop, uuid } from 'cmjs-lib';
import { animationFrameScheduler, asapScheduler, fromEvent, merge, Subject, Subscription } from 'rxjs';
import { auditTime, debounceTime, map } from 'rxjs/operators';
import { NgForOfContext } from '@angular/common';
import {
    ItemChanges, ItemInternalAttrs, RefreshConfig, RefreshType, ScrollConfig, ScrollDirection, ViewportInfo
} from './models';
import { animate, transition, trigger } from '@angular/animations';

const TWEEN = require('@tweenjs/tween.js');

@Component({
    selector: 'virtual-scroll, [virtualScroll]',
    templateUrl: './virtual-scroll.component.html',
    styleUrls: [ './virtual-scroll.component.less' ],
    exportAs: 'virtualScroll',
    animations: [
        // 没有实际动画，在初始渲染时阻止所有子元素动画。主要用于动态高度条目重新加载时避免动画，
        // 给用户一种'加载条目上一次状态'的感觉
        trigger('stopChildrenAnimations', [ transition(':enter', [ animate(0) ]) ])
    ]
})
export class VirtualScrollComponent<T> implements OnChanges, OnInit, AfterViewInit, OnDestroy {

    @ViewChild('totalHeight', { static: false }) totalHeight: ElementRef;
    @ViewChild('itemsContainer', { static: false }) itemsContainer: ElementRef;

    // 是否是 window 滚动，默认为指令所在元素为滚动窗体
    @Input() @InputBoolean() windowScroll: boolean;

    // 无法识别排序导致的数组变化，请使用 arr = [].concat(arr) 改变数组引用
    @Input() items: T[];

    // items 为空时显示的模板
    @Input() emptyRender: TemplateRef<any>;

    // 滚动到的条目不会立即显示，因为用户可能继续滚动，先使用性能代价较小的占位元素替代
    // 如果不希望出现占位符条目，可直接设置本参数为真实渲染模板
    @Input() @ViewChild('placeholderTemplate', { static: true }) placeholderRender: TemplateRef<{ $implicit: number }>;

    // 真实条目渲染模板
    // 不提供则使用 placeholderRender 替代
    @Input() itemRender: TemplateRef<NgForOfContext<T>>;

    // 可视条目页数，根据可视区域高度，每一页为一屏。上/下屏幕外缓存数量 = (visiblePages - 1) / 2
    // 根据用户滚动方向，「上/下屏幕外缓存数量」会自动调节，滚动方向的缓存数量会加大
    // 有效值范围 n ≥ 1.5
    @Input() @InputNumber() visiblePages: number = 3;

    // 占位符条目页数，根据可视区域高度，每一页为一屏。上/下屏幕外占位符数量 = placeholderPages / 2
    // 根据用户滚动方向，「上/下屏幕外占位符数量」会自动调节，滚动方向的缓存数量会加大
    // 超出占位符数量的条目不会加载。优用户体验用，防止滚动过快时出现空白。占位符消耗性能较小，可适当调大本参数优化滚动体验
    // visiblePages ≤ placeholderPages，「可视条目」为「占位符条目」中处于可视窗口内的条目
    // 不设置或值小于 visiblePages，修正值为 visiblePages
    @Input() @InputNumber() placeholderPages: number = 0;

    // 「上/下屏幕外缓存数量」和「上/下屏幕外占位符数量」调节倍率，有效值范围 0 ≤ n ≤ 1
    @Input() @InputNumber() adjustFactor: number = 0.5;

    // 条目高度，必须设置。不需要每个条目高度都相同，当各条目高度不同时，使用回调函数形式
    // 注意不要给条目设置 margin-top 和 margin-bottom，使用 itemGap 设置条目的间隙
    @Input() itemHeight: number | ((item: T) => number);

    // 条目之间间隙
    @Input() @InputNumber() itemGap: number = 0;

    // 滚动容器最大高度，仅当非 window 滚动时有效(windowScroll = false)
    // PS：对于非 window 滚动，必须有容器高度，也可不设定此参数，而在样式中设定
    @Input() @InputNumber() containerMaxHeight: number;

    // 刷新占位符条目间隔(ms)
    @Input() @InputNumber() auditTime: number = 100;

    // 刷新可视条目间隔(ms)
    @Input() @InputNumber() debounceTime: number = 300;

    // 是否监测条目 DOM 变化，设置 true 条目高度变化后将自动刷新
    @Input() @InputBoolean() observeChanges: boolean;

    // 监测条目 DOM 变化的时间间隔，只在 observeChanges = true 时有效
    @Input() @InputNumber() observeIntervalTime: number = 300;

    // 可视条目改变
    @Output() readonly visibleItemsChange = new EventEmitter<ItemChanges<T>>();

    // 占位符条目改变
    @Output() readonly placeholderItemsChange = new EventEmitter<ItemChanges<T>>();

    // 条目发生动态高度变化
    @Output() readonly observedItemsChanges = new EventEmitter();

    // 当前所有加载的条目
    viewportItems: T[];

    // 插件自动添加的私有属性
    internalAttrs: ItemInternalAttrs;

    private lastOffsetY: number = 0;
    private scrollDirection: ScrollDirection = ScrollDirection.DOWN;
    private lastViewportInfo: ViewportInfo<T>;
    private lastVisibleViewportInfo: ViewportInfo<T>;
    private lastContainerOffsetY: number = 0;
    private currentTween: TWEEN.Tween;
    private manualScrolling: boolean;
    private subscription = new Subscription();
    private heightChangeSubject = new Subject();

    private readonly ele: HTMLElement;
    private readonly body: HTMLElement;

    // 插件会在数据项中添加私有属性，计算时需要用到这些属性，当同一套数据用在多个滚动插件中时，属性会冲突。在属性后加上
    // 自增值实现动态唯一属性
    private static count = 0;

    private static readonly HEIGHT_ATTR = '_vs_height_';
    private static readonly DYNAMIC_HEIGHT_ATTR = '_vs_dynamic_height_';
    private static readonly ACC_HEIGHT_ATTR = '_vs_acc_height_';
    private static readonly INDEX_ATTR = '_vs_index_';
    private static readonly ID_ATTR = '_vs_id_';
    private static readonly VISIBLE_ATTR = '_vs_visible_';
    private static readonly CONTEXT_ATTR = '_vs_context_';

    constructor(private eleRef: ElementRef,
                private renderer: Renderer2,
                private zone: NgZone) {
        this.ele = eleRef.nativeElement;
        this.body = document.body;

        VirtualScrollComponent.count++;
        this.internalAttrs = {
            // 条目高度(包括了条目间隙)
            height: VirtualScrollComponent.HEIGHT_ATTR + VirtualScrollComponent.count,

            // 动态变化的高度
            dynamicHeight: VirtualScrollComponent.DYNAMIC_HEIGHT_ATTR + VirtualScrollComponent.count,

            // 与其前面所有项高度累计
            accHeight: VirtualScrollComponent.ACC_HEIGHT_ATTR + VirtualScrollComponent.count,

            // 在源数据数组中的下标
            index: VirtualScrollComponent.INDEX_ATTR + VirtualScrollComponent.count,

            // 自动生成的唯一标识
            id: VirtualScrollComponent.ID_ATTR + VirtualScrollComponent.count,

            // 是否显示真实模板，false 时显示占位符
            visible: VirtualScrollComponent.VISIBLE_ATTR + VirtualScrollComponent.count,

            // 条目关联的 ngFor 上下文
            context: VirtualScrollComponent.CONTEXT_ATTR + VirtualScrollComponent.count
        };
    }

    ngOnInit() {
        this.fixPageParams();
        this.setHostStyles();
    }

    ngOnChanges(changes: SimpleChanges) {
        if ((changes.items && !changes.items.firstChange)
            || (changes.itemHeight && !changes.itemHeight.firstChange)
            || (changes.itemGap && !changes.itemGap.firstChange)) {
            this.lastViewportInfo = null;
            this.lastVisibleViewportInfo = null;
            this.refresh(true);
        }
        if (changes.containerMaxHeight && !changes.containerMaxHeight.firstChange) {
            this.setHostStyles();
        }
        if ((changes.visiblePages && !changes.visiblePages.firstChange)
            || (changes.placeholderPages && !changes.placeholderPages.firstChange)
            || (changes.adjustFactor && !changes.adjustFactor.firstChange)) {
            this.fixPageParams();
        }
    }

    ngAfterViewInit() {
        this.bindEvents();
        Promise.resolve().then(() => this.refresh(true));
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    trackByItems(i: number, v: T) {
        return v[ VirtualScrollComponent.ID_ATTR + VirtualScrollComponent.count ];
    }

    mergeHeightChanges() {
        this.heightChangeSubject.next();
    }

    scrollTo(item: number | T, options?: ScrollConfig) {
        options = Object.assign(new ScrollConfig(), options);

        if (options.pauseListeners) {
            this.manualScrolling = true;
        }

        if (this.currentTween) {
            this.currentTween.stop();
            this.currentTween = null;
        }

        let context = this.windowScroll ? window : this.ele;
        let curScrollTop = getScrollTop(context);
        let offsetY = 0;

        if (typeof item === 'number' && item > 0) {
            offsetY = this.items[ item - 1 ][ this.internalAttrs.accHeight ];
        } else if (item[ this.internalAttrs.index ] > 0) {
            offsetY = this.items[ item[ this.internalAttrs.index ] - 1 ][ this.internalAttrs.accHeight ];
        }

        if (options.offsetTop) {
            offsetY += options.offsetTop;
        }

        if (curScrollTop === offsetY) {
            options.onComplete();
            this.manualScrolling = false;
        } else if (options.animation) {
            let animationRequest: number;

            let newTween = new TWEEN.Tween({ y: curScrollTop })
                .to({ y: offsetY }, options.animation)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate((data: any) => {
                    if (!isNaN(data.y)) {
                        setScrollTop(context, data.y);
                    }
                })
                .onComplete(() => {
                    cancelAnimationFrame(animationRequest);
                    this.currentTween = null;

                    this.refresh();
                    options.onComplete();
                    this.manualScrolling = false;
                })
                .start();

            let animate = (time?: any) => {
                newTween.update(time);
                if (newTween._object.y !== offsetY) {
                    this.zone.runOutsideAngular(() => animationRequest = requestAnimationFrame(animate));
                }
            };

            animate();
            this.currentTween = newTween;
        } else {
            setScrollTop(context, offsetY);

            this.refresh();
            options.onComplete();
            this.manualScrolling = false;
        }
    }

    refresh(layoutChanged?: boolean, options?: RefreshConfig<T>) {
        if (options && options.delay) {
            setTimeout(() => this.refresh(layoutChanged, { ...options, delay: 0 }), options.delay);
        } else {
            if (layoutChanged) {
                // 发生了插件无法获知的布局变化，读取原生 DOM 高度
                let items = options && options.changedItems ? [].concat(options.changedItems) : null;
                this.refreshLayout(items);
            }

            this.cacheScrollParams();
            this.refreshPlaceholders();
            this.refreshVisibles();
        }
    }

    private refreshLayout(changedItems?: T[]) {
        if (Array.isArray(this.items) && this.items.length && this.totalHeight) {
            let height = this.items.reduce((prev, cur, index) => {
                if (changedItems && changedItems.indexOf(cur) >= 0) {
                    cur[ this.internalAttrs.dynamicHeight ] = this.getNativeHeight(cur);
                }

                if (typeof this.itemHeight === 'number') {
                    cur[ this.internalAttrs.height ] = this.itemHeight + this.itemGap;
                } else if (typeof this.itemHeight === 'string' && !isNaN(parseFloat(this.itemHeight))) {
                    this.itemHeight = parseFloat(this.itemHeight);
                    cur[ this.internalAttrs.height ] = this.itemHeight + this.itemGap;
                } else if (typeof this.itemHeight === 'function') {
                    cur[ this.internalAttrs.height ] = this.itemHeight(cur as T) + this.itemGap;
                } else {
                    throw Error('No input attribute itemHeight or data item attribute itemHeight provided');
                }

                cur[ this.internalAttrs.accHeight ] = prev
                    + (cur[ this.internalAttrs.dynamicHeight ] || cur[ this.internalAttrs.height ]);
                cur[ this.internalAttrs.index ] = index;
                cur[ this.internalAttrs.visible ] = false;
                cur[ this.internalAttrs.context ] = this.createItemRenderContext(cur);

                if (!cur[ this.internalAttrs.id ]) {
                    cur[ this.internalAttrs.id ] = 'id-' + uuid(8);
                }

                return cur[ this.internalAttrs.accHeight ];
            }, 0);

            this.renderer.setStyle(this.totalHeight.nativeElement, 'height', height + 'px');
        }
    }

    private refreshVisibles() {
        this.zone.runOutsideAngular(() => {
            if (this.itemRender) {
                // 计算哪些条目需要显示真实模板
                let viewportInfo = this.createViewportInfo(RefreshType.VISIBLE);

                this.zone.run(() => {
                    this.items
                        .slice(viewportInfo.startIndex, viewportInfo.endIndex + 1)
                        .forEach(item => item[ this.internalAttrs.visible ] = true);

                    if (!this.lastVisibleViewportInfo
                        || (this.lastVisibleViewportInfo.startIndex !== viewportInfo.startIndex)
                        || (this.lastVisibleViewportInfo.endIndex !== viewportInfo.endIndex)) {
                        this.visibleItemsChange.emit(this.createItemsChange(viewportInfo, RefreshType.VISIBLE));
                        this.lastVisibleViewportInfo = viewportInfo;
                    }
                });
            }
        });
    }

    private refreshPlaceholders() {
        this.zone.runOutsideAngular(() => {
            // 计算哪些条目需要渲染(占位符)
            let viewportInfo = this.createViewportInfo(RefreshType.PLACEHOLDER);

            if (!this.lastViewportInfo
                || (this.lastViewportInfo.startIndex !== viewportInfo.startIndex)
                || (this.lastViewportInfo.endIndex !== viewportInfo.endIndex)) {
                this.zone.run(() => {
                    let itemsChange = this.createItemsChange(viewportInfo, RefreshType.PLACEHOLDER);

                    itemsChange.removed.forEach(item => item[ this.internalAttrs.visible ] = false);
                    this.viewportItems = itemsChange.all;

                    this.placeholderItemsChange.emit(itemsChange);
                    this.lastViewportInfo = viewportInfo;

                    // 画布需要位移的距离
                    if (itemsChange.all.length && itemsChange.all[ 0 ][ this.internalAttrs.index ] > 0) {
                        let prevItem = this.items[ itemsChange.all[ 0 ][ this.internalAttrs.index ] - 1 ];
                        this.lastContainerOffsetY = prevItem[ this.internalAttrs.accHeight ];
                    } else {
                        this.lastContainerOffsetY = 0;
                    }
                });

                this.renderer.setStyle(
                    this.itemsContainer.nativeElement,
                    'transform',
                    `translateY(${this.lastContainerOffsetY}px)`
                );
            }
        });
    }

    private createViewportInfo(type: RefreshType) {
        let scrollHeight = this.windowScroll ? this.body.scrollHeight : this.ele.scrollHeight;
        let clientHeight = this.windowScroll ? this.body.clientHeight : this.ele.clientHeight;

        // 计算屏幕/容器上、中、下渲染所需高度(px)
        let pages = type === RefreshType.PLACEHOLDER ? this.placeholderPages : this.visiblePages;
        let middleArea = clientHeight;
        let topArea = (pages - 1) / 2 * this.getAdjustFactorByDirection().top * middleArea;
        let bottomArea = (pages - 1) / 2 * this.getAdjustFactorByDirection().bottom * middleArea;

        // 处理滚动条靠近顶部或底部的情况
        topArea = Math.min(topArea, this.lastOffsetY);
        bottomArea = Math.min(bottomArea, scrollHeight - clientHeight - this.lastOffsetY);

        // 找到在渲染高度内的条目
        let minArea = this.lastOffsetY - topArea;
        let maxArea = this.lastOffsetY + middleArea + bottomArea;
        let firstItem = this.items.find(item => item[ this.internalAttrs.accHeight ] >= minArea);
        let lastItem = this.items.find(item => item[ this.internalAttrs.accHeight ] >= maxArea);

        let viewportInfo = new ViewportInfo<T>();
        viewportInfo.startIndex = firstItem ? firstItem[ this.internalAttrs.index ] : 0;
        viewportInfo.startItem = this.items[ viewportInfo.startIndex ];
        viewportInfo.endIndex = lastItem ? lastItem[ this.internalAttrs.index ] : this.items.length - 1;
        viewportInfo.endItem = this.items[ viewportInfo.endIndex ];

        return viewportInfo;
    }

    private createItemsChange(viewportInfo: ViewportInfo<T>, type: RefreshType) {
        let lastViewportInfo = type === RefreshType.PLACEHOLDER ? this.lastViewportInfo : this.lastVisibleViewportInfo;
        let itemChanges = new ItemChanges<T>();

        itemChanges.all = this.items.slice(viewportInfo.startIndex, viewportInfo.endIndex + 1);

        if (!lastViewportInfo) {
            itemChanges.added = itemChanges.all;
            itemChanges.removed = [];
            itemChanges.maintained = [];
        } else if (this.scrollDirection === ScrollDirection.DOWN
            && viewportInfo.startIndex <= lastViewportInfo.endIndex) {
            itemChanges.added = this.items.slice(lastViewportInfo.endIndex + 1, viewportInfo.endIndex + 1);
            itemChanges.removed = this.items.slice(lastViewportInfo.startIndex, viewportInfo.startIndex);
            itemChanges.maintained = this.items.slice(viewportInfo.startIndex, lastViewportInfo.endIndex + 1);
        } else if (this.scrollDirection === ScrollDirection.UP
            && lastViewportInfo.startIndex <= viewportInfo.endIndex) {
            itemChanges.added = this.items.slice(viewportInfo.startIndex, lastViewportInfo.startIndex);
            itemChanges.removed = this.items.slice(viewportInfo.endIndex + 1, lastViewportInfo.endIndex + 1);
            itemChanges.maintained = this.items.slice(lastViewportInfo.startIndex, viewportInfo.endIndex + 1);
        } else {
            itemChanges.added = itemChanges.all;
            itemChanges.removed = this.items.slice(lastViewportInfo.startIndex, lastViewportInfo.endIndex + 1);
            itemChanges.maintained = [];
        }

        return itemChanges;
    }

    private getAdjustFactorByDirection() {
        if (this.scrollDirection === ScrollDirection.UP) {
            return { top: 1 + this.adjustFactor, bottom: 1 - this.adjustFactor };
        } else {
            return { top: 1 - this.adjustFactor, bottom: 1 + this.adjustFactor };
        }
    }

    private setHostStyles() {
        if (!this.windowScroll && this.containerMaxHeight > 0) {
            this.renderer.setStyle(this.ele, 'max-height', this.containerMaxHeight + 'px');
            this.renderer.setStyle(this.ele, 'overflow-x', 'hidden');
            this.renderer.setStyle(this.ele, 'overflow-y', 'auto');
        }
    }

    private getNativeHeight(item: T) {
        let context = this.windowScroll ? document : this.ele;
        let ele = context.querySelector('#' + item[ this.internalAttrs.id ]);

        return ele ? (ele as HTMLElement).offsetHeight : 0;
    }

    private createItemRenderContext(item: T) {
        return new NgForOfContext(item, null, item[ this.internalAttrs.index ], this.items.length);
    }

    private bindEvents() {
        const scrollScheduler = typeof requestAnimationFrame !== 'undefined' ? animationFrameScheduler : asapScheduler;

        this.subscription.add(
            merge(
                fromEvent(window, 'resize'),
                fromEvent(this.windowScroll ? window : this.ele, 'scroll').pipe(
                    auditTime(this.auditTime, scrollScheduler),
                    map(() => {
                        if (!this.manualScrolling) {
                            this.cacheScrollParams();
                            this.refreshPlaceholders();
                        }
                    })
                )
            ).pipe(debounceTime(this.debounceTime))
             .subscribe(() => {
                 if (!this.manualScrolling) {
                     this.refreshVisibles();
                 }
             })
        );

        // 合并多个条目高度变化事件，减少刷新次数
        this.subscription.add(
            this.heightChangeSubject
                .asObservable()
                .pipe(debounceTime(this.observeIntervalTime))
                .subscribe(() => {
                    this.refresh();
                    this.observedItemsChanges.emit();
                })
        );
    }

    private cacheScrollParams() {
        if (this.windowScroll) {
            if (window.pageYOffset > this.lastOffsetY) {
                this.scrollDirection = ScrollDirection.DOWN;
            } else if (window.pageYOffset < this.lastOffsetY) {
                this.scrollDirection = ScrollDirection.UP;
            }

            this.lastOffsetY = window.pageYOffset;
        } else {
            if (this.ele.scrollTop > this.lastOffsetY) {
                this.scrollDirection = ScrollDirection.DOWN;
            } else if (this.ele.scrollTop < this.lastOffsetY) {
                this.scrollDirection = ScrollDirection.UP;
            }

            this.lastOffsetY = this.ele.scrollTop;
        }

        if (!this.scrollDirection) {
            this.scrollDirection = ScrollDirection.DOWN;
        }
    }

    private fixPageParams() {
        // 参数容错
        this.visiblePages = Math.max(1.5, this.visiblePages);
        this.placeholderPages = Math.max(this.visiblePages, this.placeholderPages);
        this.adjustFactor = Math.max(0, Math.min(1, this.adjustFactor));
    }
}