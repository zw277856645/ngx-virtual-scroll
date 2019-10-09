window.$docsify = {
    loadSidebar: true,
    subMaxLevel: 3,
    coverpage: true,
    auto2top: true,
    homepage: 'demo.md',
    repo: 'https://gitlab.com/zw277856645/ngx-virtual-scroll',
    plugins: [
        DemoBoxAngular.create({
            project: {
                dependencies: {
                    "cmjs-lib": "0.7.1"
                }
            }
        })
    ]
};