import { Component } from '@angular/core';
import { fade } from '@demacia/cmjs-lib';

@Component({
    templateUrl: './demo-common.component.html',
    styleUrls: [ './demo-common.component.less' ],
    animations: [ fade({ duration: 500 }) ]
})
export class DemoCommonComponent {

    list: { name: string }[] = [];
    windowScroll = true;
    containerMaxHeight = 400;
    showPlaceholders = true;
    visiblePages = 3;
    placeholderPages = 3;
    itemHeight = 40;
    itemGap = 10;
    auditTime = 0;
    debounceTime = 300;
    randomHeight = false;
    multiseriate = false;
    itemWidth = 160;
    randomWidth = false;

    constructor() {
        for (let i = 0; i < 5000; i++) {
            this.list.push({
                name: 'item-' + (i + 1)
            });
        }
    }

    getRandomHeight(item: any, index: number) {
        return Math.max(Math.trunc(Math.random() * 200), 25);
    }

    getRandomWidth(item: any, index: number) {
        return Math.max(Math.trunc(Math.random() * 200), 80);
    }

    minus(attr: string, value: number, min?: number) {
        this[ attr ] = this[ attr ] - value;
        if (min !== null && min !== undefined) {
            this[ attr ] = Math.max(this[ attr ], min);
        }
    }

    plus(attr: string, value: number, max?: number) {
        this[ attr ] = this[ attr ] + value;
        if (max !== null && max !== undefined) {
            this[ attr ] = Math.min(this[ attr ], max);
        }
    }
}
