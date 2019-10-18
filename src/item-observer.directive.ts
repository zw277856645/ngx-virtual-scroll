import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, Output, Renderer2 } from '@angular/core';
import { VirtualScrollComponent } from './virtual-scroll.component';
import { Subject, Subscription, timer } from 'rxjs';
import { debounceTime, first, map, pairwise, skipWhile, switchMap, switchMapTo, take } from 'rxjs/operators';
import { ItemInternalAttrs } from './models';

@Directive({
    selector: '[itemObserver]'
})
export class ItemObserverDirective<T> implements OnDestroy, AfterViewInit {

    @Input() item: T;

    @Output() heightChanged = new EventEmitter();

    private internalAttrs: ItemInternalAttrs;
    private mutationObserver: MutationObserver;
    private subject = new Subject();
    private subscription = new Subscription();

    private readonly ele: HTMLElement;

    constructor(private virtualScroll: VirtualScrollComponent<T>,
                private renderer: Renderer2,
                private eleRef: ElementRef) {
        this.ele = eleRef.nativeElement;
        this.internalAttrs = virtualScroll.internalAttrs;

        this.subscription.add(
            this.subject
                .asObservable()
                .pipe(
                    debounceTime(this.virtualScroll.observeIntervalTime),
                    switchMapTo(
                        timer(0, this.virtualScroll.observeIntervalTime).pipe(
                            map(() => this.ele.offsetHeight),
                            pairwise(),
                            skipWhile(heights => heights[ 0 ] !== heights[ 1 ]),
                            first(),
                            // 首次等到高度固定后继续以一个较长时间间隔检测高度，防止因卡顿导致高度读取不准确
                            switchMap(([ height ]) => {
                                return timer(0, this.virtualScroll.observeIntervalTime * 3).pipe(
                                    map(i => i === 0 ? height : this.ele.offsetHeight),
                                    take(5)
                                );
                            }),
                            map(height => Math.max(this.item[ this.internalAttrs.height ], height))
                        )
                    )
                )
                .subscribe(offsetHeight => {
                    let dynamicHeight = this.item[ this.internalAttrs.dynamicHeight ];
                    let height = this.item[ this.internalAttrs.height ];

                    if ((!dynamicHeight && height !== offsetHeight)
                        || (dynamicHeight && dynamicHeight !== offsetHeight)) {
                        this.item[ this.internalAttrs.dynamicHeight ] = offsetHeight;
                        this.refreshLayout();
                        this.heightChanged.emit();
                    }
                })
        );
    }

    ngAfterViewInit() {
        // 可视条目高度变化会被自动跟踪，但是存在非可视条目高度被改变的情况，在初始化时，对此相关的条目做一次检查
        if (this.item[ this.internalAttrs.dynamicHeight ] !== this.item[ this.internalAttrs.height ]) {
            this.subject.next();
        }

        this.mutationObserver = new MutationObserver(() => this.subject.next());
        this.mutationObserver.observe(this.ele, { childList: true, subtree: true });
    }

    ngOnDestroy() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }

        this.subscription.unsubscribe();
    }

    private refreshLayout() {
        if (this.virtualScroll.items.length && this.virtualScroll.totalHeight) {
            let height = this.virtualScroll.items.reduce((prev, cur) => {
                cur[ this.internalAttrs.accHeight ] = prev
                    + (cur[ this.internalAttrs.dynamicHeight ] || cur[ this.internalAttrs.height ]);

                return cur[ this.internalAttrs.accHeight ];
            }, 0);

            this.renderer.setStyle(this.virtualScroll.totalHeight.nativeElement, 'height', height + 'px');
        }
    }

}