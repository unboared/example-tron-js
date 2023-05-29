class TronGamepad {
        constructor() {
                let that = this

                // Instanciate & Initialize Unboared API
                that.unboared = new Unboared.Game();
                that.unboared.init();

                // Listen to onReady event
                that.unboared.onReady(() => {
                        // Changes the color of the buttons according to the player's one
                        let elems = document.getElementsByClassName(
                                "button")
                        for (let i = 0; i < elems.length; i++) {
                                elems[i].style.color = that.unboared.getColor()
                        }
                })

                // Start unboared (= start listening to events)
                that.unboared.start();

                // This section allows to handle the ontouchstart event
                // on every device (mobile and computer).
                // Simply copy/paste this in your code to enable it.
                if (!("ontouchstart" in document.createElement("div"))) {
                        var elements = document.getElementsByTagName("*");
                        for (var i = 0; i < elements.length; ++i) {
                                var element = elements[i];
                                var ontouchstart = element.getAttribute("ontouchstart");
                                if (ontouchstart) {
                                        element.setAttribute("onmousedown", ontouchstart);
                                }
                                var ontouchend = element.getAttribute("ontouchend");
                                if (ontouchend) {
                                        element.setAttribute("onmouseup", ontouchend);
                                }
                        }
                }
        }

        // Sends a message to the screen
        sendMessageToScreen(msg, data) {
                this.unboared.emitAction(msg, data);
        }
}