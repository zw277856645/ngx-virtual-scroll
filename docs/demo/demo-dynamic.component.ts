import { Component } from '@angular/core';
import { fade } from '@demacia/cmjs-lib';
import { resultAnim } from './result.animation';

@Component({
    templateUrl: './demo-dynamic.component.html',
    styleUrls: [
        './demo-common.component.less',
        './demo-dynamic.component.less'
    ],
    animations: [
        fade({ duration: 500 }),
        resultAnim()
    ]
})
export class DemoDynamicComponent {

    list: { name: string, open: boolean, resultHeight: number }[] = [];

    constructor() {
        for (let i = 0; i < 5000; i++) {
            this.list.push({
                name: 'item-' + (i + 1),
                open: false,
                resultHeight: this.getRandomHeight()
            });
        }
    }

    getRandomHeight() {
        return Math.max(Math.trunc(Math.random() * 250), 40);
    }

    // 可以加快收缩时的布局刷新
    dynamicHeight(item: { open: boolean }) {
        if (!item.open) {
            return 80;
        }
    }
}