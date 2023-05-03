class MessageComponent {
    state = {
        name: "Orion Electron"
    };
    template = `<h1> Hi my name is {orion}</h1>`;
    constructor(state) {
        this.state = state;
    }

    setState(state) {
        this.state = state;
        return this.render();
    }

    render() {
        let final_template = template.replace(/{([^{}]+)}/g, function (keyExpr, key) {

            return this.state[key] || "";



        });
        return final_template;
    }
}