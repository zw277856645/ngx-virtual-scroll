import {
    ContentChildren, Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList
} from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { ScrollListItemDirective } from './scroll-list-item.directive';
import { debounceTime } from 'rxjs/operators';
import { isNullOrUndefined } from '../../../core/util/util';

enum Condition {
    ENABLE, DISABLE
}

@Directive({
    selector: '[scrollList]',
    exportAs: 'scrollList'
})
export class ScrollListDirective implements OnDestroy, OnInit {

    @ContentChildren(ScrollListItemDirective) childs: QueryList<ScrollListItemDirective>;

    // item数量小于等于disableNum禁用本功能
    @Input() disableNum: number;

    // 是否是全局window滚动
    @Input() winScroll = true;

    // 数据变化触发刷新的抖动时间
    @Input() itemsRefreshDebounce = 500;

    // 可视区域上下缓存高度系数，相对于可视区域高度
    @Input() cacheFactor: number = 0.5;

    @Output() afterRefresh = new EventEmitter();

    private mutationObserver: MutationObserver;
    private subscription: Subscription;
    private scrollSubscription: Subscription;
    private refreshFlag: any;
    private obserFlag: any;
    private condition: Condition;

    private contextHeight: number;
    private clientHeight: number;
    private $context: JQuery;
    private $win = $(window);

    constructor(private ele: ElementRef) {
    }

    ngOnInit() {
        this.mutationObserver = new MutationObserver(() => {
            clearTimeout(this.obserFlag);
            this.obserFlag = setTimeout(() => this.checkDisable(), this.itemsRefreshDebounce);
        });
        this.mutationObserver.observe(this.ele.nativeElement, { childList: true });
    }

    ngOnDestroy() {
        this.unbindEvents();
        this.mutationObserver.disconnect();
        clearTimeout(this.obserFlag);
        clearTimeout(this.refreshFlag);
    }

    refresh(delay: number = 0) {
        clearTimeout(this.refreshFlag);
        this.refreshFlag = setTimeout(() => {
            if (this.winScroll) {
                this.clientHeight = this.$win.height();
                this.contextHeight = this.$context.height();
            } else {
                this.clientHeight = this.$context.height();
                this.contextHeight = this.$context.prop('scrollHeight');
            }

            this.setVisibleItems();
        }, delay);
    }

    detachScrollListener() {
        if (this.scrollSubscription) {
            this.scrollSubscription.unsubscribe();
        }
    }

    attachScrollListener() {
        if (!this.scrollSubscription || this.scrollSubscription.closed) {
            this.scrollSubscription =
                fromEvent(this.$context[ 0 ], 'scroll').pipe(debounceTime(200)).subscribe(() => this.refresh());
        }
    }

    private setVisibleItems() {
        if (!this.childs || !this.childs.length) {
            return;
        }

        let scrollTop = this.$context.scrollTop();
        let topArea = Math.max(scrollTop - this.clientHeight * this.cacheFactor, 0);
        let bottomArea = Math.min(scrollTop + this.clientHeight * (1 + this.cacheFactor), this.contextHeight);
        let accumHeight = 0;

        this.childs.forEach(child => {
            accumHeight += child.height || 0;

            let visible = child.alwaysShow ? true : accumHeight >= topArea && accumHeight <= bottomArea;
            if (visible !== child.visible) {
                visible ? child.vsEnter.emit() : child.vsLeave.emit();
            }
            child.visible = visible;
        });

        this.afterRefresh.emit();
    }

    private checkDisable() {
        if (!this.childs || !this.childs.length) {
            return;
        }

        if (!isNullOrUndefined(this.disableNum) && this.childs.length <= +this.disableNum) {
            if (this.condition !== Condition.DISABLE) {
                this.condition = Condition.DISABLE;
                this.unbindEvents();
            }

            this.childs.forEach(child => child.visible = true);
            this.afterRefresh.emit();
        } else {
            if (this.condition !== Condition.ENABLE) {
                this.condition = Condition.ENABLE;
                this.bindEvents();
            }

            this.refresh();
        }
    }

    private bindEvents() {
        this.subscription = new Subscription();
        this.$context = this.winScroll ? $(document) : $(this.ele.nativeElement);
        this.attachScrollListener();

        this.subscription.add(
            ScrollListItemDirective.changeObserver.pipe(debounceTime(100)).subscribe(() => this.refresh())
        );

        this.subscription.add(
            ScrollListItemDirective.detachScrollObserver.subscribe(() => this.detachScrollListener())
        );

        this.subscription.add(
            ScrollListItemDirective.attachScrollObserver.subscribe(() => this.attachScrollListener())
        );
    }

    private unbindEvents() {
        this.scrollSubscription && this.scrollSubscription.unsubscribe();
        this.subscription && this.subscription.unsubscribe();
    }
}
