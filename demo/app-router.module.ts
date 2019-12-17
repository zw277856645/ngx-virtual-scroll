import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { DemoCommonComponent } from './app/demo-common.component';
import { DemoDynamicComponent } from './app/demo-dynamic.component';

const routes: Routes = [
    {
        path: 'common',
        component: DemoCommonComponent
    },
    {
        path: 'dynamic',
        component: DemoDynamicComponent
    },
    {
        path: '',
        redirectTo: 'common',
        pathMatch: 'full'
    }
];

@NgModule({
    imports: [ RouterModule.forRoot(routes, { useHash: true }) ],
    exports: [ RouterModule ]
})
export class AppRouterModule {
}