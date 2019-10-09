import { Component } from '@angular/core';

@Component({
    templateUrl: './demo-window.component.html',
    styleUrls: [ './demo-window.component.less' ]
})
export class DemoWindowComponent {

    list: { name: string }[] = [];

    constructor() {
        for (let i = 0; i < 5000; i++) {
            this.list.push({
                name: 'item-' + (i + 1)
            });
        }
    }

}
