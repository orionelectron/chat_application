class Component {
    state = {};
    template = "";

    constructor(state = {}) {
        this.state = state;
    }

    setState(state) {
        this.state = state;
        const result = this.render();
        return result;
    }

    render() {
        let final_template = this.template.replace(/{([^{}]+)}/g, function (keyExpr, key) {
            return this.state[key] || "";
        }.bind(this));
        console.log(final_template);
        return final_template;
    }
}

class MessageComponent extends Component {
    state = {
        name: "Orion Electron"
    };
    template = `<h1> Hi my name is {name}</h1>`;


}

let message = new MessageComponent();
message.render();
message.setState({ name: "pawan Kandel" });
