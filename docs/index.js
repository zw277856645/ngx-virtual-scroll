window.$docsify = {
    loadSidebar: true,
    subMaxLevel: 4,
    coverpage: true,
    auto2top: true,
    homepage: 'demo.md',
    repo: 'https://gitlab.com/zw277856645/ngx-virtual-scroll',
    plugins: [
        DemoBoxAngular.create({
            project: {
                dependencies: {
                    "@angular/forms": "8.1.2",
                    "@demacia/cmjs-lib": "0.0.1",
                    "@demacia/ngx-virtual-scroll": "0.0.10",
                    "bootstrap-switch": "3.3.2",
                    "jw-bootstrap-switch-ng2": "2.0.5"
                }
            },
            extraModules: {
                "FormsModule": "@angular/forms",
                "VirtualScrollModule": "@demacia/ngx-virtual-scroll",
                "JwBootstrapSwitchNg2Module": "jw-bootstrap-switch-ng2"
            }
        })
    ]
};