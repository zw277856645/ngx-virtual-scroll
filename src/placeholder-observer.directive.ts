import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import { VirtualScrollComponent } from './virtual-scroll.component';
import { ItemInternalAttrs } from './models';

@Directive({
    selector: '[placeholderObserver]'
})
export class PlaceholderObserverDirective<T> implements OnInit {

    @Input() item: T;

    private internalAttrs: ItemInternalAttrs;

    private readonly ele: HTMLElement;

    constructor(private virtualScroll: VirtualScrollComponent<T>,
                private eleRef: ElementRef) {
        this.ele = eleRef.nativeElement;
        this.internalAttrs = virtualScroll.internalAttrs;
    }

    ngOnInit() {
        let curHeight = this.virtualScroll.dynamicHeight(this.item);
        if (curHeight > 0) {
            let dynamicHeight = this.item[ this.internalAttrs.dynamicHeight ];
            let height = this.item[ this.internalAttrs.height ];

            curHeight += this.virtualScroll.verticalGap;
            curHeight = Math.max(this.item[ this.internalAttrs.height ], curHeight);

            if ((!dynamicHeight && height !== curHeight)
                || (dynamicHeight && dynamicHeight !== curHeight)) {
                this.item[ this.internalAttrs.dynamicHeight ] = curHeight;
                this.virtualScroll.refresh(true, { onlyRefreshLayout: true });
            }
        }
    }

}