import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { interval, Subject, Subscription, timer } from 'rxjs';
import { first, map, pairwise, skipWhile, takeWhile } from 'rxjs/operators';

@Directive({
    selector: '[scrollListItem]',
    exportAs: 'scrollListItem'
})
export class ScrollListItemDirective implements AfterViewInit, OnDestroy {

    static changeObserver = new Subject();
    static detachScrollObserver = new Subject();
    static attachScrollObserver = new Subject();

    @Input() alwaysShow: boolean;
    @Input() heightChangeDebounce: number = 350;

    @Input() set heightChangeObserver(heightChangeObserver: any) {
        if (this._heightChangeObserver !== heightChangeObserver) {
            if (this.heightChangeSub) {
                this.heightChangeSub.unsubscribe();
            }

            // 高度变化抖动时间大于滚动变化抖动时间，有可能会先触发scroll refresh，但是高度还没重新计算好。
            // 次场景下，先取消scroll监听，height change refresh后再重新绑定
            if (this.heightChangeDebounce > 200) {
                ScrollListItemDirective.detachScrollObserver.next();
            }

            this.heightChangeSub =
                timer(this.heightChangeDebounce, this.heightChangeDebounce / 2).pipe(
                    map(() => this.getEleHeight()),
                    pairwise(),
                    skipWhile(([ prev, next ]) => prev !== next),
                    first()
                ).subscribe(() => {
                    this.heightChange();

                    if (this.heightChangeDebounce > 200) {
                        ScrollListItemDirective.attachScrollObserver.next();
                    }
                });
        }
        this._heightChangeObserver = heightChangeObserver;
    }

    @Output() vsEnter = new EventEmitter();
    @Output() vsLeave = new EventEmitter();

    visible: boolean;
    height: number;

    private $ele: JQuery;
    private _heightChangeObserver: any;
    private heightChangeSub: Subscription;
    private intervalSub: Subscription;

    constructor(private ele: ElementRef) {
        this.$ele = $(ele.nativeElement);
    }

    ngAfterViewInit() {
        this.height = this.getEleHeight();
    }

    ngOnDestroy() {
        if (this.heightChangeSub) {
            this.heightChangeSub.unsubscribe();
        }
        if (this.intervalSub) {
            this.intervalSub.unsubscribe();
        }
    }

    heightChange(delay: number = 0, refresh: boolean = true) {
        setTimeout(() => {
            this.height = this.getEleHeight();

            if (this.intervalSub) {
                this.intervalSub.unsubscribe();
            }

            this.intervalSub =
                interval(1000).pipe(
                    map(() => this.getEleHeight()),
                    takeWhile(height => {
                        if (height !== this.height) {
                            this.height = height;

                            return true;
                        }

                        return false;
                    })
                ).subscribe();

            if (refresh) {
                ScrollListItemDirective.changeObserver.next();
            }
        }, delay);
    }

    private getEleHeight() {
        return this.$ele.outerHeight(true);
    }
}